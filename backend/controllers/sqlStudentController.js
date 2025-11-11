const asyncHandler = require('express-async-handler');
const { getMySqlPool } = require('../config/mysql');
const { User } = require('../models/userModel');

const DEFAULT_STUDENT_TABLE = 'students';

const deriveValue = (record, possibleKeys, fallback = null) => {
  for (const key of possibleKeys) {
    if (key in record && record[key] !== null && record[key] !== undefined) {
      return record[key];
    }
  }
  return fallback;
};

const normalizeStudentRow = (row) => {
  const id =
    deriveValue(row, ['id', 'ID', 'student_id', 'studentId', 'roll_no', 'rollNo']) ??
    deriveValue(row, ['uuid', 'userId', 'user_id']);

  const firstName = deriveValue(row, ['first_name', 'firstName', 'fname', 'first']);
  const lastName = deriveValue(row, ['last_name', 'lastName', 'lname', 'last']);
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();

  const name =
    deriveValue(row, ['name', 'student_name', 'studentName', 'full_name', 'fullName']) ||
    combinedName ||
    (typeof row === 'object' ? JSON.stringify(row) : 'Unknown');

  const pin =
    deriveValue(row, [
      'pin_number',
      'pinNumber',
      'pin_no',
      'pinNo',
      'pin',
      'PIN',
      'pin_num',
      'pinNum',
      'pin_nbr',
      'pinNbr',
    ]) || null;

  const secondaryId =
    deriveValue(row, ['student_id', 'studentId', 'roll_no', 'rollNo', 'registration_no', 'registrationNo']) ||
    id ||
    null;

  const preferredId = pin || secondaryId;

  const course = deriveValue(row, ['course', 'course_name', 'courseName', 'program', 'programme'], 'N/A');
  const yearValue = deriveValue(row, ['year', 'year_of_study', 'yearOfStudy', 'current_year', 'stud_year', 'semester_year'], null);
  const semesterValue = deriveValue(row, ['semester', 'current_semester', 'semester_no', 'sem', 'sem_no'], null);
  const branch = deriveValue(row, ['branch', 'department', 'dept', 'department_name'], 'N/A');

  return {
    id: id ?? preferredId ?? `${name}-${course}`,
    name,
    studentId: preferredId ?? 'N/A',
    pin: pin || null,
    alternateId: secondaryId || null,
    course,
    year: yearValue !== null && yearValue !== undefined ? Number(yearValue) || yearValue : 'N/A',
    semester: semesterValue !== null && semesterValue !== undefined ? Number(semesterValue) || semesterValue : null,
    branch,
    _sourceRow: row,
  };
};

const getSqlStudents = asyncHandler(async (req, res) => {
  const pool = getMySqlPool();
  if (!pool) {
    res.status(500);
    throw new Error('MySQL pool is not configured. Check environment variables.');
  }

  const tableName = process.env.DB_STUDENTS_TABLE || DEFAULT_STUDENT_TABLE;
  const sql = `SELECT * FROM \`${tableName}\``;

  try {
    const [rows] = await pool.query(sql);

    if (!Array.isArray(rows)) {
      res.status(200).json([]);
      return;
    }

    const normalized = rows.map(normalizeStudentRow);
    res.json({
      count: normalized.length,
      table: tableName,
      rows: normalized,
    });
  } catch (error) {
    console.error('[MySQL] Failed to fetch student records:', error);
    const status = error?.code === 'ER_NO_SUCH_TABLE' ? 404 : 500;
    res.status(status);
    throw new Error(
      error?.code === 'ER_NO_SUCH_TABLE'
        ? `Table "${tableName}" not found in the configured database.`
        : error.message || 'Failed to fetch students from MySQL.',
    );
  }
});

const ensureString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const isMeaningful = (value) => {
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  if (!str) return false;
  return str.toLowerCase() !== 'n/a';
};

const getDefaultPassword = () => process.env.SQL_STUDENT_DEFAULT_PASSWORD || 'Sync@123';
const getEmailDomain = () => process.env.SQL_STUDENT_EMAIL_DOMAIN || 'mysql-sync.pydah.com';

const syncSqlStudents = asyncHandler(async (req, res) => {
  const pool = getMySqlPool();
  if (!pool) {
    res.status(500);
    throw new Error('MySQL pool is not configured. Check environment variables.');
  }

  const tableName = process.env.DB_STUDENTS_TABLE || DEFAULT_STUDENT_TABLE;
  const sql = `SELECT * FROM \`${tableName}\``;

  const summary = {
    table: tableName,
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const [rows] = await pool.query(sql);
    if (!Array.isArray(rows) || rows.length === 0) {
      res.json({ ...summary, message: 'No records found in MySQL table.' });
      return;
    }

    const normalized = rows.map(normalizeStudentRow);
    summary.total = normalized.length;

    const uniqueIds = new Set();
    normalized.forEach((student) => {
      const preferredId = ensureString(student.pin) || ensureString(student.studentId);
      const alternateId = ensureString(student.alternateId);
      if (preferredId) uniqueIds.add(preferredId);
      if (alternateId) uniqueIds.add(alternateId);
    });

    const existingUsers = await User.find({ studentId: { $in: Array.from(uniqueIds).filter(Boolean) } });
    const userMap = new Map(existingUsers.map((user) => [ensureString(user.studentId), user]));

    for (const student of normalized) {
      const name = ensureString(student.name);
      const preferredId = ensureString(student.pin) || ensureString(student.studentId);
      const fallbackId = ensureString(student.alternateId);
      const studentId = preferredId || fallbackId;

      if (!name || !studentId) {
        summary.skipped += 1;
        continue;
      }

      const course = isMeaningful(student.course) ? ensureString(student.course) : 'General';
      const branch = isMeaningful(student.branch) ? ensureString(student.branch) : '';
      const rawYear = isMeaningful(student.year) ? student.year : 1;
      const yearNumber = Number.parseInt(rawYear, 10);
      const year = Number.isFinite(yearNumber) && yearNumber > 0 ? yearNumber : 1;
      const rawSemester = isMeaningful(student.semester) ? student.semester : null;
      const semesterNumber = rawSemester !== null ? Number.parseInt(rawSemester, 10) : null;
      const semester = semesterNumber && semesterNumber > 0 ? semesterNumber : null;

      try {
        let existing = userMap.get(studentId);
        if (!existing && fallbackId) {
          existing = userMap.get(fallbackId);
        }
        if (existing) {
          let changed = false;
          if (existing.name !== name) {
            existing.name = name;
            changed = true;
          }
          if (course && existing.course !== course) {
            existing.course = course;
            changed = true;
          }
          if (existing.year !== year) {
            existing.year = year;
            changed = true;
          }
          if (existing.branch !== branch) {
            existing.branch = branch;
            changed = true;
          }
          if (semester !== null && existing.semester !== semester) {
            existing.semester = semester;
            changed = true;
          }
          if (preferredId && existing.studentId !== preferredId) {
            existing.studentId = preferredId;
            changed = true;
          }

          if (changed) {
            await existing.save();
            userMap.set(ensureString(existing.studentId), existing);
            summary.updated += 1;
          } else {
            summary.skipped += 1;
          }
        } else {
          const emailDomain = getEmailDomain();
          let email = `${studentId}@${emailDomain}`.toLowerCase();

          // Ensure generated email is unique to prevent duplicate key errors
          let emailCounter = 1;
          // eslint-disable-next-line no-await-in-loop
          while (await User.findOne({ email })) {
            email = `${studentId}+${emailCounter}@${emailDomain}`.toLowerCase();
            emailCounter += 1;
          }

          const newUser = new User({
            name,
            studentId,
            course,
            year,
            semester,
            branch,
            email,
            password: getDefaultPassword(),
          });

          await newUser.save();
          userMap.set(studentId, newUser);
          summary.inserted += 1;
        }
      } catch (error) {
        console.error(`[MySQL Sync] Failed to sync student ${studentId}:`, error);
        summary.errors.push({
          studentId,
          message: error.message || 'Unknown error',
        });
      }
    }

    res.json({
      ...summary,
      message: `Sync complete for table "${tableName}".`,
    });
  } catch (error) {
    console.error('[MySQL] Failed to sync student records:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to sync MySQL students.');
  }
});

module.exports = {
  getSqlStudents,
  syncSqlStudents,
  normalizeStudentRow,
};


