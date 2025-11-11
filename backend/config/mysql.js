const mysql = require('mysql2/promise');

let pool;

const getMySqlPool = () => {
  const {
    DB_HOST,
    DB_PORT = 3306,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL,
    DB_STUDENTS_TABLE,
  } = process.env;

  if (pool) {
    return pool;
  }

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.warn(
      '[MySQL] Missing required environment variables. Expected DB_HOST, DB_USER, DB_NAME.',
    );
    return null;
  }

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT) || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl:
        typeof DB_SSL === 'string' && DB_SSL.toLowerCase() === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    });
    console.log('[MySQL] Connection pool created.');
    if (DB_STUDENTS_TABLE) {
      console.log(`[MySQL] Using table override: ${DB_STUDENTS_TABLE}`);
    }
    pool.on('error', (err) => {
      console.error('[MySQL] Pool error:', err);
    });
  } catch (error) {
    console.error('[MySQL] Failed to create connection pool:', error);
    pool = null;
  }

  return pool;
};

module.exports = {
  getMySqlPool,
};

