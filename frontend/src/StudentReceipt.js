import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// import './StudentReceipt.css';

const StudentReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { student } = location.state || {};
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${student?.studentId || 'student'}`,
  });

  const handleDownload = () => {
    if (!receiptRef.current) return;

    const receiptElement = receiptRef.current;
    html2canvas(receiptElement, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 595.28; // A4 width in points
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${student?.studentId || 'student'}.pdf`);
    });
  };

  if (!student) {
    return (
      <div className="receipt-container">
        <h2>No student data found.</h2>
        <button onClick={() => navigate(-1)} className="btn">Go Back</button>
      </div>
    );
  }

  const totalAmount = student.orders?.reduce((acc, order) => acc + order.totalPrice, 0) || 0;

  // Get a list of items the student has taken
  const itemsTaken = student.items 
    ? Object.entries(student.items).filter(([, taken]) => taken).map(([name]) => name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : [];

  return (
    <div className="receipt-page">
      <div className="receipt-actions">
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Back</button>
        <button onClick={handlePrint} className="btn btn-primary">Print Receipt</button>
        <button onClick={handleDownload} className="btn btn-success">Download as PDF</button>
      </div>
      <div className="receipt-wrapper" ref={receiptRef}>
        <div className="receipt-header">
          <h1>Student Receipt</h1>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
        <div className="student-details">
          <h2>Student Information</h2>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Student ID:</strong> {student.studentId}</p>
          <p><strong>Course:</strong> {student.course?.toUpperCase()}</p>
          <p><strong>Year:</strong> {student.year}</p>
          <p><strong>Branch:</strong> {student.branch}</p>
        </div>

        {student.orders && student.orders.length > 0 ? (
          student.orders.map(order => (
            <div key={order._id} className="order-details">
              <h3>Order ID: {order._id}</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map(item => (
                    <tr key={item.product?._id || item.name}>
                      <td>{item.product?.name || item.name}</td>
                      <td>{item.qty}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>₹{(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="order-total"><strong>Order Total:</strong> ₹{order.totalPrice.toFixed(2)}</p>
              <p><strong>Payment Status:</strong> {order.isPaid ? 'Paid' : 'Not Paid'}</p>
            </div>
          ))
        ) : (
          <div className="order-details">
            <h3>No orders found.</h3>
          </div>
        )}

        {itemsTaken.length > 0 && (
          <div className="items-taken-details">
            <h3>Items Received</h3>
            <ul className="items-taken-list">
              {itemsTaken.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="fee-status-details">
            <h3>Fee Status</h3>
            <p><strong>Overall Payment Status:</strong> <span className={student.paid ? 'paid' : 'not-paid'}>{student.paid ? 'PAID' : 'NOT PAID'}</span></p>
        </div>
        <div className="receipt-summary">
          <h2>Summary</h2>
          <p className="grand-total"><strong>Grand Total:</strong> ₹{totalAmount.toFixed(2)}</p>
        </div>

        <div className="receipt-footer">
          <p>Thank you!</p>
        </div>
      </div>
    </div>
  );
};

export default StudentReceipt;
