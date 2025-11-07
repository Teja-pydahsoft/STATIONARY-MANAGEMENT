import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Receipt, Download, Eye, X, FileText, Calendar, Package, Building2, ChevronLeft, ChevronRight, Users, ClipboardList, AlertCircle } from 'lucide-react';
import { apiUrl } from '../utils/api';
import jsPDF from 'jspdf';

const Reports = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    course: '',
    studentId: '',
    paymentMethod: '',
    isPaid: '',
    startDate: '',
    endDate: '',
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reportType, setReportType] = useState(''); // 'day-end', 'stock', 'vendor-purchase'
  const [receiptSettings, setReceiptSettings] = useState({
    receiptHeader: 'PYDAH COLLEGE OF ENGINEERING',
    receiptSubheader: 'Stationery Management System',
  });
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [reportFilters, setReportFilters] = useState({
    course: '',
    paymentMethod: '',
    isPaid: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    includeItems: false,
    includeSummary: true,
    // For stock report
    productCategory: '',
    // For vendor purchase report
    vendor: '',
  });
  const [vendors, setVendors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('transactions');
  const [dueFilters, setDueFilters] = useState({
    search: '',
    course: '',
    year: '',
  });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const tabs = [
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'student-due', label: 'Student Due', icon: Users },
  ];

  useEffect(() => {
    fetchTransactions();
    fetchStudents();
    fetchVendors();
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(apiUrl('/api/settings'));
      if (response.ok) {
        const data = await response.json();
        setReceiptSettings({
          receiptHeader: data.receiptHeader || 'PYDAH COLLEGE OF ENGINEERING',
          receiptSubheader: data.receiptSubheader || 'Stationery Management System',
        });
      }
    } catch (error) {
      console.warn('Failed to load receipt settings:', error.message || error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(apiUrl('/api/vendors'));
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      const response = await fetch(apiUrl('/api/products'));
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError(error.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.course) queryParams.append('course', filters.course);
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.isPaid !== '') queryParams.append('isPaid', filters.isPaid);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(apiUrl(`/api/transactions?${queryParams.toString()}`));
      if (response.ok) {
        const data = await response.json();
        // Filter by date range on client side if needed
        let filteredData = data;
        if (filters.startDate || filters.endDate) {
          filteredData = data.filter(transaction => {
            const transDate = new Date(transaction.transactionDate);
            if (filters.startDate && transDate < new Date(filters.startDate)) return false;
            if (filters.endDate && transDate > new Date(filters.endDate + 'T23:59:59')) return false;
            return true;
          });
        }
        setTransactions(filteredData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(apiUrl('/api/users'));
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        const uniqueCourses = Array.from(new Set(data.map(s => s.course)));
        setCourses(uniqueCourses);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const normalizeValue = (value) => {
    if (!value) return '';
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const getItemKey = (name = '') => String(name).toLowerCase().replace(/\s+/g, '_');

  const getProductYears = (product) => {
    if (!product) return [];
    const fromArray = Array.isArray(product.years) ? product.years : [];
    const normalized = fromArray
      .map(Number)
      .filter(year => !Number.isNaN(year) && year > 0);

    if (normalized.length > 0) {
      return normalized;
    }

    const fallbackYear = Number(product.year);
    if (!Number.isNaN(fallbackYear) && fallbackYear > 0) {
      return [fallbackYear];
    }

    return [];
  };

  const courseOptions = useMemo(() => {
    return [...courses]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const yearOptions = useMemo(() => {
    const years = new Set();
    students.forEach(student => {
      const numericYear = Number(student.year);
      if (!Number.isNaN(numericYear) && numericYear > 0) {
        years.add(numericYear);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [students]);

  const dueStudents = useMemo(() => {
    if (!students.length || !products.length) return [];

    const records = students.map(student => {
      const studentCourse = normalizeValue(student.course);
      const studentYear = Number(student.year);
      const studentBranch = normalizeValue(student.branch);

      const mappedProducts = products.filter(product => {
        const productCourse = normalizeValue(product.forCourse);
        if (!productCourse) return false;
        if (productCourse !== studentCourse) return false;

        const productBranch = normalizeValue(product.branch);
        if (productBranch && productBranch !== studentBranch) return false;

        const productYears = getProductYears(product);
        if (productYears.length > 0 && !productYears.includes(studentYear)) return false;

        return true;
      });

      if (!mappedProducts.length) {
        return null;
      }

      const itemsMap = student.items || {};
      const pendingItems = mappedProducts.filter(product => {
        const key = getItemKey(product.name);
        return !itemsMap[key];
      });

      if (!pendingItems.length) {
        return null;
      }

      const issuedCount = mappedProducts.length - pendingItems.length;
      const mappedValue = mappedProducts.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
      const pendingValue = pendingItems.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
      const issuedValue = Math.max(mappedValue - pendingValue, 0);

      return {
        student,
        mappedProducts,
        pendingItems,
        issuedCount,
        mappedValue,
        pendingValue,
        issuedValue,
      };
    }).filter(Boolean);

    return records.sort((a, b) => {
      const courseCompare = (a.student.course || '').localeCompare(b.student.course || '');
      if (courseCompare !== 0) return courseCompare;

      const yearDifference = Number(a.student.year) - Number(b.student.year);
      if (yearDifference !== 0) return yearDifference;

      return (a.student.name || '').localeCompare(b.student.name || '');
    });
  }, [students, products]);

  const filteredDueStudents = useMemo(() => {
    const searchValue = dueFilters.search.trim().toLowerCase();
    const selectedCourse = normalizeValue(dueFilters.course);
    const selectedYear = Number(dueFilters.year);

    return dueStudents.filter(record => {
      const { student } = record;
      if (selectedCourse && normalizeValue(student.course) !== selectedCourse) return false;
      if (!Number.isNaN(selectedYear) && selectedYear > 0 && Number(student.year) !== selectedYear) return false;

      if (searchValue) {
        const matchesSearch =
          student.name?.toLowerCase().includes(searchValue) ||
          student.studentId?.toLowerCase().includes(searchValue);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [dueStudents, dueFilters]);

  const dueStats = useMemo(() => {
    const totalPendingItems = filteredDueStudents.reduce((sum, record) => sum + record.pendingItems.length, 0);
    const totalPendingAmount = filteredDueStudents.reduce((sum, record) => sum + record.pendingValue, 0);
    const impactedCourses = new Set(
      filteredDueStudents.map(record => (record.student.course || '').toUpperCase())
    );

    return {
      totalStudents: filteredDueStudents.length,
      totalPendingItems,
      totalPendingAmount,
      impactedCourses: impactedCourses.size,
    };
  }, [filteredDueStudents]);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/transactions/${transactionId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransactions(prev => prev.filter(t => t._id !== transactionId));
        alert('Transaction deleted successfully');
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toFixed(2)}`;
  };

  const formatCurrencyForPDF = (amount) => {
    // Use 'Rs' instead of ₹ symbol to avoid encoding issues
    return `Rs ${Number(amount || 0).toFixed(2)}`;
  };

  const generateDayEndReport = async (transactions) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Header Section
    pdf.setFontSize(18);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text(receiptSettings.receiptHeader, 74, 12, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'normal');
    pdf.text(receiptSettings.receiptSubheader, 74, 18, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('Day-End Transaction Report', 74, 24, { align: 'center' });
    
    // Draw line under header
    pdf.setDrawColor(200, 200, 200);
    pdf.line(14, 28, 134, 28);
    
    let yPos = 34;

    // Report Info Section
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Report Information', 14, yPos);
    yPos += 5;
    pdf.setFont(undefined, 'normal');
    
    if (reportFilters.startDate || reportFilters.endDate) {
      pdf.text(`Date: ${reportFilters.startDate || 'All'} to ${reportFilters.endDate || 'All'}`, 17, yPos);
      yPos += 4;
    }
    if (reportFilters.course) {
      pdf.text(`Course: ${reportFilters.course.toUpperCase()}`, 17, yPos);
      yPos += 4;
    }
    if (reportFilters.paymentMethod) {
      pdf.text(`Payment: ${reportFilters.paymentMethod.toUpperCase()}`, 17, yPos);
      yPos += 4;
    }
    if (reportFilters.isPaid !== '') {
      pdf.text(`Status: ${reportFilters.isPaid === 'true' ? 'Paid' : 'Unpaid'}`, 17, yPos);
      yPos += 4;
    }
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 17, yPos);
    yPos += 6;

    // Summary Section
    if (reportFilters.includeSummary && transactions.length > 0) {
      const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const paidCount = transactions.filter(t => t.isPaid).length;
      const unpaidCount = transactions.length - paidCount;
      const paidAmount = transactions.filter(t => t.isPaid).reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const unpaidAmount = transactions.filter(t => !t.isPaid).reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(14, yPos - 4, 120, 6, 'F');
      pdf.text('Summary Statistics', 14, yPos);
      yPos += 6;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text(`Total: ${transactions.length}`, 17, yPos);
      yPos += 4;
      pdf.text(`Amount: ${formatCurrencyForPDF(totalAmount)}`, 17, yPos);
      yPos += 4;
      pdf.text(`Paid: ${paidCount} (${formatCurrencyForPDF(paidAmount)})`, 17, yPos);
      yPos += 4;
      pdf.text(`Unpaid: ${unpaidCount} (${formatCurrencyForPDF(unpaidAmount)})`, 17, yPos);
      yPos += 6;
    }

    // Transactions Table Header
    if (transactions.length > 0) {
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(14, yPos - 4, 120, 6, 'F');
      pdf.text('Transaction Details', 14, yPos);
      yPos += 6;

      // Table Headers
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(230, 230, 230);
      pdf.rect(14, yPos - 3, 120, 5, 'F');
      pdf.text('Date', 16, yPos);
      pdf.text('Student', 44, yPos);
      pdf.text('Course', 82, yPos);
      pdf.text('Amount', 104, yPos);
      pdf.text('Status', 126, yPos);
      yPos += 5;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);

      transactions.forEach((transaction, index) => {
        // Check if we need a new page
        if (yPos > 180) {
          pdf.addPage();
          yPos = 14;
          // Redraw table headers on new page
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(8);
          pdf.setFillColor(230, 230, 230);
          pdf.rect(14, yPos - 3, 120, 5, 'F');
          pdf.text('Date', 16, yPos);
          pdf.text('Student', 44, yPos);
          pdf.text('Course', 82, yPos);
          pdf.text('Amount', 104, yPos);
          pdf.text('Status', 126, yPos);
          yPos += 5;
          pdf.setFont(undefined, 'normal');
        }

        const date = new Date(transaction.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const studentName = (transaction.student?.name || 'N/A').substring(0, 16);
        const course = (transaction.student?.course || 'N/A').toUpperCase().substring(0, 8);
        const amount = formatCurrencyForPDF(transaction.totalAmount);
        const status = transaction.isPaid ? 'Paid' : 'Unpaid';

        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(14, yPos - 3, 120, 5, 'F');
        }

        pdf.text(date, 16, yPos);
        pdf.text(studentName, 44, yPos);
        pdf.text(course, 82, yPos);
        pdf.text(amount, 104, yPos);
        pdf.text(status, 126, yPos);
        yPos += 5;

        // Draw separator line
        if (index < transactions.length - 1) {
          pdf.setDrawColor(220, 220, 220);
          pdf.line(14, yPos, 134, yPos);
          yPos += 2;
        }
      });

      yPos += 5;

      // Item Details Section (if enabled)
      if (reportFilters.includeItems) {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(14, yPos - 4, 120, 6, 'F');
        pdf.text('Item Details', 14, yPos);
        yPos += 6;

        transactions.forEach((transaction, transIndex) => {
          if (transaction.items && transaction.items.length > 0) {
            // Check if we need a new page
            if (yPos > 180) {
              pdf.addPage();
              yPos = 14;
            }

            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            pdf.text(`Transaction: ${transaction.transactionId || 'N/A'}`, 16, yPos);
            yPos += 4;

            // Item table header
            pdf.setFontSize(7);
            pdf.setFont(undefined, 'bold');
            pdf.setFillColor(245, 245, 245);
            pdf.rect(16, yPos - 2, 112, 4, 'F');
            pdf.text('Item Name', 18, yPos);
            pdf.text('Qty', 78, yPos);
            pdf.text('Unit Price', 92, yPos);
            pdf.text('Total', 112, yPos);
            yPos += 4;

            pdf.setFont(undefined, 'normal');
            transaction.items.forEach((item, itemIndex) => {
              if (yPos > 180) {
                pdf.addPage();
                yPos = 14;
              }

              const itemName = (item.name || 'N/A').substring(0, 25);
              const itemQty = item.quantity || 0;
              const itemPrice = formatCurrencyForPDF(item.price || 0);
              const itemTotal = formatCurrencyForPDF(item.total || 0);

              pdf.text(`${itemIndex + 1}. ${itemName}`, 18, yPos);
              pdf.text(itemQty.toString(), 78, yPos);
              pdf.text(itemPrice, 92, yPos);
              pdf.text(itemTotal, 112, yPos);
              yPos += 4;
            });

            yPos += 3;
          }
        });
      }
    } else {
      pdf.setFontSize(10);
      pdf.text('No transactions found for the selected filters.', 20, yPos);
    }

    // Footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${i} of ${pageCount}`, 74, 197, { align: 'center' });
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 74, 202, { align: 'center' });
    }

    const fileName = `Day_End_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const generateStockReport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (reportFilters.productCategory) queryParams.append('category', reportFilters.productCategory);
      if (reportFilters.course) queryParams.append('course', reportFilters.course);

      const response = await fetch(apiUrl(`/api/products?${queryParams.toString()}`));
      if (!response.ok) throw new Error('Failed to fetch products for report');
      
      const products = await response.json();

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Section
      pdf.setFontSize(18);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont(undefined, 'bold');
      pdf.text(receiptSettings.receiptHeader, 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text(receiptSettings.receiptSubheader, 105, 22, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont(undefined, 'bold');
      pdf.text('Stock Report', 105, 30, { align: 'center' });
      
      // Draw line under header
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 35, 190, 35);
      
      let yPos = 42;

      // Report Info Section
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text('Report Information', 20, yPos);
      yPos += 6;
      pdf.setFont(undefined, 'normal');
      
      if (reportFilters.course) {
        pdf.text(`Course: ${reportFilters.course.toUpperCase()}`, 25, yPos);
        yPos += 5;
      }
      if (reportFilters.productCategory) {
        pdf.text(`Category: ${reportFilters.productCategory}`, 25, yPos);
        yPos += 5;
      }
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 25, yPos);
      yPos += 8;

      // Summary Section
      if (reportFilters.includeSummary && products.length > 0) {
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);
        const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;
        const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos - 4, 170, 6, 'F');
        pdf.text('Summary Statistics', 20, yPos);
        yPos += 7;
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.text(`Total Products: ${products.length}`, 25, yPos);
        yPos += 5;
        pdf.text(`Total Stock Units: ${totalStock}`, 25, yPos);
        yPos += 5;
        pdf.text(`Total Stock Value: ${formatCurrencyForPDF(totalValue)}`, 25, yPos);
        yPos += 5;
        pdf.text(`Low Stock Items (<10 units): ${lowStockCount}`, 25, yPos);
        yPos += 5;
        pdf.text(`Out of Stock Items: ${outOfStockCount}`, 25, yPos);
        yPos += 8;
      }

      // Stock Details Table
      if (products.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos - 4, 170, 6, 'F');
        pdf.text('Stock Details', 20, yPos);
        yPos += 7;

        // Table Headers
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(230, 230, 230);
        pdf.rect(20, yPos - 3, 170, 5, 'F');
        pdf.text('Product Name', 22, yPos);
        pdf.text('Price', 100, yPos);
        pdf.text('Stock', 130, yPos);
        pdf.text('Value', 160, yPos);
        yPos += 6;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);

        products.forEach((product, index) => {
          // Check if we need a new page
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
            // Redraw table headers on new page
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setFillColor(230, 230, 230);
            pdf.rect(20, yPos - 3, 170, 5, 'F');
            pdf.text('Product Name', 22, yPos);
            pdf.text('Price', 100, yPos);
            pdf.text('Stock', 130, yPos);
            pdf.text('Value', 160, yPos);
            yPos += 6;
            pdf.setFont(undefined, 'normal');
          }

          const productName = (product.name || 'N/A').substring(0, 40);
          const price = formatCurrencyForPDF(product.price || 0);
          const stock = product.stock || 0;
          const value = formatCurrencyForPDF((product.stock || 0) * (product.price || 0));

          // Alternate row background
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(20, yPos - 3, 170, 5, 'F');
          }

          pdf.text(productName, 22, yPos);
          pdf.text(price, 100, yPos);
          pdf.text(stock.toString(), 130, yPos);
          pdf.text(value, 160, yPos);
          yPos += 5;

          // Draw separator line
          if (index < products.length - 1) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(20, yPos, 190, yPos);
            yPos += 2;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No products found for the selected filters.', 20, yPos);
      }

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 290, { align: 'center' });
      }

      const fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating stock report:', error);
      throw error;
    }
  };

  const generateVendorPurchaseReport = async () => {
    try {
      // Fetch all stock entries first
      const response = await fetch(apiUrl('/api/stock-entries'));
      if (!response.ok) throw new Error('Failed to fetch stock entries for report');
      
      let stockEntries = await response.json();

      // Apply filters on client side
      if (reportFilters.vendor) {
        stockEntries = stockEntries.filter(entry => {
          const entryVendorId = entry.vendor?._id || entry.vendor;
          return String(entryVendorId) === String(reportFilters.vendor);
        });
      }

      // Filter by date range on client side
      if (reportFilters.startDate || reportFilters.endDate) {
        stockEntries = stockEntries.filter(entry => {
          const entryDate = new Date(entry.invoiceDate || entry.createdAt);
          if (reportFilters.startDate && entryDate < new Date(reportFilters.startDate)) return false;
          if (reportFilters.endDate && entryDate > new Date(reportFilters.endDate + 'T23:59:59')) return false;
          return true;
        });
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Section
      pdf.setFontSize(18);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont(undefined, 'bold');
      pdf.text(receiptSettings.receiptHeader, 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text(receiptSettings.receiptSubheader, 105, 22, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont(undefined, 'bold');
      pdf.text('Vendor Purchase Report', 105, 30, { align: 'center' });
      
      // Draw line under header
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 35, 190, 35);
      
      let yPos = 42;

      // Report Info Section
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text('Report Information', 20, yPos);
      yPos += 6;
      pdf.setFont(undefined, 'normal');
      
      if (reportFilters.startDate || reportFilters.endDate) {
        pdf.text(`Date Range: ${reportFilters.startDate || 'All'} to ${reportFilters.endDate || 'All'}`, 25, yPos);
        yPos += 5;
      }
      if (reportFilters.vendor) {
        const vendorName = vendors.find(v => v._id === reportFilters.vendor)?.name || 'N/A';
        pdf.text(`Vendor: ${vendorName}`, 25, yPos);
        yPos += 5;
      }
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 25, yPos);
      yPos += 8;

      // Summary Section
      if (reportFilters.includeSummary && stockEntries.length > 0) {
        const totalQuantity = stockEntries.reduce((sum, e) => sum + (e.quantity || 0), 0);
        const totalCost = stockEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        const uniqueVendors = new Set(stockEntries.map(e => {
          const vendorId = e.vendor?._id || e.vendor;
          return vendorId ? String(vendorId) : null;
        }).filter(Boolean)).size;
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos - 4, 170, 6, 'F');
        pdf.text('Summary Statistics', 20, yPos);
        yPos += 7;
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        pdf.text(`Total Purchase Entries: ${stockEntries.length}`, 25, yPos);
        yPos += 5;
        pdf.text(`Total Quantity Purchased: ${totalQuantity}`, 25, yPos);
        yPos += 5;
        pdf.text(`Total Purchase Cost: ${formatCurrencyForPDF(totalCost)}`, 25, yPos);
        yPos += 5;
        pdf.text(`Number of Vendors: ${uniqueVendors}`, 25, yPos);
        yPos += 8;
      }

      // Purchase Entries Table
      if (stockEntries.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos - 4, 170, 6, 'F');
        pdf.text('Purchase Entries', 20, yPos);
        yPos += 7;

        // Table Headers
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(230, 230, 230);
        pdf.rect(20, yPos - 3, 170, 5, 'F');
        pdf.text('Date', 22, yPos);
        pdf.text('Invoice', 50, yPos);
        pdf.text('Product', 80, yPos);
        pdf.text('Vendor', 120, yPos);
        pdf.text('Qty', 150, yPos);
        pdf.text('Unit Price', 160, yPos);
        pdf.text('Total', 175, yPos);
        yPos += 6;

        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);

        stockEntries.forEach((entry, index) => {
          // Check if we need a new page
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
            // Redraw table headers on new page
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setFillColor(230, 230, 230);
            pdf.rect(20, yPos - 3, 170, 5, 'F');
            pdf.text('Date', 22, yPos);
            pdf.text('Invoice', 50, yPos);
            pdf.text('Product', 80, yPos);
            pdf.text('Vendor', 120, yPos);
            pdf.text('Qty', 150, yPos);
            pdf.text('Unit Price', 160, yPos);
            pdf.text('Total', 175, yPos);
            yPos += 6;
            pdf.setFont(undefined, 'normal');
          }

          const date = new Date(entry.invoiceDate || entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const invoiceNumber = (entry.invoiceNumber || 'N/A').substring(0, 12);
          const productName = (entry.product?.name || 'N/A').substring(0, 15);
          const vendorName = (entry.vendor?.name || 'N/A').substring(0, 15);
          const quantity = entry.quantity || 0;
          const purchasePrice = formatCurrencyForPDF(entry.purchasePrice || 0);
          const totalCost = formatCurrencyForPDF(entry.totalCost || 0);

          // Alternate row background
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(20, yPos - 3, 170, 5, 'F');
          }

          pdf.text(date, 22, yPos);
          pdf.text(invoiceNumber, 50, yPos);
          pdf.text(productName, 80, yPos);
          pdf.text(vendorName, 120, yPos);
          pdf.text(quantity.toString(), 150, yPos);
          pdf.text(purchasePrice, 160, yPos);
          pdf.text(totalCost, 175, yPos);
          yPos += 5;

          // Draw separator line
          if (index < stockEntries.length - 1) {
            pdf.setDrawColor(220, 220, 220);
            pdf.line(20, yPos, 190, yPos);
            yPos += 2;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No purchase entries found for the selected filters.', 20, yPos);
      }

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 290, { align: 'center' });
      }

      const fileName = `Vendor_Purchase_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating vendor purchase report:', error);
      throw error;
    }
  };

  const generatePDF = async () => {
    try {
      if (!reportType) {
        alert('Please select a report type');
        return;
      }

      if (reportType === 'day-end') {
        // Fetch transactions based on report filters
        const queryParams = new URLSearchParams();
        if (reportFilters.course) queryParams.append('course', reportFilters.course);
        if (reportFilters.paymentMethod) queryParams.append('paymentMethod', reportFilters.paymentMethod);
        if (reportFilters.isPaid !== '') queryParams.append('isPaid', reportFilters.isPaid);
        if (reportFilters.startDate) queryParams.append('startDate', reportFilters.startDate);
        if (reportFilters.endDate) queryParams.append('endDate', reportFilters.endDate);

        const response = await fetch(apiUrl(`/api/transactions?${queryParams.toString()}`));
        if (!response.ok) throw new Error('Failed to fetch transactions for report');
        
        let reportTransactions = await response.json();
        
        // Filter by date range on client side
        if (reportFilters.startDate || reportFilters.endDate) {
          reportTransactions = reportTransactions.filter(transaction => {
            const transDate = new Date(transaction.transactionDate);
            if (reportFilters.startDate && transDate < new Date(reportFilters.startDate)) return false;
            if (reportFilters.endDate && transDate > new Date(reportFilters.endDate + 'T23:59:59')) return false;
            return true;
          });
        }

        await generateDayEndReport(reportTransactions);
      } else if (reportType === 'stock') {
        await generateStockReport();
      } else if (reportType === 'vendor-purchase') {
        await generateVendorPurchaseReport();
      }

      setShowReportModal(false);
      setReportType('');
      alert('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600 mt-1">Monitor transactions and track student allocations</p>
              </div>
            </div>
            {activeTab === 'transactions' && (
              <button
                onClick={() => {
                  setTimeout(() => {
                    setShowReportModal(true);
                  }, 200);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-medium self-start lg:self-auto"
              >
                <Download size={20} />
                Generate PDF
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              {tabs.map(tab => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by transaction ID, student name, or student ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {courseOptions.map(course => (
                    <option key={course} value={course}>{course.toUpperCase()}</option>
                  ))}
                </select>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Payment Methods</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
                <select
                  value={filters.isPaid}
                  onChange={(e) => setFilters({ ...filters, isPaid: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Payment Status</option>
                  <option value="true">Paid</option>
                  <option value="false">Unpaid</option>
                </select>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transaction List</h3>
                  <p className="text-sm text-gray-500">Review all transactions and manage receipts</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {filteredTransactions.length} transactions
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    {filteredTransactions.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
                        <p className="text-gray-600">
                          {searchTerm || Object.values(filters).some(f => f !== '')
                            ? 'Try adjusting your search criteria'
                            : 'No transactions have been created yet'}
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedTransactions.map(transaction => (
                            <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{transaction.student?.name}</span>
                                  <span className="text-xs text-gray-500">{transaction.student?.studentId}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{transaction.student?.course?.toUpperCase()}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-900">
                                  {transaction.items?.length || 0} item{transaction.items?.length !== 1 ? 's' : ''}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.totalAmount)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.paymentMethod === 'cash'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {transaction.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-500">{formatDate(transaction.transactionDate)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewDetails(transaction)}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(transaction._id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {filteredTransactions.length > 0 && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(endIndex, filteredTransactions.length)}</span> of{' '}
                          <span className="font-medium">{filteredTransactions.length}</span> transactions
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <ChevronLeft size={16} />
                            Previous
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                      currentPage === page
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-2 text-gray-500">...</span>;
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            Next
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'student-due' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-500">Students Pending</p>
                      <p className="text-2xl font-semibold text-blue-900 mt-1">{dueStats.totalStudents}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">Students who still need their mapped items</p>
                </div>

                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-500">Outstanding Amount</p>
                      <p className="text-2xl font-semibold text-purple-900 mt-1">{formatCurrency(dueStats.totalPendingAmount)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <ClipboardList size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-3">{dueStats.totalPendingItems} item{dueStats.totalPendingItems === 1 ? '' : 's'} yet to be issued</p>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-amber-500">Courses Impacted</p>
                      <p className="text-2xl font-semibold text-amber-900 mt-1">{dueStats.impactedCourses}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-3">Courses with at least one student pending</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={dueFilters.search}
                    onChange={(e) => setDueFilters({ ...dueFilters, search: e.target.value })}
                    placeholder="Search by student name or ID"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <select
                    value={dueFilters.course}
                    onChange={(e) => setDueFilters({ ...dueFilters, course: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Courses</option>
                    {courseOptions.map(course => (
                      <option key={course} value={course}>{course.toUpperCase()}</option>
                    ))}
                  </select>
                  <select
                    value={dueFilters.year}
                    onChange={(e) => setDueFilters({ ...dueFilters, year: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Years</option>
                    {yearOptions.map(year => (
                      <option key={year} value={String(year)}>{`Year ${year}`}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setDueFilters({ search: '', course: '', year: '' })}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Due Report</h3>
                  <p className="text-sm text-gray-500">Students who have not yet received their mapped items</p>
                </div>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredDueStudents.length} students
                </span>
              </div>

              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading mapped items...</p>
                </div>
              ) : productsError ? (
                <div className="p-12 text-center space-y-4">
                  <AlertCircle className="mx-auto text-red-500" size={48} />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Unable to load products</h4>
                    <p className="text-gray-600">{productsError}</p>
                  </div>
                  <button
                    onClick={fetchProducts}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download size={16} />
                    Retry
                  </button>
                </div>
              ) : filteredDueStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h4>
                  <p className="text-gray-600">Every student has received the items mapped to their course and year.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course / Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Amount</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Count</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDueStudents.map(record => {
                        const student = record.student;
                        const totalMapped = record.mappedProducts.length;
                        const pendingCount = record.pendingItems.length;
                        const issuedCount = record.issuedCount;
                        const completion = totalMapped > 0 ? Math.round((issuedCount / totalMapped) * 100) : 0;
                        const studentKey = student._id || student.id || student.studentId;

                        return (
                          <tr key={studentKey} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                <span className="text-xs text-gray-500">{student.studentId}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {student.course?.toUpperCase() || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Year {student.year}{student.branch ? ` • ${student.branch}` : ''}</div>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <div className="flex flex-wrap gap-2">
                                {record.pendingItems.slice(0, 3).map(product => (
                                  <span
                                    key={product._id || product.name}
                                    className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded-full"
                                  >
                                    {product.name}
                                  </span>
                                ))}
                                {pendingCount > 3 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    +{pendingCount - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{issuedCount} issued</span>
                                  <span>{pendingCount} pending</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{formatCurrency(record.issuedValue)}</span>
                                  <span>{formatCurrency(record.pendingValue)}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${completion}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs font-medium text-gray-600">{completion}% complete</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-semibold text-rose-600">{formatCurrency(record.pendingValue)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold">
                                {pendingCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => navigate(`/student/${student._id || student.id || studentKey}`)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <Eye size={16} />
                                View Student
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTransaction(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-semibold">{selectedTransaction.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">{formatDate(selectedTransaction.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-semibold">{selectedTransaction.student?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-semibold">{selectedTransaction.student?.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-semibold">{selectedTransaction.student?.course?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold capitalize">{selectedTransaction.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedTransaction.isPaid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedTransaction.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedTransaction.totalAmount)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Items</h3>
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item Name</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Quantity</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Unit Price</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedTransaction.remarks && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Remarks</p>
                  <p className="text-gray-900">{selectedTransaction.remarks}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }} onClick={() => {
          setShowReportModal(false);
          setReportType('');
        }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Generate Report</h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportType('');
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!reportType ? (
                // Report Type Selection
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Select the type of report you want to generate</p>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => {
                        setReportType('day-end');
                        // Reset to today's date when selecting day-end report
                        setReportFilters(prev => ({
                          ...prev,
                          startDate: getTodayDate(),
                          endDate: getTodayDate(),
                        }));
                      }}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Receipt className="text-purple-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Day-End Report</h3>
                          <p className="text-sm text-gray-600">Transaction report with date filters</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setReportType('stock')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Stock Report</h3>
                          <p className="text-sm text-gray-600">Current stock levels for all products</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setReportType('vendor-purchase')}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building2 className="text-green-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Vendor Purchase Report</h3>
                          <p className="text-sm text-gray-600">Purchase entries from vendors</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Report Filters based on type
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setReportType('')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← Back
                    </button>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm font-medium text-gray-700">
                      {reportType === 'day-end' && 'Day-End Report'}
                      {reportType === 'stock' && 'Stock Report'}
                      {reportType === 'vendor-purchase' && 'Vendor Purchase Report'}
                    </span>
                  </div>

                  {/* Day-End Report Filters */}
                  {reportType === 'day-end' && (
                    <>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="date"
                              value={reportFilters.startDate}
                              onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="date"
                              value={reportFilters.endDate}
                              onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                        <select
                          value={reportFilters.course}
                          onChange={(e) => setReportFilters({ ...reportFilters, course: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Courses</option>
                          {courseOptions.map(course => (
                            <option key={course} value={course}>{course.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                          value={reportFilters.paymentMethod}
                          onChange={(e) => setReportFilters({ ...reportFilters, paymentMethod: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Payment Methods</option>
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <select
                          value={reportFilters.isPaid}
                          onChange={(e) => setReportFilters({ ...reportFilters, isPaid: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Payment Status</option>
                          <option value="true">Paid</option>
                          <option value="false">Unpaid</option>
                        </select>
                      </div>
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Report Options</h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeItems"
                            checked={reportFilters.includeItems}
                            onChange={(e) => setReportFilters({ ...reportFilters, includeItems: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="includeItems" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Include item details in report
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeSummary"
                            checked={reportFilters.includeSummary}
                            onChange={(e) => setReportFilters({ ...reportFilters, includeSummary: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="includeSummary" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Include summary statistics
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stock Report Filters */}
                  {reportType === 'stock' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                        <select
                          value={reportFilters.course}
                          onChange={(e) => setReportFilters({ ...reportFilters, course: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Courses</option>
                          {courseOptions.map(course => (
                            <option key={course} value={course}>{course.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                        <select
                          value={reportFilters.productCategory}
                          onChange={(e) => setReportFilters({ ...reportFilters, productCategory: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Categories</option>
                          <option value="Notebooks">Notebooks</option>
                          <option value="Pens">Pens</option>
                          <option value="Art Supplies">Art Supplies</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeSummaryStock"
                            checked={reportFilters.includeSummary}
                            onChange={(e) => setReportFilters({ ...reportFilters, includeSummary: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="includeSummaryStock" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Include summary statistics
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Vendor Purchase Report Filters */}
                  {reportType === 'vendor-purchase' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="date"
                              value={reportFilters.startDate}
                              onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="date"
                              value={reportFilters.endDate}
                              onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                        <select
                          value={reportFilters.vendor}
                          onChange={(e) => setReportFilters({ ...reportFilters, vendor: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Vendors</option>
                          {vendors.map(vendor => (
                            <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeSummaryVendor"
                            checked={reportFilters.includeSummary}
                            onChange={(e) => setReportFilters({ ...reportFilters, includeSummary: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="includeSummaryVendor" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Include summary statistics
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportType('');
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generatePDF}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium flex items-center gap-2"
                    >
                      <Download size={18} />
                      Generate PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

