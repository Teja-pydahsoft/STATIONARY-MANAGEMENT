import React, { useMemo, useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';

const ReceiptStyles = () => (
  <style>{`
    .receipt-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .receipt-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      width: 450px;
      position: relative;
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #111827;
    }
    .receipt-card-content { padding: 2rem; }
    .receipt-card-header {
      text-align: center;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
    .receipt-card-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 0.25rem; }
    .receipt-card-header p { font-size: 13px; color: #6b7280; }
    .student-info {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; font-size: 13px;
    }
    .items-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #ddd; }
    .items-list { display: flex; flex-direction: column; gap: 0.5rem; font-size: 13px; }
    .receipt-footer-text { text-align: right; margin-top: 1rem; font-size: 12px; color: #6b7280; }
    .receipt-card-footer {
      padding: 1rem 1.5rem; background-color: #f9fafb; border-top: 1px solid #e5e7eb;
      display: flex; justify-content: flex-end; gap: 0.75rem;
      border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem;
    }
    .btn { padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer;
      font-size: 13px; display: flex; align-items: center; gap: 0.4rem; }
    .btn-primary { background-color: #2563eb; color: white; }
    .btn-secondary { background-color: #e5e7eb; color: #111827; }
    .close-btn {
      position: absolute; top: 0.75rem; right: 0.75rem; background: #f3f4f6;
      border: none; border-radius: 9999px; width: 2rem; height: 2rem;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .close-btn:hover { background: #e5e7eb; }
  `}</style>
);

const StudentReceiptModal = ({ student, products, onClose, onItemToggle }) => {
  const receiptRef = useRef(null);

  const triggerPrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${student?.studentId || 'student'}`,
  });

  const handlePrint = () => {
    // Try library print first
    try {
      if (!receiptRef.current) {
        console.warn('Print attempted but receiptRef is not ready');
      } else if (typeof triggerPrint === 'function') {
        triggerPrint();
        return;
      }
    } catch (_) {
      // fall through to manual
    }

    // Fallback: open a new window with the receipt contents and print
    const node = receiptRef.current;
    if (!node) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=600,height=800');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: auto; margin: 0; }
        body { margin: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #111827; }
        .no-print { display: none !important; }
        .receipt-card { width: 450px; margin: 0 auto; }
      </style>
    `;

    printWindow.document.write(`<!doctype html><html><head><title>Receipt-${student?.studentId || 'student'}</title>${styles}</head><body>${node.parentElement?.outerHTML || node.outerHTML}</body></html>`);
    printWindow.document.close();
    // Ensure styles/content applied before print
    printWindow.focus();
    setTimeout(() => {
      try { printWindow.print(); } catch (_) {}
      try { printWindow.close(); } catch (_) {}
    }, 250);
  };

  const handleDownload = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    html2canvas(receiptElement, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`receipt-${student?.studentId || 'student'}.pdf`);
    });
  };

  if (!student) return null;

  const visibleItems = useMemo(() => {
    return (products || []).filter(p => {
      if (p.forCourse && p.forCourse !== student.course) return false;
      if (p.year && Number(p.year) !== Number(student.year)) return false;
      return true;
    });
  }, [products, student.course, student.year]);

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <ReceiptStyles />
      <style type="text/css" media="print">
        {`@page { size: auto; margin: 0; }
          .no-print { display: none !important; }
          .receipt-modal-backdrop { position: static !important; background: none !important; }
          .receipt-card { box-shadow: none !important; width: 450px; margin: 0 auto; }
        `}
      </style>

      <div className="receipt-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="close-btn no-print"><X size={16} /></button>

        <div className="receipt-card-content" ref={receiptRef}>
          <div className="receipt-card-header">
            <h2>Stationery Receipt</h2>
            <p>Pydah College of Engineering</p>
          </div>

          <div className="student-info">
            <p><strong>Student Name:</strong> <span>{student.name}</span></p>
            <p><strong>Student ID:</strong> <span>{student.studentId}</span></p>
            <p><strong>Course:</strong> <span>{student.course} - Year {student.year}</span></p>
            <p><strong>Branch:</strong> <span>{student.branch}</span></p>
          </div>

          <div className="items-section">
            <h3>Items Issued</h3>
            <div className="items-list">
              {visibleItems.map(item => {
                const key = item.name.toLowerCase().replace(/\s+/g, '_');
                return (
                  <label key={key} className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={!!(student.items && student.items[key])}
                      onChange={() => onItemToggle(student.id, key)}
                    />
                    <span>{item.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <p className="receipt-footer-text">
            Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="receipt-card-footer no-print">
          <button onClick={handleDownload} className="btn btn-secondary">
            <Download size={16} /> Download
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentReceiptModal;
