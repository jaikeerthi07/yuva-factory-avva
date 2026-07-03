// CustomerDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const CustomerDetailsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Bill modal state
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // Add Customer modal state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    type: 'regular'
  });
  const [submittingCustomer, setSubmittingCustomer] = useState(false);

  // Edit Customer modal state
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [originalPhone, setOriginalPhone] = useState('');

  const handleEditCustomer = (customer) => {
    if (!customer.customerPhone) {
      alert("Cannot edit a customer without a phone number.");
      return;
    }
    setEditingCustomer({
      name: customer.customerName,
      phone: customer.customerPhone,
      email: customer.customerEmail,
      address: customer.customerAddress,
      gst: customer.customerGST,
      type: customer.customerType
    });
    setOriginalPhone(customer.customerPhone);
    setShowEditCustomerModal(true);
  };

  const handleEditCustomerSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCustomer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${encodeURIComponent(originalPhone)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update customer');
      }
      setShowEditCustomerModal(false);
      fetchAllCustomers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCustomer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add customer');
      }
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', gst: '', type: 'regular' });
      fetchAllCustomers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    const confirmed = window.confirm(`Are you sure you want to delete this customer AND all their associated bills?\n\n"${customer.customerName}"\n\nWarning: This action cannot be undone!`);
    if (!confirmed) return;

    try {
      const phoneParam = customer.customerPhone ? encodeURIComponent(customer.customerPhone) : 'no-phone';
      const nameParam = customer.customerName ? `?name=${encodeURIComponent(customer.customerName)}` : '';
      
      const response = await fetch(`${API_BASE_URL}/customers/${phoneParam}${nameParam}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }
      fetchAllCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Fetch all bills and extract unique customers
  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primary map keyed by phone (or name if no phone)
      const customerMap = new Map();
      // Secondary index: lowercase name -> same entry object (for bill matching)
      const nameIndex = new Map();

      // 1. Fetch explicit customers from DB
      try {
        const custResponse = await fetch(`${API_BASE_URL}/customers`);
        if (custResponse.ok) {
          const custData = await custResponse.json();
          if (custData.customers) {
            custData.customers.forEach(cust => {
              const primaryKey = cust.phone || cust.name;
              const entry = {
                id: `cust_${cust.id}`,
                customerName: cust.name || 'Unknown',
                customerPhone: cust.phone || '',
                customerEmail: cust.email || '',
                customerGST: cust.gst || '',
                customerAddress: cust.address || '',
                customerType: cust.type || 'regular',
                vehicleName: '',
                vehicleNumber: '',
                totalSpent: 0,
                billCount: 0,
                lastBillDate: cust.created_at || new Date().toISOString()
              };
              customerMap.set(primaryKey, entry);
              // Also index by name so bills with matching name find this entry
              if (cust.name) {
                nameIndex.set(cust.name.toLowerCase(), entry);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching explicit customers:', err);
      }

      // 2. Fetch all bills with pagination
      let allBills = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${API_BASE_URL}/billing/bills?page=${page}&per_page=100`);

        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }

        const data = await response.json();
        allBills = [...allBills, ...data.bills];

        hasMore = page < data.pages;
        page++;
      }

      // 3. Merge bills into customerMap using phone-first, then name fallback
      allBills.forEach(bill => {
        const billPhone = bill.customer?.phone || bill.customerPhone || '';
        const billName = bill.customer?.name || bill.customerName || '';
        const billAmount = bill.summary?.total || bill.total || 0;

        // Try to find an existing entry: by phone first, then by name
        let existingEntry = null;
        if (billPhone && customerMap.has(billPhone)) {
          existingEntry = customerMap.get(billPhone);
        } else if (billName && nameIndex.has(billName.toLowerCase())) {
          existingEntry = nameIndex.get(billName.toLowerCase());
        }

        if (existingEntry) {
          // Accumulate onto the existing (explicit) customer entry
          existingEntry.totalSpent += billAmount;
          existingEntry.billCount += 1;
          if (bill.createdAt && new Date(bill.createdAt) > new Date(existingEntry.lastBillDate)) {
            existingEntry.lastBillDate = bill.createdAt;
          }
        } else {
          // No existing entry – create one from bill data
          const customerKey = billPhone || billName;
          if (!customerKey) return;

          const newEntry = {
            id: bill.id,
            customerName: billName || 'Unknown',
            customerPhone: billPhone,
            customerEmail: bill.customer?.email || bill.customerEmail || '',
            customerGST: bill.customer?.gst || bill.customerGST || '',
            customerAddress: bill.customer?.address || bill.customerAddress || '',
            customerType: bill.customer?.type || bill.customerType || 'regular',
            vehicleName: bill.vehicle?.name || bill.vehicleName || '',
            vehicleNumber: bill.vehicle?.number || bill.vehicleNumber || '',
            totalSpent: billAmount,
            billCount: 1,
            lastBillDate: bill.createdAt || new Date().toISOString()
          };
          customerMap.set(customerKey, newEntry);
          if (billName) nameIndex.set(billName.toLowerCase(), newEntry);
        }
      });

      // Deduplicate: customerMap values are already unique objects
      const customersList = Array.from(customerMap.values());
      setCustomers(customersList);
      setFilteredCustomers(customersList);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };


  // Filter customers based on search and filters
  useEffect(() => {
    let filtered = [...customers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        (customer.customerName && customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.customerPhone && customer.customerPhone.includes(searchTerm)) ||
        (customer.customerEmail && customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.vehicleNumber && customer.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.customerGST && customer.customerGST.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by customer type (only regular and internal)
    if (selectedCustomerType !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === selectedCustomerType);
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedCustomerType, customers]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const handleViewCustomerBills = async (customer) => {
    setSelectedCustomer(customer);
    setShowBillModal(true);
    setLoadingBills(true);

    try {
      // Fetch all bills for this customer
      let allBills = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${API_BASE_URL}/billing/bills?page=${page}&per_page=100`);

        if (!response.ok) {
          throw new Error('Failed to fetch bills');
        }

        const data = await response.json();

        // Filter bills for this customer by phone number or name
        const customerBillsData = data.bills.filter(bill => {
          const billPhone = bill.customer?.phone || bill.customerPhone;
          const billName = bill.customer?.name || bill.customerName;

          return (billPhone && billPhone === customer.customerPhone) ||
            (billName && billName === customer.customerName);
        });

        allBills = [...allBills, ...customerBillsData];

        hasMore = page < data.pages;
        page++;
      }

      setCustomerBills(allBills);
    } catch (err) {
      console.error('Error fetching customer bills:', err);
      setError('Failed to fetch customer bills');
    } finally {
      setLoadingBills(false);
    }
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setSelectedCustomer(null);
    setCustomerBills([]);
  };

  const getCustomerTypeBadgeStyle = (type) => {
    const styles = {
      regular: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#ffffff',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
      },
      internal: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: '#ffffff',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block',
        boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
      }
    };
    return styles[type] || styles.regular;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      padding: '32px 24px'
    },
    contentWrapper: {
      maxWidth: '1600px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '14px',
      marginTop: '4px'
    },
    filterCard: {
      background: '#1e293b',
      borderRadius: '16px',
      border: '1px solid #334155',
      padding: '24px',
      marginBottom: '24px'
    },
    filterContainer: {
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap'
    },
    filterItem: {
      flex: 1,
      minWidth: '280px'
    },
    filterLabel: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#94a3b8',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    filterInput: {
      width: '100%',
      padding: '12px 16px',
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '10px',
      outline: 'none',
      color: '#f1f5f9',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    tableCard: {
      background: '#1e293b',
      borderRadius: '16px',
      border: '1px solid #334155',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: '#0f172a',
      borderBottom: '1px solid #334155'
    },
    td: {
      padding: '16px 20px',
      fontSize: '14px',
      color: '#e2e8f0',
      borderBottom: '1px solid #334155'
    },
    serialNumber: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      background: '#334155',
      borderRadius: '8px',
      fontWeight: '600',
      color: '#e2e8f0',
      fontSize: '13px'
    },
    customerName: {
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '4px'
    },
    customerAddress: {
      fontSize: '11px',
      color: '#94a3b8'
    },
    contactInfo: {
      fontSize: '13px',
      color: '#cbd5e1',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '4px'
    },
    gstNumber: {
      fontSize: '13px',
      color: '#fbbf24',
      fontFamily: 'monospace',
      fontWeight: '500'
    },
    vehicleInfo: {
      fontSize: '13px',
      color: '#e2e8f0',
      fontFamily: 'monospace'
    },
    vehicleName: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '2px'
    },
    totalSpent: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#10b981'
    },
    billCount: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#334155',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#e2e8f0'
    },
    viewButton: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      padding: '6px 12px',
      borderRadius: '8px',
      color: '#ffffff',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    },
    paginationContainer: {
      background: '#0f172a',
      padding: '16px 24px',
      borderTop: '1px solid #334155',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    },
    paginationButton: {
      padding: '8px 16px',
      border: '1px solid #334155',
      borderRadius: '8px',
      background: '#1e293b',
      color: '#e2e8f0',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '13px',
      transition: 'all 0.2s ease'
    },
    paginationButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    pageNumbers: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    pageNumber: {
      padding: '8px 14px',
      border: '1px solid #334155',
      borderRadius: '8px',
      background: '#1e293b',
      color: '#e2e8f0',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    pageNumberActive: {
      background: '#3b82f6',
      borderColor: '#3b82f6',
      color: '#ffffff'
    },
    errorMessage: {
      marginBottom: '24px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fecaca'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 24px',
      color: '#94a3b8'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: '#1e293b',
      borderRadius: '20px',
      maxWidth: '95%',
      width: '1100px',
      maxHeight: '85vh',
      overflow: 'auto',
      border: '1px solid #334155'
    },
    modalHeader: {
      padding: '24px 28px',
      borderBottom: '1px solid #334155',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#0f172a',
      borderRadius: '20px 20px 0 0',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    modalTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px'
    },
    modalSubtitle: {
      fontSize: '13px',
      color: '#94a3b8'
    },
    modalInfo: {
      display: 'flex',
      gap: '20px',
      marginTop: '8px',
      fontSize: '12px',
      color: '#94a3b8',
      flexWrap: 'wrap'
    },
    closeButton: {
      background: '#334155',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#94a3b8',
      padding: '8px 16px',
      borderRadius: '10px',
      transition: 'all 0.2s ease'
    },
    modalBody: {
      padding: '24px'
    },
    billsTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    billsTh: {
      padding: '12px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#94a3b8',
      background: '#0f172a',
      borderBottom: '1px solid #334155'
    },
    billsTd: {
      padding: '12px',
      fontSize: '13px',
      color: '#e2e8f0',
      borderBottom: '1px solid #334155'
    },
    paymentBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600'
    },
    paymentPaid: {
      background: 'rgba(16, 185, 129, 0.2)',
      color: '#10b981',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    },
    paymentPartial: {
      background: 'rgba(245, 158, 11, 0.2)',
      color: '#f59e0b',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    },
    paymentPending: {
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    totalFooter: {
      background: '#0f172a',
      padding: '16px',
      textAlign: 'right',
      borderTop: '1px solid #334155',
      marginTop: '16px',
      borderRadius: '0 0 16px 16px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid #334155',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease;
        }
        input:focus, select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        }
        button:hover {
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        .customer-row:hover {
          background: #334155 !important;
        }
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 10px;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>

      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Customer Management</h1>
          <p style={styles.subtitle}>View and manage all customer information and transaction history</p>
        </div>

        {/* Filters - Fixed with flexbox to prevent overlap */}
        <div style={styles.filterCard}>
          <div style={styles.filterContainer}>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>🔍 Search Customer</label>
              <input
                type="text"
                placeholder="Search by name, phone, email, GST..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>🏷️ Customer Type</label>
              <select
                value={selectedCustomerType}
                onChange={(e) => setSelectedCustomerType(e.target.value)}
                style={styles.filterInput}
              >
                <option value="all">All Types</option>
                <option value="regular">Regular Customer</option>
                <option value="internal">Internal / Staff</option>
              </select>
            </div>

            <div style={{ ...styles.filterItem, display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                style={{
                  ...styles.viewButton,
                  padding: '12px 24px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                ➕ Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Customers Table */}
        <div style={styles.tableCard}>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>GST</th>
                  <th style={styles.th}>Type</th>

                  <th style={styles.th}>Total Spent</th>
                  <th style={styles.th}>Bills</th>
                  <th style={styles.th}>Last Bill</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={styles.emptyState}>
                      <div>
                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>👥</span>
                        <p>No customers found</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentCustomers.map((customer, index) => {
                    const serialNumber = indexOfFirstItem + index + 1;
                    return (
                      <tr
                        key={index}
                        className="customer-row"
                        style={{ borderBottom: '1px solid #334155' }}
                      >
                        <td style={styles.td}>
                          <span style={styles.serialNumber}>{serialNumber}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.customerName}>{customer.customerName}</div>
                          {customer.customerAddress && (
                            <div style={styles.customerAddress}>
                              📍 {customer.customerAddress.length > 40 ? customer.customerAddress.substring(0, 40) + '...' : customer.customerAddress}
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          {customer.customerPhone && (
                            <div style={styles.contactInfo}>
                              <span>📞</span> {customer.customerPhone}
                            </div>
                          )}
                          {customer.customerEmail && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              ✉️ {customer.customerEmail}
                            </div>
                          )}
                          {!customer.customerPhone && !customer.customerEmail && (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {customer.customerGST ? (
                            <span style={styles.gstNumber}>{customer.customerGST}</span>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={getCustomerTypeBadgeStyle(customer.customerType)}>
                            {customer.customerType === 'regular' ? 'External Customer' : 'Internal Staff'}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.totalSpent}>{formatCurrency(customer.totalSpent)}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.billCount}>{customer.billCount}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            📅 {formatDate(customer.lastBillDate)}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              style={{
                                ...styles.viewButton,
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)'
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleViewCustomerBills(customer)}
                              style={styles.viewButton}
                            >
                              📄 View Bills
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer)}
                              style={{
                                ...styles.viewButton,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
                  }}
                >
                  ← Previous
                </button>
                <div style={styles.pageNumbers}>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNumber)}
                        style={{
                          ...styles.pageNumber,
                          ...(currentPage === pageNumber ? styles.pageNumberActive : {})
                        }}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.paginationButton,
                    ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
                  }}
                >
                  Next →
                </button>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} customers
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddCustomerModal(false)}>
          <div style={{ ...styles.modalContent, width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Add New Customer</h2>
                <p style={styles.modalSubtitle}>Enter customer details below</p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#475569';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <form onSubmit={handleAddCustomerSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.filterLabel}>Name *</label>
                    <input
                      type="text"
                      required
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      style={styles.filterInput}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Phone Number *</label>
                    <input
                      type="text"
                      required
                      maxLength="10"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/\D/g, '') })}
                      onInvalid={(e) => e.target.setCustomValidity('Mobile number should be 10 digits.')}
                      onInput={(e) => e.target.setCustomValidity('')}
                      style={styles.filterInput}
                      placeholder="e.g. 9876543210"
                      pattern="[0-9]{10}"
                      title="Mobile number should be 10 digits."
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Email Address</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      style={styles.filterInput}
                      placeholder="e.g. john@gmail.com"
                      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address containing @"
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.filterLabel}>Address</label>
                    <input
                      type="text"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      style={styles.filterInput}
                      placeholder="Full Address"
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>GST Number</label>
                    <input
                      type="text"
                      maxLength="15"
                      value={newCustomer.gst}
                      onChange={(e) => setNewCustomer({ ...newCustomer, gst: e.target.value.toUpperCase() })}
                      style={styles.filterInput}
                      placeholder="GSTIN"
                      pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                      title="Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)"
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Customer Type</label>
                    <select
                      value={newCustomer.type}
                      onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                      style={styles.filterInput}
                    >
                      <option value="regular">External Customer</option>
                      <option value="internal">Internal Staff</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    style={{
                      ...styles.paginationButton,
                      background: 'transparent'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustomer}
                    style={{
                      ...styles.viewButton,
                      opacity: submittingCustomer ? 0.7 : 1
                    }}
                  >
                    {submittingCustomer ? 'Saving...' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div style={styles.modalOverlay} onClick={() => setShowEditCustomerModal(false)}>
          <div style={{ ...styles.modalContent, width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Edit Customer</h2>
                <p style={styles.modalSubtitle}>Update customer details below</p>
              </div>
              <button
                onClick={() => setShowEditCustomerModal(false)}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#475569';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <form onSubmit={handleEditCustomerSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.filterLabel}>Name *</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      style={styles.filterInput}
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      style={styles.filterInput}
                      pattern="[0-9]{10}"
                      title="Please enter a valid 10-digit phone number"
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Email Address</label>
                    <input
                      type="email"
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      style={styles.filterInput}
                      pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address containing @"
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={styles.filterLabel}>Address</label>
                    <input
                      type="text"
                      value={editingCustomer.address}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                      style={styles.filterInput}
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>GST Number</label>
                    <input
                      type="text"
                      value={editingCustomer.gst}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, gst: e.target.value.toUpperCase() })}
                      style={styles.filterInput}
                      pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                      title="Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)"
                    />
                  </div>

                  <div>
                    <label style={styles.filterLabel}>Customer Type</label>
                    <select
                      value={editingCustomer.type}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, type: e.target.value })}
                      style={styles.filterInput}
                    >
                      <option value="regular">External Customer</option>
                      <option value="internal">Internal Staff</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditCustomerModal(false)}
                    style={{
                      ...styles.paginationButton,
                      background: 'transparent'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCustomer}
                    style={{
                      ...styles.viewButton,
                      opacity: submittingCustomer ? 0.7 : 1
                    }}
                  >
                    {submittingCustomer ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Bill Details Modal */}
      {showBillModal && selectedCustomer && (
        <div style={styles.modalOverlay} onClick={closeBillModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Bill History</h2>
                <p style={styles.modalSubtitle}>{selectedCustomer.customerName}</p>
                <div style={styles.modalInfo}>
                  <span>📞 {selectedCustomer.customerPhone || 'N/A'}</span>
                  <span>🏷️ GST: {selectedCustomer.customerGST || 'N/A'}</span>
                  <span>📄 Total Bills: {customerBills.length}</span>
                </div>
              </div>
              <button
                onClick={closeBillModal}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#475569';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingBills ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid #334155',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                  <p style={{ marginTop: '20px', color: '#94a3b8' }}>Loading bills...</p>
                </div>
              ) : customerBills.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📄</span>
                  <p>No bills found for this customer</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.billsTable}>
                      <thead>
                        <tr>
                          <th style={styles.billsTh}>#</th>
                          <th style={styles.billsTh}>Bill ID</th>
                          <th style={styles.billsTh}>Bill Number</th>
                          <th style={styles.billsTh}>Date</th>
                          <th style={{ ...styles.billsTh, textAlign: 'right' }}>Total</th>
                          <th style={{ ...styles.billsTh, textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerBills.map((bill, index) => (
                          <tr key={index}>
                            <td style={styles.billsTd}>{index + 1}</td>
                            <td style={styles.billsTd}>
                              <span style={{ fontWeight: '600', color: '#ffffff' }}>#{bill.id}</span>
                            </td>
                            <td style={styles.billsTd}>{bill.billNumber || 'N/A'}</td>
                            <td style={styles.billsTd}>{formatDate(bill.createdAt)}</td>
                            <td style={{ ...styles.billsTd, fontWeight: '700', color: '#10b981', textAlign: 'right' }}>
                              {formatCurrency(bill.summary?.total || bill.total || 0)}
                            </td>
                            <td style={{ ...styles.billsTd, textAlign: 'center' }}>
                              <span style={{
                                ...styles.paymentBadge,
                                ...((bill.payment?.status || bill.paymentStatus) === 'paid' ? styles.paymentPaid :
                                  (bill.payment?.status || bill.paymentStatus) === 'partial' ? styles.paymentPartial : styles.paymentPending)
                              }}>
                                {((bill.payment?.status || bill.paymentStatus || 'pending').charAt(0).toUpperCase() +
                                  (bill.payment?.status || bill.paymentStatus || 'pending').slice(1))}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={styles.totalFooter}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', color: '#94a3b8' }}>Total Spent:</span>
                      <span style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>
                        {formatCurrency(customerBills.reduce((sum, bill) => sum + (bill.summary?.total || bill.total || 0), 0))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailsPage;

