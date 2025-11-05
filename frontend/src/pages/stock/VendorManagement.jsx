import { useState, useEffect } from 'react';
import { Plus, Building2, Edit, Trash2, Mail, Phone, MapPin, FileText, Search, X } from 'lucide-react';
import { apiUrl } from '../../utils/api';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', message: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    paymentTerms: '',
    remarks: '',
    isActive: true,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/vendors'));
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setStatusMsg({ type: 'error', message: 'Failed to fetch vendors' });
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      setStatusMsg({ type: 'error', message: 'Vendor name is required' });
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
      return;
    }

    setLoading(true);
    try {
      const url = editingVendor 
        ? apiUrl(`/api/vendors/${editingVendor._id}`)
        : apiUrl('/api/vendors');
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save vendor');
      }

      const savedVendor = await res.json();
      
      if (editingVendor) {
        setVendors(prev => prev.map(v => v._id === savedVendor._id ? savedVendor : v));
        setStatusMsg({ type: 'success', message: 'Vendor updated successfully!' });
      } else {
        setVendors(prev => [savedVendor, ...prev]);
        setStatusMsg({ type: 'success', message: 'Vendor added successfully!' });
      }

      resetForm();
      setShowModal(false);
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error('Error saving vendor:', err);
      setStatusMsg({ type: 'error', message: err.message || 'Failed to save vendor' });
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      gstNumber: vendor.gstNumber || '',
      paymentTerms: vendor.paymentTerms || '',
      remarks: vendor.remarks || '',
      isActive: vendor.isActive !== undefined ? vendor.isActive : true,
    });
    setShowModal(true);
  };

  const handleDelete = async (vendorId, vendorName) => {
    if (!window.confirm(`Are you sure you want to delete "${vendorName}"?`)) return;
    
    try {
      const res = await fetch(apiUrl(`/api/vendors/${vendorId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete vendor');
      
      setVendors(prev => prev.filter(v => v._id !== vendorId));
      setStatusMsg({ type: 'success', message: 'Vendor deleted successfully!' });
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setStatusMsg({ type: 'error', message: 'Failed to delete vendor' });
      setTimeout(() => setStatusMsg({ type: '', message: '' }), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      paymentTerms: '',
      remarks: '',
      isActive: true,
    });
    setEditingVendor(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const filteredVendors = vendors.filter(vendor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vendor.name?.toLowerCase().includes(query) ||
      vendor.contactPerson?.toLowerCase().includes(query) ||
      vendor.email?.toLowerCase().includes(query) ||
      vendor.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-600 mt-1">Manage your vendor information and contacts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <Plus size={20} />
          Add New Vendor
        </button>
      </div>

      {/* Status Message */}
      {statusMsg.message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          statusMsg.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {statusMsg.message}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Vendors Grid */}
      {loading && vendors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vendors...</p>
        </div>
      ) : filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div 
              key={vendor._id} 
              className={`bg-white rounded-2xl shadow-md border-2 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                vendor.isActive ? 'border-gray-200' : 'border-gray-300 opacity-75'
              }`}
            >
              {/* Vendor Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">
                    {vendor.name}
                  </h3>
                  {!vendor.isActive && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                {vendor.contactPerson && (
                  <p className="text-sm text-gray-600">
                    Contact: {vendor.contactPerson}
                  </p>
                )}
              </div>

              {/* Vendor Info */}
              <div className="p-6 space-y-3">
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600 truncate">{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-600">{vendor.phone}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-gray-600 line-clamp-2">{vendor.address}</span>
                  </div>
                )}
                {vendor.gstNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-gray-600">GST: {vendor.gstNumber}</span>
                  </div>
                )}
                {vendor.paymentTerms && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Payment Terms:</p>
                    <p className="text-sm text-gray-700">{vendor.paymentTerms}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 flex gap-2">
                <button
                  onClick={() => handleEdit(vendor)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor._id, vendor.name)}
                  className="px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first vendor'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add Vendor
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vendor name"
                  required
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="vendor@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  placeholder="Vendor address"
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="GST number"
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Net 30, COD, etc."
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active Vendor
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;

