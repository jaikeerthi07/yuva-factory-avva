// Bill.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import logoImage from '../assets/Yuva logo.jpeg';
import QRImage from '../assets/QR.jpeg';

const Bill = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [barcode, setBarcode] = useState('');

  // Bill information
  const [billNumber, setBillNumber] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Customer information
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGST, setCustomerGST] = useState('');
  const [gstError, setGstError] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerType, setCustomerType] = useState('external'); // 'internal' or 'external'
  const [customerDiscount, setCustomerDiscount] = useState(0); // Default discount for customer type

  // Vehicle information
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Company information (from selected company)
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  // User information (bill created by)
  const [createdBy, setCreatedBy] = useState('');

  // Discount information
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [manualDiscount, setManualDiscount] = useState(false); // Track if discount is manually set

  // Tax information
  const [tax, setTax] = useState(0);
  const [taxType, setTaxType] = useState('percentage'); // 'percentage' or 'fixed'
  const [billType, setBillType] = useState('inclusive-tax'); // 'inclusive-tax' or 'exclusive-tax'
  const [applyFreeQty, setApplyFreeQty] = useState(false);

  // Payment information
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Payment details for different methods
  const [cashReceived, setCashReceived] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billSaved, setBillSaved] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [lastGeneratedBill, setLastGeneratedBill] = useState(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [savedBillId, setSavedBillId] = useState(null);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  // Shop details (will be overridden by selected company)
  const defaultShopDetails = {
    name: 'SRI YUVAAS ENTERPRISE',
    address: 'Shop No.1, Pillaiyar Koil Street,',
    city: 'Lm. Government High School Road, Redhills, Chennai – 600052',
    phone: '9962985868',
    email: 'sriyuvaasenter@gmail.com',
    gst: '',
  };

  const [shopDetails, setShopDetails] = useState(defaultShopDetails);
  const GST_RATE_PERCENT = 5;
  const GST_MULTIPLIER = 1.05;
  const isInclusiveTaxBill = billType === 'inclusive-tax';
  const isExclusiveTaxBill = billType === 'exclusive-tax';
  const isTaxBill = true;

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero';
    const toWords = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
      return '';
    };

    let word = '';
    let remainder = num;
    let scaleIndex = 0;

    while (remainder > 0) {
      const chunk = remainder % 1000;
      if (chunk) {
        const chunkText = toWords(chunk) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '');
        word = chunkText + (word ? ' ' + word : '');
      }
      remainder = Math.floor(remainder / 1000);
      scaleIndex += 1;
    }

    return word.trim();
  };

  const formatAmountInWords = (amount) => {
    const integer = Math.floor(Math.abs(amount));
    const paise = Math.round((Math.abs(amount) - integer) * 100);
    let words = `Rupees ${numberToWords(integer)} Only`;
    if (paise > 0) {
      words = `Rupees ${numberToWords(integer)} and ${numberToWords(paise)} Paise Only`;
    }
    return amount < 0 ? `Minus ${words}` : words;
  };

  // Refs
  const billPaperRef = useRef(null);

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || "http://localhost:5000") + '/api',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor for debugging
  api.interceptors.request.use(request => {
    console.log('Starting Request:', request.url);
    return request;
  });

  // Add response interceptor for error handling
  api.interceptors.response.use(
    response => {
      console.log('Response:', response.status);
      return response;
    },
    error => {
      console.log('Response Error:', error.response?.status, error.response?.data);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setError('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      return Promise.reject(error);
    }
  );

  // Professional styles
  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: '1fr 420px',
      gap: '24px',
      padding: '24px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    productPanel: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 48px)',
    },
    panelHeader: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 24px',
      color: 'white',
    },
    panelTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    panelSubtitle: {
      margin: '8px 0 0 0',
      fontSize: '14px',
      opacity: 0.9,
    },
    panelContent: {
      padding: '24px',
      overflowY: 'auto',
      flex: 1,
    },
    alert: {
      padding: '14px 18px',
      borderRadius: '12px',
      marginBottom: '20px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideIn 0.3s ease',
    },
    alertError: {
      background: '#fee2e2',
      color: '#dc2626',
      borderLeft: '4px solid #dc2626',
    },
    alertSuccess: {
      background: '#dcfce7',
      color: '#16a34a',
      borderLeft: '4px solid #16a34a',
    },
    searchSection: {
      background: '#f8fafc',
      padding: '20px',
      borderRadius: '16px',
      marginBottom: '24px',
      border: '1px solid #e2e8f0',
    },
    searchBox: {
      marginBottom: '16px',
    },
    searchLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#1e293b',
      fontSize: '14px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.3s',
      outline: 'none',
      backgroundColor: 'white',
    },
    barcodeInput: {
      display: 'flex',
      gap: '12px',
    },
    barcodeField: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none',
      transition: 'all 0.3s',
      backgroundColor: 'white',
    },
    barcodeButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    searchResults: {
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      maxHeight: '280px',
      overflowY: 'auto',
      marginTop: '12px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      position: 'absolute',
      width: 'calc(100% - 40px)',
      zIndex: 1000,
    },
    searchResultItem: {
      padding: '14px 16px',
      borderBottom: '1px solid #f1f5f9',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s',
    },
    resultInfo: {
      flex: 1,
    },
    resultName: {
      fontWeight: '600',
      color: '#1e293b',
      fontSize: '14px',
    },
    resultDetails: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '4px',
    },
    resultPrice: {
      fontWeight: '700',
      color: '#10b981',
      fontSize: '16px',
    },
    selectedProducts: {
      marginTop: '24px',
    },
    selectedProductsTitle: {
      marginBottom: '16px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    noItems: {
      textAlign: 'center',
      color: '#94a3b8',
      padding: '40px',
      fontStyle: 'italic',
      background: '#f8fafc',
      borderRadius: '12px',
    },
    selectedItemsList: {
      maxHeight: '400px',
      overflowY: 'auto',
    },
    selectedItem: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 100px 100px 40px',
      gap: '12px',
      padding: '14px',
      background: '#f8fafc',
      marginBottom: '10px',
      borderRadius: '12px',
      alignItems: 'center',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s',
    },
    itemInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    itemName: {
      fontWeight: '600',
      color: '#1e293b',
      fontSize: '14px',
    },
    itemFlavour: {
      fontSize: '11px',
      color: '#64748b',
      marginTop: '2px',
    },
    itemPrice: {
      fontWeight: '600',
      color: '#10b981',
    },
    itemTotal: {
      fontWeight: '700',
      color: '#10b981',
    },
    itemQuantity: {
      width: '60px',
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      textAlign: 'center',
      fontFamily: 'inherit',
      fontSize: '14px',
    },
    qtyBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      background: '#f8fafc',
      color: '#475569',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    },
    removeBtn: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    billPanel: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: '24px',
      height: 'fit-content',
      maxHeight: 'calc(100vh - 48px)',
      overflow: 'auto',
    },
    billContainer: {
      padding: '20px',
    },
    billPaper: {
      background: 'white',
      padding: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '20px',
      fontFamily: "'Inter', sans-serif",
      fontSize: '12px',
      lineHeight: '1.5',
    },
    billHeader: {
      textAlign: 'center',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '2px solid #e2e8f0',
    },
    billHeaderH1: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '4px',
      color: '#1e293b',
    },
    billHeaderP: {
      fontSize: '10px',
      color: '#64748b',
      margin: '2px 0',
    },
    billInfo: {
      margin: '12px 0',
      padding: '8px 0',
      borderTop: '1px dashed #e2e8f0',
      borderBottom: '1px dashed #e2e8f0',
    },
    billInfoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px',
      fontSize: '11px',
    },
    invoiceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '20px',
      borderBottom: '1px dashed #e2e8f0',
      paddingBottom: '12px',
      alignItems: 'flex-start',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginRight: '8px',
    },
    logoImage: {
      width: '90px',
      height: '90px',
      objectFit: 'contain',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    sellerAddress: {
      flex: 1,
      fontSize: '11px',
      lineHeight: '1.4',
    },
    invoiceMetaContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    invoiceTopRight: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '10px',
    },
    originalBadge: {
      padding: '4px 8px',
      background: '#1e293b',
      color: 'white',
      fontSize: '10px',
      fontWeight: '600',
      borderRadius: '4px',
    },
    qrCode: {
      width: '140px',
      height: '140px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      objectFit: 'cover',
    },
    invoiceDetails: {
      padding: '10px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      background: '#f8fafc',
      fontSize: '11px',
    },
    invoiceRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '11px',
    },
    addressGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    addressBox: {
      border: '1px solid #e2e8f0',
      padding: '10px',
      borderRadius: '8px',
      background: 'white',
      fontSize: '11px',
    },
    invoiceMetaBox: {
      border: '1px solid #e2e8f0',
      padding: '10px',
      borderRadius: '8px',
      background: '#f8fafc',
      fontSize: '11px',
    },
    amountWords: {
      fontSize: '11px',
      marginTop: '12px',
      marginBottom: '10px',
      fontWeight: '600',
      borderTop: '1px dashed #e2e8f0',
      paddingTop: '10px',
    },
    grossSummary: {
      display: 'grid',
      gap: '6px',
      padding: '12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      background: '#f8fafc',
      fontSize: '11px',
      marginBottom: '12px',
    },
    bankDetails: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px',
    },
    bankSection: {
      border: '1px solid #e2e8f0',
      padding: '10px',
      borderRadius: '8px',
      background: 'white',
      fontSize: '10px',
    },
    termsSection: {
      fontSize: '10px',
      marginTop: '12px',
      padding: '10px',
      border: '1px dashed #e2e8f0',
      borderRadius: '8px',
      background: '#fefce8',
      lineHeight: '1.4',
    },
    signatureRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '16px',
      gap: '12px',
    },
    signatureBox: {
      flex: 1,
      textAlign: 'center',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '8px',
      fontSize: '10px',
      color: '#64748b',
    },
    billNumber: {
      fontWeight: '700',
      color: '#3b82f6',
    },
    customerSection: {
      margin: '12px 0',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    customerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '11px',
    },
    customerLabel: {
      fontWeight: '600',
      color: '#475569',
    },
    customerValue: {
      color: '#1e293b',
      textAlign: 'right',
    },
    customerTypeBadge: {
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    internalBadge: {
      background: '#dbeafe',
      color: '#1e40af',
    },
    externalBadge: {
      background: '#fed7aa',
      color: '#92400e',
    },
    customerInput: {
      width: '100%',
      padding: '8px 10px',
      marginBottom: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '12px',
      transition: 'all 0.2s',
    },
    customerTypeSelect: {
      width: '100%',
      padding: '8px 10px',
      marginBottom: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '12px',
      background: 'white',
    },
    billItems: {
      margin: '12px 0',
    },
    billItemsHeader: {
      display: 'grid',
      gridTemplateColumns: isTaxBill
        ? '0.5fr 2fr 0.8fr 0.6fr 0.6fr 1fr 1fr 1fr 1.2fr'
        : '0.5fr 2fr 0.8fr 0.6fr 0.6fr 1fr 1.2fr',
      fontWeight: '700',
      padding: '8px 4px',
      borderBottom: '2px solid #e2e8f0',
      fontSize: '10px',
      background: '#f1f5f9',
      borderRadius: '8px 8px 0 0',
    },
    billItem: {
      display: 'grid',
      gridTemplateColumns: isTaxBill
        ? '0.5fr 2fr 0.8fr 0.6fr 0.6fr 1fr 1fr 1fr 1.2fr'
        : '0.5fr 2fr 0.8fr 0.6fr 0.6fr 1fr 1.2fr',
      padding: '8px 4px',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '10px',
      alignItems: 'center',
    },
    billItemEmpty: {
      textAlign: 'center',
      color: '#94a3b8',
      padding: '20px',
      fontStyle: 'italic',
      fontSize: '11px',
    },
    billItemName: {
      display: 'flex',
      flexDirection: 'column',
    },
    billItemSmall: {
      fontSize: '8px',
      color: '#64748b',
    },
    billSummary: {
      margin: '12px 0',
      padding: '10px 0',
      borderTop: '1px solid #e2e8f0',
    },
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '11px',
      padding: '4px 0',
    },
    summaryRowTotal: {
      fontWeight: '700',
      fontSize: '13px',
      borderTop: '1px dashed #e2e8f0',
      paddingTop: '8px',
      marginTop: '4px',
      color: '#1e293b',
    },
    discountSection: {
      margin: '10px 0',
      padding: '12px',
      background: '#eff6ff',
      borderRadius: '10px',
      border: '1px solid #bfdbfe',
    },
    discountHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
      cursor: 'pointer',
    },
    discountTitle: {
      fontWeight: '600',
      color: '#1e40af',
      fontSize: '12px',
    },
    discountToggle: {
      color: '#3b82f6',
      fontSize: '12px',
    },
    discountControls: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginTop: '8px',
    },
    discountInput: {
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '12px',
      width: '100%',
    },
    discountTypeSelect: {
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '12px',
      width: '100%',
      background: 'white',
    },
    discountAmount: {
      fontSize: '11px',
      color: '#10b981',
      fontWeight: '600',
      marginTop: '8px',
    },
    paymentSection: {
      margin: '12px 0',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
    },
    paymentRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px',
      alignItems: 'center',
    },
    paymentSelect: {
      padding: '6px 10px',
      width: '120px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '11px',
      background: 'white',
    },
    paymentInput: {
      width: '100px',
      padding: '6px 10px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      textAlign: 'right',
      fontFamily: 'inherit',
      fontSize: '11px',
    },
    paymentDetails: {
      marginTop: '10px',
      padding: '10px',
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    paymentDetailsInput: {
      width: '100%',
      padding: '8px',
      marginBottom: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '11px',
    },
    billFooter: {
      textAlign: 'center',
      marginTop: '16px',
      paddingTop: '12px',
      borderTop: '1px dashed #e2e8f0',
      fontSize: '9px',
    },
    billFooterP: {
      marginBottom: '4px',
      color: '#64748b',
    },
    actionButtons: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginTop: '16px',
    },
    whatsappButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px',
      marginTop: '12px',
      background: '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s',
      width: '100%',
    },
    btn: {
      padding: '12px',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    btnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
    },
    btnSuccess: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
    },
    btnDanger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
    },
    btnSecondary: {
      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white',
    },
    btnInfo: {
      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      color: 'white',
    },
    companySelector: {
      marginBottom: '20px',
      padding: '12px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: '12px',
      cursor: 'pointer',
      border: '1px solid #bbf7d0',
    },
    companyName: {
      fontWeight: '600',
      color: '#16a34a',
      fontSize: '14px',
    },
    companyDropdown: {
      marginTop: '8px',
      padding: '8px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      maxHeight: '200px',
      overflowY: 'auto',
    },
    companyOption: {
      padding: '10px 12px',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.2s',
    },
    billTypeToggle: {
      display: 'flex',
      gap: '12px',
      background: '#f1f5f9',
      padding: '6px',
      borderRadius: '12px',
      flexWrap: 'wrap',
    },
    billTypeOption: {
      flex: 1,
      padding: '8px 16px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    billTypeActive: {
      background: 'white',
      color: '#3b82f6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    billTypeInactive: {
      background: 'transparent',
      color: '#64748b',
    },
  };
  // Fetch explicit customers for autocomplete
  const fetchAvailableCustomers = async () => {
    try {
      const response = await api.get('/customers');
      if (response.data && response.data.customers) {
        setAvailableCustomers(response.data.customers);
      }
    } catch (err) {
      console.error('Error fetching available customers:', err);
    }
  };

  useEffect(() => {
    fetchAvailableCustomers();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCreatedBy(userData.full_name || userData.name || userData.username || 'System');
        const userType = (userData.user_type || userData.role || '').toString().toLowerCase();
        setIsAdminUser(userType === 'admin');
      } catch (e) {
        setCreatedBy('System');
        setIsAdminUser(false);
      }
    } else {
      setIsAuthenticated(false);
      setError('Please login first');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies/list');
      if (response.data && response.data.length > 0) {
        setCompanies(response.data);
        const firstCompany = response.data[0];
        setSelectedCompany(firstCompany);
        fetchCompanyDetails(firstCompany.id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to fetch companies');
    }
  };

  // Fetch company details by ID
  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.data) {
        const company = response.data;
        setShopDetails({
          name: company.name || defaultShopDetails.name,
          address: company.address || defaultShopDetails.address,
          city: company.city || defaultShopDetails.city,
          phone: company.phone || '',
          gst: company.gst_number || '',
        });
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  // Handle company selection
  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);
    await fetchCompanyDetails(company.id);
    setSuccess(`Switched to ${company.name}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Generate random bill number
  const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let random = '';
    for (let i = 0; i < 8; i++) {
      random += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    setBillNumber(`BT-${year}${month}${day}-${random}`);
  };

  // Update date and time
  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }));
    setCurrentTime(now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }));
  };

  // Load logo as data URL for printing
  const loadLogoDataUrl = () => {
    fetch(logoImage)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.log('Logo load error:', err));
  };

  // Initialize
  useEffect(() => {
    generateBillNumber();
    updateDateTime();
    loadLogoDataUrl();

    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Search products with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Update payment status when paid amount changes
  useEffect(() => {
    const total = calculateTotal();
    if (paidAmount === 0) {
      setPaymentStatus('pending');
    } else if (paidAmount < total) {
      setPaymentStatus('partial');
    } else if (paidAmount >= total) {
      setPaymentStatus('paid');
    }
  }, [paidAmount, selectedProducts, discount, tax, discountType, taxType, billType]);

  useEffect(() => {
    setTax(isTaxBill ? GST_RATE_PERCENT : 0);
    setTaxType('percentage');
  }, [billType, isTaxBill]);

  // Set discount based on customer type
  useEffect(() => {
    if (!manualDiscount) {
      if (customerType === 'internal') {
        setCustomerDiscount(10);
        setDiscount(10);
        setDiscountType('percentage');
      } else {
        setCustomerDiscount(0);
        setDiscount(0);
        setDiscountType('percentage');
      }
    }
  }, [customerType, manualDiscount]);

  // Auto-set billType based on GST presence
  useEffect(() => {
    if (customerGST && customerGST.trim() !== '') {
      setBillType('exclusive-tax');
    } else {
      setBillType('inclusive-tax');
    }
  }, [customerGST]);

  // Validate GST format
  useEffect(() => {
    if (customerGST && customerGST.trim() !== '') {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/i;
      if (!gstRegex.test(customerGST)) {
        setGstError('Invalid GST Number format');
      } else {
        setGstError('');
      }
    } else {
      setGstError('');
    }
  }, [customerGST]);

  // Add thermal print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        
        #billPaper, #billPaper * {
          visibility: visible !important;
          background: white !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        #billPaper {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 280px !important;
          margin: 0 !important;
          padding: 12px !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
        }
        
        #billPaper div,
        #billPaper span,
        #billPaper p,
        #billPaper h1,
        #billPaper h2,
        #billPaper h3,
        #billPaper table,
        #billPaper tr,
        #billPaper td,
        #billPaper th {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          background: white !important;
        }
        
        #billPaper .invoice-header {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 18px;
          border-bottom: 1px dashed #000 !important;
          padding-bottom: 10px;
          align-items: flex-start;
        }

        #billPaper .logo-container {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex: 1;
          min-width: 280px;
        }

        #billPaper .logo-image {
          width: 90px !important;
          height: 90px !important;
          object-fit: contain;
          border: 1px solid #000;
          border-radius: 4px;
          flex-shrink: 0;
        }

        #billPaper .seller-address,
        #billPaper .invoice-details {
          min-width: 220px;
        }

        #billPaper .logo-container + .invoice-meta-container {
          width: auto;
          flex: 0 1 auto;
        }

        #billPaper .seller-address h2 {
          font-size: 20px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        #billPaper .invoice-details {
          border: 1px solid #000 !important;
          padding: 10px !important;
          background: #f8f8f8 !important;
        }

        #billPaper .invoice-details h3 {
          margin: 0 0 8px !important;
          font-size: 16px !important;
        }

        #billPaper .invoice-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }

        #billPaper .address-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        #billPaper .address-box {
          border: 1px solid #000 !important;
          padding: 10px !important;
          background: #fff !important;
          font-size: 12px;
        }

        #billPaper .address-box strong {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
        }

        #billPaper .bill-header {
          border-bottom: 1px dashed #000 !important;
        }
        
        #billPaper .bill-info {
          border-top: 1px dashed #000 !important;
          border-bottom: 1px dashed #000 !important;
        }
        
        #billPaper .bill-items-header {
          display: grid;
          grid-template-columns: 0.8fr 2fr 1fr 0.9fr 1fr 1fr 1fr 1fr;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #000 !important;
          font-weight: bold;
          font-size: 12px;
        }

        #billPaper .bill-item {
          display: grid;
          grid-template-columns: 0.8fr 2fr 1fr 0.9fr 1fr 1fr 1fr 1fr;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px dotted #000 !important;
          font-size: 11px;
        }
        
        #billPaper .bill-summary {
          border-top: 1px solid #000 !important;
        }
        
        #billPaper .bill-footer {
          border-top: 1px dashed #000 !important;
        }
        
        #billPaper * {
          background: white !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        #billPaper input,
        #billPaper select,
        #billPaper button,
        #billPaper .no-print {
          display: none !important;
        }
        
        #billPaper .payment-section {
          display: none !important;
        }
        
        #billPaper .customer-section input,
        #billPaper .customer-section select,
        #billPaper .customer-section button {
          display: none !important;
        }
        
        #billPaper .customer-section {
          border: none !important;
          padding: 0 !important;
          margin: 10px 0 !important;
        }
        
        #billPaper .discount-section {
          display: none !important;
        }
        
        @page {
          size: 80mm auto !important;
          margin: 0 !important;
        }
        
        .no-print {
          display: none !important;
        }
      }
      
      @media screen {
        #billPaper input,
        #billPaper select,
        #billPaper button {
          display: block;
        }
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .search-result-item:hover {
        transform: translateX(4px);
      }

      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      button:active {
        transform: translateY(0);
      }

      input:focus,
      select:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Clear payment method specific fields when method changes
  useEffect(() => {
    setShowPaymentDetails(true);
    switch (paymentMethod) {
      case 'cash':
        setCardNumber('');
        setCardHolderName('');
        setUpiId('');
        setTransactionId('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'card':
        setCashReceived(0);
        setUpiId('');
        setTransactionId('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'upi':
        setCashReceived(0);
        setCardNumber('');
        setCardHolderName('');
        setBankName('');
        setChequeNumber('');
        break;
      case 'cheque':
        setCashReceived(0);
        setCardNumber('');
        setCardHolderName('');
        setUpiId('');
        setTransactionId('');
        break;
      default:
        break;
    }
  }, [paymentMethod]);

  // Fetch customer by phone
  const fetchCustomerByPhone = async (phone) => {
    if (phone.length < 10) return;

    setFetchingCustomer(true);
    try {
      const response = await api.get(`/billing/customer/${phone}`);
      if (response.data && response.data.exists) {
        const customer = response.data.customer;
        setCustomerName(customer.name || 'Walk-in Customer');
        setCustomerEmail(customer.email || '');
        setCustomerAddress(customer.address || '');
        setCustomerGST(customer.gst || '');
        setCustomerType(customer.type === 'regular' ? 'external' : (customer.type || 'external'));
        setSuccess('Customer found! Details auto-filled.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setFetchingCustomer(false);
    }
  };

  // Auto-fetch customer when phone reaches 10 digits
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      fetchCustomerByPhone(cleanPhone);
    }
  }, [customerPhone]);

  // Search products API call
  const searchProducts = async () => {
    if (!isAuthenticated) return;

    setSearchLoading(true);
    setError('');

    try {
      const response = await api.get(`/billing/search-products?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || 'Failed to search products');
      }
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Get product by barcode
  const getProductByBarcode = async () => {
    if (!isAuthenticated) return;
    if (!barcode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/billing/product/barcode/${barcode}`);
      addProductToBill(response.data);
      setBarcode('');
    } catch (err) {
      console.error('Barcode error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || 'Product not found');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add product to bill
  const addProductToBill = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id && p.source === product.source);

    if (existingProduct) {
      if (existingProduct.quantity < product.quantity) {
        const updatedProducts = selectedProducts.map(p =>
          p.id === product.id && p.source === product.source
            ? {
              ...p,
              quantity: p.quantity + 1,
              total: (p.quantity + 1) * p.sellPrice
            }
            : p
        );
        setSelectedProducts(updatedProducts);
        setSuccess(`Added another ${product.name}`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(`Insufficient stock! Max available: ${product.quantity}`);
        setTimeout(() => setError(''), 3000);
      }
    } else {
      if (product.quantity > 0) {
        setSelectedProducts([
          ...selectedProducts,
          {
            id: product.id,
            source: product.source || 'product',
            name: product.name,
            Flavour: product.model || '',
            sellPrice: product.sellPrice,
            quantity: 1,
            total: product.sellPrice,
            maxQuantity: product.quantity
          }
        ]);
        setSuccess(`${product.name} added to bill`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Out of stock!');
        setTimeout(() => setError(''), 3000);
      }
    }

    setSearchQuery('');
    setSearchResults([]);
  };

  // Update quantity
  const updateQuantity = (productId, productSource, newQuantity) => {
    const product = selectedProducts.find(p => p.id === productId && p.source === productSource);

    if (product) {
      newQuantity = parseInt(newQuantity) || 0;

      if (newQuantity >= 0 && newQuantity <= product.maxQuantity) {
        const updatedProducts = selectedProducts.map(p =>
          p.id === productId && p.source === productSource
            ? { ...p, quantity: newQuantity, total: newQuantity * p.sellPrice }
            : p
        );
        setSelectedProducts(updatedProducts);

        if (newQuantity === 0) {
          setSuccess(`${product.name} quantity set to 0`);
        } else {
          setSuccess(`Updated ${product.name} quantity`);
        }
        setTimeout(() => setSuccess(''), 2000);
      } else if (newQuantity > product.maxQuantity) {
        setError(`Invalid quantity! Max available: ${product.maxQuantity}`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Remove product
  const removeProduct = (productId, productSource) => {
    const product = selectedProducts.find(p => p.id === productId && p.source === productSource);
    setSelectedProducts(selectedProducts.filter(p => !(p.id === productId && p.source === productSource)));
    if (product) {
      setSuccess(`${product.name} removed from bill`);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const getFreeQuantity = (quantity) => {
    if (!applyFreeQty) return 0;
    return Math.floor((quantity || 0) / 5);
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return selectedProducts
      .filter(p => p.quantity > 0)
      .reduce((sum, p) => sum + p.total, 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (subtotal === 0) return 0;

    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return Math.min(discount, subtotal);
  };

  const calculateTaxAmount = () => {
    if (!isTaxBill) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const afterDiscount = subtotal - discountAmount;

    if (afterDiscount <= 0) return 0;

    if (isExclusiveTaxBill) {
      return afterDiscount * (GST_RATE_PERCENT / 100);
    }

    return afterDiscount - (afterDiscount / GST_MULTIPLIER);
  };

  // Calculate total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const afterDiscount = subtotal - discountAmount;

    if (afterDiscount <= 0) return 0;

    if (isExclusiveTaxBill) {
      return Math.max(0, afterDiscount * GST_MULTIPLIER);
    }

    return Math.max(0, afterDiscount);
  };

  // Calculate change
  const calculateChange = () => {
    const total = calculateTotal();
    return Math.max(0, paidAmount - total);
  };

  // Calculate due amount
  const calculateDue = () => {
    const total = calculateTotal();
    return Math.max(0, total - paidAmount);
  };

  const getLineBaseAmount = (product) => {
    const rate = parseFloat(product.sellPrice) || 0;
    const qty = product.quantity || 0;
    return rate * qty;
  };

  const getLineTaxAmount = (product) => {
    const baseAmount = getLineBaseAmount(product);

    if (!isTaxBill || baseAmount <= 0) return 0;

    if (isExclusiveTaxBill) {
      return baseAmount * (GST_RATE_PERCENT / 100);
    }

    return baseAmount - (baseAmount / GST_MULTIPLIER);
  };

  const getLineTotalAmount = (product) => {
    const baseAmount = getLineBaseAmount(product);

    if (isExclusiveTaxBill) {
      return baseAmount * GST_MULTIPLIER;
    }

    return baseAmount;
  };

  // Handle discount change
  const handleDiscountChange = (value) => {
    setManualDiscount(true);
    const numValue = parseFloat(value) || 0;
    const subtotal = calculateSubtotal();

    if (discountType === 'percentage') {
      if (numValue > 100) {
        setError('Percentage discount cannot exceed 100%');
        setDiscount(100);
      } else if (numValue < 0) {
        setDiscount(0);
      } else {
        setDiscount(numValue);
      }
    } else {
      if (numValue > subtotal) {
        setError('Fixed discount cannot exceed subtotal');
        setDiscount(subtotal);
      } else if (numValue < 0) {
        setDiscount(0);
      } else {
        setDiscount(numValue);
      }
    }

    setTimeout(() => setError(''), 3000);
  };

  // Handle discount type change
  const handleDiscountTypeChange = (type) => {
    setManualDiscount(true);
    const subtotal = calculateSubtotal();
    setDiscountType(type);

    if (type === 'percentage') {
      if (discountType === 'fixed' && subtotal > 0) {
        const percentage = (discount / subtotal) * 100;
        setDiscount(Math.min(100, Math.round(percentage * 100) / 100));
      } else if (discount > 100) {
        setDiscount(100);
      }
    } else {
      if (discountType === 'percentage' && subtotal > 0) {
        const fixed = (subtotal * discount) / 100;
        setDiscount(Math.min(subtotal, Math.round(fixed * 100) / 100));
      } else if (discount > subtotal) {
        setDiscount(subtotal);
      }
    }
  };

  // Reset discount to customer default
  const resetDiscountToDefault = () => {
    setManualDiscount(false);
    if (customerType === 'internal') {
      setDiscount(10);
      setDiscountType('percentage');
    } else {
      setDiscount(0);
      setDiscountType('percentage');
    }
  };

  // Handle cash payment
  const handleCashPayment = (received) => {
    const amount = parseFloat(received) || 0;
    setCashReceived(amount);
    setPaidAmount(amount);
  };

  // Handle exact payment
  const handleExactPayment = () => {
    const total = calculateTotal();
    setPaidAmount(total);
    if (paymentMethod === 'cash') {
      setCashReceived(total);
    }
  };

  // Save bill to database
  const saveBillToDatabase = async () => {
    if (gstError) {
      setError(gstError);
      setTimeout(() => setError(''), 3000);
      return null;
    }

    const activeProducts = selectedProducts.filter(p => p.quantity > 0);

    if (activeProducts.length === 0) {
      setError('No items with quantity > 0 to save!');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const billData = {
        billNumber: billNumber,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        customerGST: customerGST,
        customerAddress: customerAddress,
        customerType: customerType === 'internal' ? 'internal' : 'regular',
        vehicleName: vehicleName,
        vehicleNumber: vehicleNumber,
        companyId: selectedCompany?.id,
        createdBy: JSON.parse(localStorage.getItem('user'))?.id,
        createdByName: createdBy,
        // Send pre-calculated totals and metadata to avoid backend recalculation errors
        subtotal: calculateSubtotal(),
        discountAmount: calculateDiscountAmount(),
        taxAmount: calculateTaxAmount(),
        total: calculateTotal(),
        grandTotal: calculateTotal(), // Some backends use grandTotal
        totalAmount: calculateTotal(), // Some backends use totalAmount
        itemCount: activeProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0),
        billType: billType, // 'inclusive-tax' or 'exclusive-tax'
        paidAmount: paidAmount,
        paymentMethod: paymentMethod,
        hsn: activeProducts.map(p => p.hsn || p.hns || '21050000'),
        items: activeProducts.map(p => ({
          productId: p.id,
          productSource: p.source || 'product',
          productName: p.name,
          productModel: p.model || p.Flavour || '',
          quantity: p.quantity,
          sellPrice: p.sellPrice,
          total: p.total
        }))
      };

      console.log('Saving bill:', billData);

      const response = await api.post('/billing/bills', billData);

      if (response.data.success) {
        setSuccess('Bill saved successfully!');
        setSavedBillId(response.data.billId);
        setBillNumber(response.data.billNumber);
        setLastGeneratedBill({
          billNumber: response.data.billNumber,
          customerPhone: customerPhone,
          customerName: customerName
        });
        setShowWhatsApp(true);
        setBillSaved(true);

        return {
          billId: response.data.billId,
          billNumber: response.data.billNumber
        };
      } else {
        throw new Error(response.data.error || 'Failed to save bill');
      }
    } catch (err) {
      console.error('Save bill error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save bill');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate HTML content for bill
  const generateBillHTML = (overrideBillNumber = null, stateTaxType = 'cgst_sgst') => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    const total = calculateTotal();
    const due = calculateDue();
    const change = calculateChange();
    const amountInWords = formatAmountInWords(total);
    const grossAmount = subtotal - discountAmount;
    const cgstTotal = isTaxBill ? (taxAmount / 2).toFixed(2) : '0.00';
    const sgstTotal = isTaxBill ? (taxAmount / 2).toFixed(2) : '0.00';
    const igstTotal = isTaxBill ? taxAmount.toFixed(2) : '0.00';
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);
    const displayBillNumber = overrideBillNumber || billNumber;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${displayBillNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page { size: A4 portrait; margin: 0; }
            body {
              margin: 0;
              padding: 8px;
              width: 210mm;
              min-height: 297mm;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              line-height: 1.4;
              background: white;
            }
            
            #billPaper {
              width: 100%;
              margin: 0 auto;
              padding: 8px;
              background: white;
            }
            
            .invoice-header {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              align-items: flex-start;
            }
            .logo-container {
              display: flex;
              gap: 8px;
              align-items: flex-start;
            }
            .logo-image {
              width: 90px;
              height: 90px;
              object-fit: contain;
              border: 1px solid #ccc;
              flex-shrink: 0;
            }
            .seller-address {
              flex: 1;
              font-size: 11px;
              line-height: 1.3;
            }
            .seller-address h2 {
              font-size: 16px;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              font-weight: 700;
            }
            .seller-address p {
              margin: 2px 0;
              font-size: 10px;
            }
            .invoice-meta-container {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-width: 200px;
            }
            .invoice-top-right {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              gap: 8px;
            }
            .original-badge {
              padding: 3px 6px;
              background: #000;
              color: #fff;
              font-size: 9px;
              font-weight: bold;
              border-radius: 2px;
            }
            .qr-code {
              width: 140px;
              height: 140px;
              border: 1px solid #000;
            }
            .invoice-details {
              padding: 6px 8px;
              border: 1px solid #000;
              background: #fafafa;
              font-size: 10px;
              line-height: 1.3;
            }
            .invoice-details h3 {
              margin: 0 0 4px 0;
              font-size: 12px;
              font-weight: 700;
            }
            .invoice-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 10px;
            }
            .address-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-bottom: 10px;
            }
            .address-box,
            .invoice-meta-box {
              border: 1px solid #000;
              padding: 6px;
              background: #fff;
              font-size: 10px;
              line-height: 1.3;
              min-height: 90px;
            }
            .address-box strong {
              display: block;
              margin-bottom: 4px;
              font-weight: 700;
              font-size: 10px;
            }
            .address-box p {
              margin: 2px 0;
              font-size: 9px;
            }
            .invoice-meta-box {
              background: #fafafa;
            }
            .amount-words {
              margin-top: 8px;
              margin-bottom: 6px;
              font-size: 11px;
              font-weight: bold;
              border-top: 1px dashed #000;
              padding-top: 6px;
            }
            .gross-summary {
              display: grid;
              gap: 2px;
              padding: 6px;
              border: 1px solid #000;
              background: #fafafa;
              font-size: 10px;
              line-height: 1.3;
              margin-bottom: 8px;
            }
            .bank-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 8px;
            }
            .bank-section {
              border: 1px solid #000;
              padding: 6px;
              background: #fff;
              font-size: 10px;
              line-height: 1.3;
            }
            .bank-section strong {
              display: block;
              font-weight: 700;
              margin-bottom: 3px;
            }
            .bank-section p {
              margin: 2px 0;
              font-size: 9px;
            }
            .terms-section {
              font-size: 9px;
              margin-top: 8px;
              padding: 6px;
              border: 1px dashed #000;
              background: #fff;
              line-height: 1.3;
            }
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin-top: 12px;
              font-size: 10px;
              gap: 6px;
            }
            .signature-box {
              flex: 1;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 4px;
              color: #333;
              font-size: 9px;
            }
            .bill-info {
              margin: 8px 0;
              padding: 4px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            
            .bill-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            
            .bill-number {
              font-weight: bold;
              color: #0066cc;
            }
            
            .customer-section {
              margin: 8px 0;
              padding: 6px;
              background: #f9f9f9;
              border-radius: 2px;
              border: 1px solid #ddd;
            }
            
            .customer-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            
            .customer-label {
              font-weight: bold;
              color: #333;
              font-size: 9px;
            }
            
            .customer-value {
              color: #333;
              text-align: right;
              font-size: 9px;
            }
            
            .customer-type-badge {
              padding: 1px 4px;
              border-radius: 2px;
              font-size: 8px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .internal-badge {
              background: #e3f2fd;
              color: #01579b;
            }
            
            .external-badge {
              background: #fff3e0;
              color: #e65100;
            }
            
            .vehicle-section {
              margin: 6px 0;
              padding: 4px;
              background: #f5f5f5;
              border-radius: 2px;
              border: 1px solid #ddd;
            }
            
            .vehicle-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            
            .bill-items {
              margin: 8px 0;
            }
            
            .bill-items-header {
              display: grid;
              grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'};
              font-weight: bold;
              padding: 3px 2px;
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              font-size: 9px;
              background: #f0f0f0;
              gap: 4px;
              text-align: center;
            }
            
            .bill-item {
              display: grid;
              grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'};
              padding: 2px 2px;
              border-bottom: 1px dotted #ddd;
              font-size: 8px;
              gap: 4px;
              align-items: center;
              text-align: center;
            }
            
            .bill-item-empty {
              text-align: center;
              color: #999;
              padding: 8px;
              font-style: italic;
              font-size: 10px;
            }
            
            .bill-item-name {
              display: flex;
              flex-direction: column;
              text-align: left;
            }
            
            .bill-item-small {
              font-size: 7px;
              color: #666;
              margin-top: 1px;
            }
            
            .bill-summary {
              margin: 8px 0;
              padding: 6px 0;
              border-top: 1px solid #000;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 10px;
              padding: 2px 0;
            }
            
            .summary-row-total {
              font-weight: bold;
              font-size: 11px;
              border-top: 1px dashed #000;
              padding-top: 4px;
              margin-top: 4px;
              color: #333;
            }
            
            .payment-section {
              margin: 8px 0;
              padding: 6px;
              background: #f9f9f9;
              border-radius: 2px;
              border: 1px solid #ddd;
              font-size: 9px;
            }
            
            .payment-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              align-items: center;
              font-size: 9px;
            }
            
            .bill-footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px dashed #000;
              font-size: 8px;
            }
            
            .bill-footer p {
              margin-bottom: 2px;
              color: #666;
              font-size: 8px;
            }
            
            .change-amount {
              font-weight: bold;
              color: ${paidAmount >= total ? '#28a745' : '#dc3545'};
              font-size: 9px;
            }
            
            .created-by {
              margin-top: 4px;
              padding-top: 3px;
              border-top: 1px dotted #ccc;
              font-size: 8px;
              text-align: center;
              color: #666;
            }
            
            .discount-section {
              margin: 6px 0;
              padding: 6px;
              background: #fff9e6;
              border-radius: 2px;
              border: 1px solid #ffe58f;
              font-size: 9px;
            }
            
            .discount-amount {
              font-weight: 600;
              color: #ff7a00;
            }

billTableHeader: {
  backgroundColor: '#f3f4f6'
},


  billTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #dbe2ea'
  },

  th: {
    padding: '10px 8px',
    textAlign: 'center',
    backgroundColor: '#f3f6fb',
    color: '#1f2937',
    fontWeight: '600',
    borderBottom: '1px solid #dbe2ea',
    borderRight: '1px solid #e5e7eb'
  },

  td: {
    padding: '10px 8px',
    textAlign: 'center',
    color: '#131414',
    borderBottom: '1px solid #141414',
    borderRight: '1px solid #191919'
  },

  tr: {
    transition: 'background 0.2s ease'
  },

  emptyTableCell: {
    padding: '18px',
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    backgroundColor: '#fafafa'
  },

  billItemNameCell: {
    textAlign: 'left',
    minWidth: '140px',
    fontWeight: '500'
  },

  billItemSmall: {
    display: 'block',
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '2px'
  }

          </style>
        </head>
        <body>
          <div id="billPaper">
            <div class="invoice-header">
              <div class="logo-container">
                <img src="${logoDataUrl}" alt="Company Logo" class="logo-image" />
                <div class="seller-address">
                  <h2>${shopDetails.name}</h2>
                  <p>${shopDetails.address}</p>
                  <p>${shopDetails.city}</p>
                  <p>Contact number : ${shopDetails.phone}</p>
                  <p>E-mail : ${shopDetails.email}</p>
                  ${isTaxBill && shopDetails.gst ? `<p>GST: ${shopDetails.gst}</p>` : ''}
                </div>
              </div>
              <div class="invoice-meta-container">
                <div class="invoice-top-right">
                  <span class="original-badge">ORIGINAL</span>
                  <img class="qr-code" src="${QRImage}" alt="QR Code" />
                </div>
              </div>
            </div>

            <div class="address-grid">
              <div class="address-box">
                <strong>SELLING ADDRESS</strong>
                <p>${shopDetails.address}</p>
                <p>${shopDetails.city}</p>
                <p>PINCODE:600052 · ${shopDetails.phone}</p>
              </div>
              <div class="address-box">
                <strong>SHIPPING ADDRESS</strong>
                <p>${customerName || 'Walk-in Customer'}</p>
                ${customerAddress ? `<p>${customerAddress}</p>` : ''}
                ${customerPhone ? `<p>Ph: ${customerPhone}</p>` : ''}
              </div>
              <div class="invoice-meta-box">
                <div class="invoice-row"><span>Invoice No :</span><span>${billNumber || '---'}</span></div>
                <div class="invoice-row"><span>Date :</span><span>${currentDate}</span></div>
                <div class="invoice-row"><span>Customer ID :</span><span>${customerPhone || customerEmail || '-'}</span></div>
                <div class="invoice-row"><span>D.C. No :</span><span>-</span></div>
              </div>
            </div>
              <div class="bill-info-row">
                <span>Bill No:</span>
                <span class="bill-number">${displayBillNumber}</span>
              </div>
              <div class="bill-info-row">
                <span>Date:</span>
                <span>${currentDate}</span>
              </div>
              <div class="bill-info-row">
                <span>Time:</span>
                <span>${currentTime}</span>
              </div>
            </div>
            
            <div class="customer-section">
              <div class="customer-row">
                <span class="customer-label">Customer Type:</span>
                <span class="customer-type-badge ${customerType === 'internal' ? 'internal-badge' : 'external-badge'}">
                  ${customerType === 'internal' ? '🏢 INTERNAL' : '👤 EXTERNAL'}
                </span>
              </div>
              
              <div class="customer-row">
                <span class="customer-label">Name:</span>
                <span class="customer-value">${customerName}</span>
              </div>
              
              ${customerPhone ? `
              <div class="customer-row">
                <span class="customer-label">Phone:</span>
                <span class="customer-value">${customerPhone}</span>
              </div>
              ` : ''}
              
              ${customerEmail ? `
              <div class="customer-row">
                <span class="customer-label">Email:</span>
                <span class="customer-value">${customerEmail}</span>
              </div>
              ` : ''}
              
              ${customerAddress ? `
              <div class="customer-row">
                <span class="customer-label">Address:</span>
                <span class="customer-value">${customerAddress}</span>
              </div>
              ` : ''}
              
              ${customerGST && isTaxBill ? `
              <div class="customer-row">
                <span class="customer-label">GST:</span>
                <span class="customer-value">${customerGST}</span>
              </div>
              ` : ''}
            </div>
            
            ${discount > 0 ? `
            <div class="discount-section">
              <div class="discount-amount">
                Discount Amount: -₹${discountAmount.toFixed(2)}
                ${!manualDiscount && customerType === 'internal' ? ' (Staff discount)' : ''}
              </div>
            </div>
            ` : ''}
            
            <div class="bill-items">
              <div class="bill-items-header">
                <span>S.N</span>
                <span style="text-align: left;">Item Name</span>
                <span>HSN</span>
                <span>Qty</span>
                <span>Free</span>
                <span>Rate</span>
                ${isTaxBill ? (stateTaxType === 'igst' ? `<span>IGST ${GST_RATE_PERCENT}%</span>` : `<span>CGST ${(GST_RATE_PERCENT / 2).toFixed(1)}%</span><span>SGST ${(GST_RATE_PERCENT / 2).toFixed(1)}%</span>`) : ''}
                <span>Total</span>
              </div>
              <div>
                ${activeProducts.length === 0 ? `
                  <div class="bill-item-empty">
                    <span style="grid-column: 1 / -1; text-align: center;">--- No items in bill ---</span>
                  </div>
                ` : activeProducts.map((product, idx) => {
      const rate = parseFloat(product.sellPrice) || 0;
      const qty = product.quantity || 0;
      const freeQty = getFreeQuantity(qty);
      const totalItemTax = getLineTaxAmount(product);
      const cgstAmt = (totalItemTax / 2).toFixed(2);
      const sgstAmt = (totalItemTax / 2).toFixed(2);
      const igstAmt = totalItemTax.toFixed(2);
      const itemTotalAmt = getLineTotalAmount(product);

      return `
                    <div class="bill-item">
                      <span>${idx + 1}</span>
                      <span class="bill-item-name">
                        ${product.name.length > 12 ? product.name.substring(0, 10) + '...' : product.name}
                        ${product.model ? `<small class="bill-item-small">${product.model}</small>` : ''}
                      </span>
                      <span>${product.hns || product.hsn || '21050000'}</span>
                      <span>${qty}</span>
                      <span>${freeQty}</span>
                      <span>${rate.toFixed(2)}</span>
                      ${isTaxBill ? (stateTaxType === 'igst' ? `<span>${igstAmt}</span>` : `<span>${cgstAmt}</span><span>${sgstAmt}</span>`) : ''}
                      <span>${itemTotalAmt.toFixed(2)}</span>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>
            
            <div class="bill-summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              
              ${discount > 0 ? `
              <div class="summary-row">
                <span>Discount (${discount}${discountType === 'percentage' ? '%' : '₹'}):</span>
                <span>-₹${discountAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              
              <div class="summary-row">
                <span>After Discount:</span>
                <span>₹${(subtotal - discountAmount).toFixed(2)}</span>
              </div>
              
              ${tax > 0 && isTaxBill ? `
              <div class="summary-row">
                <span>GST (${GST_RATE_PERCENT}%):</span>
                <span>+₹${taxAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              
              <div class="summary-row summary-row-total">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>

            <div class="amount-words">
              Amount in words : ${amountInWords}
            </div>

            <div class="gross-summary">
              <div class="invoice-row">
                <span>Gross Amt:</span>
                <span>₹${grossAmount.toFixed(2)}</span>
              </div>
              ${isTaxBill ? (stateTaxType === 'igst' ? `
              <div class="invoice-row">
                <span>IGST ${GST_RATE_PERCENT}%:</span>
                <span>₹${igstTotal}</span>
              </div>
              ` : `
              <div class="invoice-row">
                <span>CGST ${(GST_RATE_PERCENT / 2).toFixed(1)}%:</span>
                <span>₹${cgstTotal}</span>
              </div>
              <div class="invoice-row">
                <span>SGST ${(GST_RATE_PERCENT / 2).toFixed(1)}%:</span>
                <span>₹${sgstTotal}</span>
              </div>
              `) : ''}
              <div class="invoice-row">
                <span>Rounded Net Amount:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>

            <div class="bank-details">
              <div class="bank-section">
                <strong>Bank Details :</strong>
                <p style="margin: 6px 0 0">Sri Yuvaas Enterprise</p>
                <p style="margin: 4px 0">ICICI BANK : IFSC : ICIC0001543 </p>
                 <p style="margin: 4px 0">Triplicane Branch</p>
                <p style="margin: 4px 0">A/c No : 154305001002</p>
                <p style="margin: 4px 0">Phonepe : ${shopDetails.phone}</p>
              </div>
              <div class="bank-section">
                <strong>Remarks :</strong>
                <p style="margin: 6px 0 0">Goods once sold will not be taken back.</p>
                <p style="margin: 4px 0">24% interest p.a. on overdue payments.</p>
              </div>
            </div>

            <div class="terms-section">
              Goods once sold will not be taken back. If the payment is not made within due date, we will charge interest on the bill amount. Please pay as per bill amount only.
            </div>

            <div class="signature-row">
              <div class="signature-box">Prepared by</div>
              <div class="signature-box">Received by</div>
              <div class="signature-box">Authorized Signature</div>
            </div>

            <div class="payment-section">
              <div class="payment-row">
                <span>Payment Method:</span>
                <span>${paymentMethod.toUpperCase()}</span>
              </div>
              
              <div class="payment-row">
                <span>Paid Amount:</span>
                <span>₹${paidAmount.toFixed(2)}</span>
              </div>
              
              <div class="payment-row">
                <span>Payment Status:</span>
                <span style="color: ${paymentStatus === 'paid' ? '#28a745' : paymentStatus === 'partial' ? '#ffc107' : '#dc3545'}; font-weight: bold;">
                  ${paymentStatus.toUpperCase()}
                </span>
              </div>
              
              ${due > 0 && paymentStatus !== 'pending' ? `
              <div class="payment-row">
                <span>Due Amount:</span>
                <span>₹${due.toFixed(2)}</span>
              </div>
              ` : ''}
              
              ${paymentMethod === 'cash' && paidAmount >= total ? `
              <div class="payment-row">
                <span>Change:</span>
                <span class="change-amount">₹${change.toFixed(2)}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="bill-footer">
              <p>Thank you for your purchase!</p>
              <p>Goods once sold not returnable</p>
              <p>** Computer generated bill **</p>
              ${paymentMethod !== 'cash' && transactionId ? `
              <p>${paymentMethod.toUpperCase()}: ${transactionId}</p>
              ` : ''}
              <div class="created-by">
                Bill created by: ${createdBy}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Download bill as HTML file
  const downloadBill = () => {
    const subtotal = calculateSubtotal();
    if (subtotal === 0) {
      setError('No items with quantity > 0 to download!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const billHTML = generateBillHTML();
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_${billNumber.replace(/[\\/]/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess('Bill downloaded successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    const subtotal = calculateSubtotal();
    if (subtotal === 0) {
      setError('No items with quantity > 0 in bill!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const savedData = await saveBillToDatabase();

    if (savedData) {
      downloadBill();
    }
  };

  // Handle print — uses a hidden iframe so focus never leaves the main window
  const handlePrint = async (stateTaxType = 'cgst_sgst') => {
    const subtotal = calculateSubtotal();
    if (subtotal === 0) {
      setError('No items with quantity > 0 to print!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const savedData = await saveBillToDatabase();
    if (!savedData) return;

    const confirmedBillNumber = savedData.billNumber;
    const printHTML = generateBillHTML(confirmedBillNumber, stateTaxType);
    const adminPrint = isAdminUser;

    // Remove any previous hidden print iframe
    const existingFrame = document.getElementById('__billPrintFrame__');
    if (existingFrame) existingFrame.remove();

    // Build the full print document HTML
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${confirmedBillNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              border: none;
              background: none;
              box-shadow: none;
              outline: none;
            }
            body {
              margin: 0;
              padding: 0;
              width: ${adminPrint ? '210mm' : '80mm'};
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.3;
              background: white;
            }
            #billPaper {
              width: ${adminPrint ? '210mm' : '280px'};
              margin: 0 auto;
              padding: 12px;
              background: white;
              border: none;
            }
            .bill-items-header {
              display: grid;
              grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'};
              font-weight: bold;
              padding: 4px 0;
              border-bottom: 1px solid #000 !important;
              font-size: 10px;
              text-align: center;
            }
            .bill-item {
              display: grid;
              grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'};
              padding: 3px 0;
              border-bottom: 1px dotted #000 !important;
              font-size: 9px;
              text-align: center;
              align-items: center;
            }
            .bill-summary {
              margin: 10px 0;
              padding: 8px 0;
              border-top: 1px solid #000 !important;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 10px;
            }
            .summary-row-total {
              font-weight: bold;
              font-size: 12px;
              border-top: 1px dashed #000 !important;
              padding-top: 6px;
              margin-top: 6px;
            }
            .created-by {
              margin-top: 8px;
              padding-top: 5px;
              border-top: 1px dotted #000 !important;
              font-size: 8px;
              text-align: center;
            }
            input, select, button, textarea { display: none !important; }
            .payment-section { display: none !important; }
            .discount-section { display: none !important; }
            * {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: ${isAdminUser ? 'A4 portrait' : '80mm auto'};
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${printHTML.replace('</html>', '')}
        </body>
      </html>
    `;

    // Create a hidden iframe — printing inside it keeps focus on the main window
    const iframe = document.createElement('iframe');
    iframe.id = '__billPrintFrame__';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;border:none;';
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print error:', e);
      }
      // Remove iframe after printing, restore focus to main window
      setTimeout(() => {
        iframe.remove();
        window.focus();
      }, 1000);
    };

    // Write the HTML into the iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(fullHTML);
    iframe.contentDocument.close();
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    if (!customerPhone) {
      setError('Please enter customer phone number to share via WhatsApp');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    const total = calculateTotal();
    const due = calculateDue();
    const activeProducts = selectedProducts.filter(p => p.quantity > 0);

    let message = `*${shopDetails.name}*\n`;
    message += `${shopDetails.address}\n`;
    message += `${shopDetails.city}\n`;
    if (shopDetails.phone) message += `📞 Ph: ${shopDetails.phone}\n`;
    message += `\n`;
    message += `🧾 *Bill No:* ${billNumber}\n`;
    message += `📘 *Bill Type:* ${isInclusiveTaxBill ? 'Inclusive Tax Bill' : 'Exclusive Tax Bill'}\n`;
    if (applyFreeQty) {
      message += `🎁 *Free Qty Offer:* For every 5 products, 1 free\n`;
    }
    message += `📅 *Date:* ${currentDate} ${currentTime}\n`;
    message += `👤 *Customer:* ${customerName}\n`;
    message += `🏷️ *Type:* ${customerType === 'internal' ? 'INTERNAL' : 'EXTERNAL'}\n`;
    if (vehicleName) message += `🚗 *Vehicle:* ${vehicleName}\n`;
    if (vehicleNumber) message += `🔢 *Vehicle No:* ${vehicleNumber}\n`;
    message += `\n`;
    message += `════════════════════════\n`;
    message += `*ITEMS:*\n`;

    activeProducts.forEach((p, idx) => {
      const freeQty = getFreeQuantity(p.quantity || 0);
      message += `${idx + 1}. ${p.name.substring(0, 20)}${p.name.length > 20 ? '...' : ''}\n`;
      message += `   ${p.quantity} x ₹${p.sellPrice}`;
      if (freeQty > 0) message += ` + Free ${freeQty}`;
      message += ` = ₹${getLineTotalAmount(p).toFixed(2)}\n`;
    });

    message += `════════════════════════\n`;
    message += `*Subtotal:* ₹${subtotal.toFixed(2)}\n`;
    if (discountAmount > 0) message += `*Discount:* -₹${discountAmount.toFixed(2)}\n`;
    if (taxAmount > 0) message += `*Tax:* +₹${taxAmount.toFixed(2)}\n`;
    message += `*TOTAL:* ₹${total.toFixed(2)}\n`;
    message += `════════════════════════\n`;
    message += `💳 *Payment:* ${paymentMethod.toUpperCase()}\n`;
    message += `💰 *Paid:* ₹${paidAmount.toFixed(2)}\n`;
    message += `📊 *Status:* ${paymentStatus.toUpperCase()}\n`;
    if (due > 0) message += `⚠️ *Due:* ₹${due.toFixed(2)}\n`;
    message += `════════════════════════\n`;
    message += `\n`;
    message += `🙏 *Thank you for shopping with us!*\n`;
    message += `🚫 Goods once sold not returnable\n`;
    message += `💻 Computer generated bill\n`;
    message += `\n`;
    message += `👤 *Created by:* ${createdBy}\n`;
    message += `\n`;
    message += `*${shopDetails.name}*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    setSuccess('WhatsApp opened with bill details!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Clear bill
  const clearBill = () => {
    if (window.confirm('Clear all items?')) {
      setSelectedProducts([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerGST('');
      setGstError('');
      setCustomerAddress('');
      setCustomerType('external');
      setCustomerDiscount(0);
      setVehicleName('');
      setVehicleNumber('');
      setDiscount(0);
      setDiscountType('percentage');
      setManualDiscount(false);
      setTax(0);
      setTaxType('percentage');
      setPaidAmount(0);
      setCashReceived(0);
      setPaymentMethod('cash');
      setPaymentStatus('pending');
      setCardNumber('');
      setCardHolderName('');
      setUpiId('');
      setTransactionId('');
      setBankName('');
      setChequeNumber('');
      setError('');
      setSuccess('');
      setBillSaved(false);
      setShowWhatsApp(false);
      setLastGeneratedBill(null);
      setSavedBillId(null);
      generateBillNumber();
    }
  };

  // Handle new bill
  const handleNewBill = () => {
    clearBill();
  };

  // Handle key press for barcode
  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      getProductByBarcode();
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const response = await api.get('/health');
      console.log('API Health:', response.data);
    } catch (err) {
      console.error('API Health Check Failed:', err);
    }
  };

  // Run API test on mount
  useEffect(() => {
    testAPIConnection();
  }, []);

  // Filter out items with quantity 0 for display in bill summary
  const activeProducts = selectedProducts.filter(p => p.quantity > 0);
  const subtotal = calculateSubtotal();
  const discountAmount = calculateDiscountAmount();
  const taxAmount = calculateTaxAmount();
  const total = calculateTotal();
  const due = calculateDue();
  const change = calculateChange();

  // Dynamic styles that depend on state
  const dynamicStyles = {
    changeAmount: {
      fontWeight: 'bold',
      color: paidAmount >= total ? '#10b981' : '#ef4444',
      fontSize: '11px',
    },
    zeroQuantity: {
      opacity: 0.6,
      background: '#fef3c7',
    }
  };

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ marginBottom: '12px', color: '#1e293b' }}>Authentication Required</h2>
          <p style={{ color: '#ef4444', margin: '20px 0' }}>{error || 'Please login to access billing'}</p>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, padding: '12px 32px' }}
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setCustomerPhone(value);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Panel - Product Selection */}
      <div style={styles.productPanel} className="no-print">
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>
            <span>🧾</span> Create New Bill
          </h2>
          <p style={styles.panelSubtitle}>Add products, manage items, and generate invoice</p>
        </div>

        <div style={styles.panelContent}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={applyFreeQty}
                  onChange={(e) => setApplyFreeQty(e.target.checked)}
                />
                Apply Free Qty Offer: for every 5 products, 1 free
              </label>
            </div>
          </div>

          {/* Company Selector */}
          {companies.length > 0 && (
            <div style={styles.companySelector}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setShowCompanySelector(!showCompanySelector)}
              >
                <span>
                  🏢 <span style={styles.companyName}>
                    {selectedCompany ? selectedCompany.name : 'Select Company'}
                  </span>
                </span>
                <span style={{ fontSize: '14px' }}>{showCompanySelector ? '▲' : '▼'}</span>
              </div>
              {showCompanySelector && (
                <div style={styles.companyDropdown}>
                  {companies.map(company => (
                    <div
                      key={company.id}
                      style={styles.companyOption}
                      onClick={() => handleCompanySelect(company)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {company.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ ...styles.alert, ...styles.alertError }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div style={{ ...styles.alert, ...styles.alertSuccess }}>
              <span>✅</span> {success}
            </div>
          )}

          <div style={styles.searchSection}>
            <div style={styles.searchBox}>
              <label style={styles.searchLabel}>🔍 Search Products</label>
              <input
                type="text"
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type product name or model..."
                autoComplete="off"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              {searchLoading && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Searching...</div>}
            </div>

            <div style={styles.barcodeInput}>
              <input
                type="text"
                style={styles.barcodeField}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleBarcodeKeyPress}
                placeholder="📱 Scan barcode"
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                style={{
                  ...styles.barcodeButton,
                  ...(loading ? styles.btnDisabled : {})
                }}
                onClick={getProductByBarcode}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.map(product => (
                  <div
                    key={`${product.source || 'product'}-${product.id}`}
                    style={styles.searchResultItem}
                    className="search-result-item"
                    onClick={() => addProductToBill(product)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={styles.resultInfo}>
                      <div style={styles.resultName}>{product.name}</div>
                      <div style={styles.resultDetails}>
                        {product.model || ''} | Stock: {product.quantity}
                      </div>
                    </div>
                    <div style={styles.resultPrice}>₹{product.sellPrice}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.selectedProducts}>
            <div style={styles.selectedProductsTitle}>
              <span>🛒 Bill Items</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {activeProducts.length} active / {selectedProducts.length} total
              </span>
            </div>
            <div style={styles.selectedItemsList}>
              {selectedProducts.length === 0 ? (
                <p style={styles.noItems}>No items added yet. Search or scan products to add.</p>
              ) : (
                selectedProducts.map(product => (
                  <div
                    key={`${product.source || 'product'}-${product.id}`}
                    style={{
                      ...styles.selectedItem,
                      ...(product.quantity === 0 ? dynamicStyles.zeroQuantity : {})
                    }}
                  >
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{product.name}</span>
                      {product.model && (
                        <span style={styles.itemModel}>{product.model}</span>
                      )}
                      {product.quantity === 0 && (
                        <span style={{ fontSize: '10px', color: '#d97706' }}>(Zero quantity)</span>
                      )}
                    </div>
                    <div style={styles.itemPrice}>₹{product.sellPrice}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => updateQuantity(product.id, product.source || 'product', Math.max(0, product.quantity - 1))}
                      >-</button>
                      <input
                        type="number"
                        style={styles.itemQuantity}
                        value={product.quantity}
                        min="0"
                        max={product.maxQuantity}
                        onChange={(e) => updateQuantity(product.id, product.source || 'product', e.target.value)}
                      />
                      <button
                        onClick={() => updateQuantity(product.id, product.source || 'product', product.quantity + 1)}
                        disabled={product.maxQuantity ? product.quantity >= product.maxQuantity : false}
                        title={product.maxQuantity && product.quantity >= product.maxQuantity ? "Maximum stock reached" : ""}
                        style={{ ...styles.qtyBtn, opacity: (product.maxQuantity && product.quantity >= product.maxQuantity) ? 0.5 : 1 }}
                      >+</button>
                    </div>
                    <div style={styles.itemTotal}>₹{product.total.toFixed(2)}</div>
                    <button
                      style={styles.removeBtn}
                      onClick={() => removeProduct(product.id, product.source || 'product')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                      title="Remove completely"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            {selectedProducts.length > 0 && (
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
                💡 Set quantity to 0 to keep item in list (will not be billed)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Bill Preview */}
      <div style={styles.billPanel} className="no-print">
        <div style={styles.billContainer}>
          <div
            style={styles.billPaper}
            id="billPaper"
            ref={billPaperRef}
          >
            <div style={styles.invoiceHeader}>
              <div style={styles.logoContainer}>
                <img
                  src={logoImage}
                  alt="Company Logo"
                  style={styles.logoImage}
                />
                <div style={styles.sellerAddress}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{shopDetails.name}</h2>
                  <p style={{ margin: '4px 0' }}>{shopDetails.address}</p>
                  <p style={{ margin: '4px 0' }}>{shopDetails.city}</p>
                  <p style={{ margin: '4px 0' }}>📞 {shopDetails.phone}</p>
                  <p style={{ margin: '4px 0' }}>✉️ {shopDetails.email}</p>
                  {isTaxBill && shopDetails.gst && (
                    <p style={{ margin: '4px 0' }}>GST: {shopDetails.gst}</p>
                  )}
                </div>
              </div>
              <div style={styles.invoiceMetaContainer}>
                <div style={styles.invoiceTopRight}>
                  <span style={styles.originalBadge}>ORIGINAL</span>
                  <img
                    style={styles.qrCode}
                    src={QRImage}
                    alt="QR Code"
                  />
                </div>
                {/* <div style={styles.invoiceDetails}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>INVOICE</h3>
                  <div style={styles.invoiceRow}><span>Invoice No :</span><span><strong>{billNumber || '---'}</strong></span></div>
                  <div style={styles.invoiceRow}><span>Date :</span><span>{currentDate}</span></div>
                  <div style={styles.invoiceRow}><span>Customer ID :</span><span>{customerPhone || customerEmail || '-'}</span></div>
                  <div style={styles.invoiceRow}><span>D.C. No :</span><span>-</span></div>
                </div> */}
              </div>
            </div>

            <div style={styles.addressGrid}>
              <div style={styles.addressBox}>
                <strong>🏢 SELLING ADDRESS</strong>
                <p style={{ marginTop: '8px' }}>{shopDetails.address}</p>
                <p>{shopDetails.city}</p>
                <p>PINCODE:600052 · {shopDetails.phone}</p>
              </div>
              <div style={styles.addressBox}>
                <strong>🚚 SHIPPING ADDRESS</strong>
                <p style={{ marginTop: '8px' }}>{customerName || 'Walk-in Customer'}</p>
                {customerAddress && <p>{customerAddress}</p>}
                {customerPhone && <p>📞 {customerPhone}</p>}
              </div>
              <div style={styles.invoiceMetaBox}>
                <div style={styles.invoiceRow}><span>Invoice No :</span><span><strong>{billNumber || '---'}</strong></span></div>
                <div style={styles.invoiceRow}><span>Date :</span><span>{currentDate}</span></div>
                <div style={styles.invoiceRow}><span>Customer ID :</span><span>{customerPhone || customerEmail || '-'}</span></div>
                <div style={styles.invoiceRow}><span>D.C. No :</span><span>-</span></div>
              </div>
            </div>

            <div style={styles.customerSection}>
              <div style={styles.customerRow}>
                <span style={styles.customerLabel}>Customer Type:</span>
                <span
                  style={{
                    ...styles.customerTypeBadge,
                    ...(customerType === 'internal' ? styles.internalBadge : styles.externalBadge)
                  }}
                >
                  {customerType === 'internal' ? '🏢 INTERNAL' : '👤 EXTERNAL'}
                </span>
              </div>

              <div style={styles.customerRow}>
                <span style={styles.customerLabel}>Name:</span>
                <span style={styles.customerValue}><strong>{customerName}</strong></span>
              </div>

              {customerPhone && (
                <div style={styles.customerRow}>
                  <span style={{ ...styles.customerLabel, color: '#3b82f6' }}>📞 Phone:</span>
                  <span style={styles.customerValue}>{customerPhone}</span>
                </div>
              )}

              {customerEmail && (
                <div style={styles.customerRow}>
                  <span style={styles.customerLabel}>✉️ Email:</span>
                  <span style={styles.customerValue}>{customerEmail}</span>
                </div>
              )}

              {customerAddress && (
                <div style={styles.customerRow}>
                  <span style={styles.customerLabel}>📍 Address:</span>
                  <span style={styles.customerValue}>{customerAddress}</span>
                </div>
              )}

              {customerGST && isTaxBill && (
                <div style={styles.customerRow}>
                  <span style={styles.customerLabel}>GST:</span>
                  <span style={styles.customerValue}>{customerGST}</span>
                </div>
              )}
            </div>

            <div style={styles.customerSection} className="no-print">
              <select
                style={styles.customerTypeSelect}
                value={customerType}
                onChange={(e) => {
                  setCustomerType(e.target.value);
                  setManualDiscount(false);
                }}
              >
                <option value="external">👤 External Customer</option>
                <option value="internal">🏢 Internal (Staff)</option>
              </select>

              <input
                type="text"
                style={styles.customerInput}
                value={customerName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setCustomerName(newName);

                  // Check if name matches an available customer
                  const matchedCustomer = availableCustomers.find(c => c.name && c.name.toLowerCase() === newName.toLowerCase());
                  if (matchedCustomer) {
                    setCustomerPhone(matchedCustomer.phone || '');
                    setCustomerEmail(matchedCustomer.email || '');
                    setCustomerAddress(matchedCustomer.address || '');
                    setCustomerGST(matchedCustomer.gst || '');
                    setCustomerType(matchedCustomer.type === 'regular' ? 'external' : (matchedCustomer.type || 'external'));
                    setSuccess('Customer found! Details auto-filled.');
                    setTimeout(() => setSuccess(''), 3000);
                  }
                }}
                placeholder="Customer Name"
                list="customer-names"
              />
              <datalist id="customer-names">
                {availableCustomers.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>

              <input
                type="text"
                style={{
                  ...styles.customerInput,
                  borderColor: fetchingCustomer ? '#3b82f6' : '#e2e8f0',
                  background: fetchingCustomer ? '#eff6ff' : 'white'
                }}
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder={fetchingCustomer ? "Searching..." : "📞 Phone Number"}
                maxLength="10"
              />

              <input
                type="email"
                style={styles.customerInput}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="✉️ Email Address"
              />

              <input
                type="text"
                style={styles.customerInput}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="📍 Address"
              />

              <input
                type="text"
                style={{
                  ...styles.customerInput,
                  borderColor: gstError ? '#ef4444' : '#e2e8f0',
                  marginBottom: gstError ? '4px' : '8px'
                }}
                value={customerGST}
                onChange={(e) => setCustomerGST(e.target.value.toUpperCase())}
                placeholder="GST Number (if applicable)"
              />
              {gstError && (
                <div style={{ color: '#ef4444', fontSize: '11px', marginBottom: '8px', paddingLeft: '4px' }}>
                  {gstError}
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div style={styles.discountSection} className="no-print">
              <div
                style={styles.discountHeader}
                onClick={() => setShowDiscountInput(!showDiscountInput)}
              >
                <span style={styles.discountTitle}>
                  {manualDiscount ? '✏️ Manual Discount' : '💰 Default Discount'}
                </span>
                <span style={styles.discountToggle}>
                  {showDiscountInput ? '▼' : '▶'}
                </span>
              </div>

              {showDiscountInput && (
                <div style={styles.discountControls}>
                  <select
                    style={styles.discountTypeSelect}
                    value={discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value)}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>

                  <input
                    type="number"
                    style={styles.discountInput}
                    value={discount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                  />
                </div>
              )}

              <div style={styles.discountAmount}>
                💰 Discount Amount: <strong>-₹{discountAmount.toFixed(2)}</strong>
                {!manualDiscount && customerType === 'internal' && (
                  <span style={{ fontSize: '9px', marginLeft: '8px', color: '#64748b' }}>
                    (Staff discount)
                  </span>
                )}
              </div>

              {manualDiscount && (
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnSecondary,
                    fontSize: '11px',
                    padding: '6px 12px',
                    marginTop: '8px',
                    width: '100%'
                  }}
                  onClick={resetDiscountToDefault}
                >
                  Reset to Default
                </button>
              )}
            </div><table style={styles.billTable}>
              <thead>
                <tr style={styles.billTableHeader}>
                  <th>S.N</th>
                  <th>Item Name</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Free</th>
                  <th>Rate</th>

                  {isTaxBill && (
                    <th>CGST {(GST_RATE_PERCENT / 2).toFixed(1)}%</th>
                  )}

                  {isTaxBill && (
                    <th>SGST {(GST_RATE_PERCENT / 2).toFixed(1)}%</th>
                  )}

                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {activeProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isTaxBill ? 9 : 7}
                      style={styles.emptyTableCell}
                    >
                      --- No items in bill ---
                    </td>
                  </tr>
                ) : (
                  activeProducts.map((product, idx) => {

                    const rate = parseFloat(product.sellPrice) || 0;
                    const qty = product.quantity || 0;

                    const freeQty = getFreeQuantity(qty);

                    const totalItemTax = getLineTaxAmount(product);

                    const cgstAmt = (totalItemTax / 2).toFixed(2);
                    const sgstAmt = (totalItemTax / 2).toFixed(2);

                    const itemTotalAmt = getLineTotalAmount(product);

                    return (
                      <tr
                        key={`${product.source || 'product'}-${product.id}`}
                      >
                        <td>{idx + 1}</td>

                        <td style={styles.billItemNameCell}>
                          {product.name.length > 16
                            ? product.name.substring(0, 14) + '...'
                            : product.name}

                          {product.model && (
                            <small style={styles.billItemSmall}>
                              {product.model}
                            </small>
                          )}
                        </td>

                        <td>
                          {product.hns || product.hsn || '21050000'}
                        </td>

                        <td>{qty}</td>

                        <td>{freeQty}</td>

                        <td>₹{rate.toFixed(2)}</td>

                        {isTaxBill && <td>₹{cgstAmt}</td>}

                        {isTaxBill && <td>₹{sgstAmt}</td>}

                        <td>
                          <strong>
                            ₹{itemTotalAmt.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div style={styles.billSummary}>
              <div style={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div style={styles.summaryRow}>
                  <span>Discount ({discount}{discountType === 'percentage' ? '%' : '₹'}):</span>
                  <span style={{ color: '#ef4444' }}>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={styles.summaryRow}>
                <span>After Discount:</span>
                <span>₹{(subtotal - discountAmount).toFixed(2)}</span>
              </div>

              {tax > 0 && isTaxBill && (
                <div style={styles.summaryRow}>
                  <span>GST ({GST_RATE_PERCENT}%):</span>
                  <span style={{ color: '#3b82f6' }}>+₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={styles.summaryRowTotal}>
                <span>Total:</span>
                <span style={{ color: '#10b981', fontSize: '14px' }}>₹{(Number(total) + Number(taxAmount)).toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.amountWords}>
              <span>🔤 Amount in words : </span>
              <strong>{formatAmountInWords(total)}</strong>
            </div>

            <div style={styles.grossSummary}>
              <div style={styles.invoiceRow}>
                <span>Gross Amt:</span>
                <span>₹{(subtotal - discountAmount).toFixed(2)}</span>
              </div>
              {isTaxBill && (
                <>
                  <div style={styles.invoiceRow}>
                    <span>CGST {(GST_RATE_PERCENT / 2).toFixed(1)}%:</span>
                    <span>₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                  <div style={styles.invoiceRow}>
                    <span>SGST {(GST_RATE_PERCENT / 2).toFixed(1)}%:</span>
                    <span>₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div style={styles.invoiceRow}>
                <span>Rounded Net Amount:</span>
                <span><strong>₹{total.toFixed(2)}</strong></span>
              </div>
            </div>

            <div style={styles.bankDetails}>
              <div style={styles.bankSection}>
                <strong>🏦 Bank Details :</strong>
                <p style={{ margin: '6px 0 0' }}>Sri Yuvaas Enterprise</p>
                <p style={{ margin: '4px 0' }}>ICICI BANK : IFSC : ICIC0001543 </p>
                <p style={{ margin: '4px 0' }}>Triplicane Branch</p>
                <p style={{ margin: '4px 0' }}>A/c No : 154305001002</p>
                <p style={{ margin: '4px 0' }}>📱 Phonepe : {shopDetails.phone}</p>
              </div>
              <div style={styles.bankSection}>
                <strong>📝 Remarks :</strong>
                <p style={{ margin: '6px 0 0' }}>Goods once sold will not be taken back.</p>
                <p style={{ margin: '4px 0' }}>24% interest p.a. on overdue payments.</p>
              </div>
            </div>

            <div style={styles.termsSection}>
              ⚠️ Goods once sold will not be taken back. If the payment is not made within due date, we will charge interest on the bill amount. Please pay as per bill amount only.
            </div>

            <div style={styles.signatureRow}>
              <div style={styles.signatureBox}>Prepared by</div>
              <div style={styles.signatureBox}>Received by</div>
              <div style={styles.signatureBox}>Authorized Signature</div>
            </div>

            <div style={styles.paymentSection}>
              <div style={styles.paymentRow}>
                <span>💳 Payment Method:</span>
                <select
                  style={styles.paymentSelect}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="upi">📱 UPI</option>
                  <option value="cheque">📝 Cheque</option>
                  <option value="mixed">🔄 Mixed</option>
                </select>
              </div>

              {showPaymentDetails && (
                <div style={styles.paymentDetails}>
                  {paymentMethod === 'cash' && (
                    <>
                      <div style={styles.paymentRow}>
                        <span>Cash Received:</span>
                        <input
                          type="number"
                          style={styles.paymentInput}
                          value={cashReceived}
                          onChange={(e) => handleCashPayment(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div style={styles.paymentRow}>
                        <span>Change:</span>
                        <span style={dynamicStyles.changeAmount}>₹{change.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'card' && (
                    <>
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number (last 4 digits)"
                        maxLength="4"
                      />
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="Card Holder Name"
                      />
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Transaction ID"
                      />
                    </>
                  )}

                  {paymentMethod === 'upi' && (
                    <>
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="UPI ID"
                      />
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Transaction ID"
                      />
                    </>
                  )}

                  {paymentMethod === 'cheque' && (
                    <>
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        placeholder="Cheque Number"
                      />
                      <input
                        type="text"
                        style={styles.paymentDetailsInput}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                      />
                    </>
                  )}

                  {paymentMethod === 'mixed' && (
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      <p>Mixed payment - Please enter details in POS</p>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.paymentRow}>
                <span>💰 Paid Amount:</span>
                <input
                  type="number"
                  style={styles.paymentInput}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div style={styles.paymentRow}>
                <span>📊 Payment Status:</span>
                <span style={{
                  color: paymentStatus === 'paid' ? '#10b981' :
                    paymentStatus === 'partial' ? '#f59e0b' : '#ef4444',
                  fontWeight: '600'
                }}>
                  {paymentStatus === 'paid' ? '✅ PAID' :
                    paymentStatus === 'partial' ? '⚠️ PARTIAL' : '❌ PENDING'}
                </span>
              </div>

              {due > 0 && paymentStatus !== 'pending' && (
                <div style={styles.paymentRow}>
                  <span>Due Amount:</span>
                  <span style={{ color: '#ef4444' }}>₹{due.toFixed(2)}</span>
                </div>
              )}

              <button
                style={{
                  ...styles.btn,
                  ...styles.btnSecondary,
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px'
                }}
                onClick={handleExactPayment}
              >
                Exact Amount
              </button>
            </div>

            <div style={styles.billFooter}>
              <p style={styles.billFooterP}>🙏 Thank you for your purchase!</p>
              <p style={styles.billFooterP}>🚫 Goods once sold not returnable</p>
              <p style={styles.billFooterP}>💻 Computer generated bill</p>
              {paymentMethod !== 'cash' && transactionId && (
                <p style={styles.billFooterP}>
                  {paymentMethod.toUpperCase()}: {transactionId}
                </p>
              )}
              <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dotted #e2e8f0', fontSize: '8px', color: '#94a3b8' }}>
                👤 Bill created by: {createdBy}
              </div>
            </div>
          </div>

          <div style={styles.actionButtons} className="no-print">
            <button
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...(loading || activeProducts.length === 0 ? styles.btnDisabled : {})
              }}
              onClick={() => setShowPrintModal(true)}
              disabled={loading || activeProducts.length === 0}
            >
              {loading ? '⏳ Saving...' : '🖨️ Print Bill'}
            </button>
            <button
              style={{
                ...styles.btn,
                ...styles.btnSuccess,
                ...(loading || activeProducts.length === 0 ? styles.btnDisabled : {})
              }}
              onClick={handlePaymentComplete}
              disabled={loading || activeProducts.length === 0}
            >
              {loading ? '⏳ Saving...' : '💰 Pay & Download'}
            </button>
            <button
              style={{
                ...styles.btn,
                ...styles.btnInfo,
                ...(loading ? styles.btnDisabled : {})
              }}
              onClick={handleNewBill}
              disabled={loading}
            >
              🆕 New Bill
            </button>
            <button
              style={{
                ...styles.btn,
                ...styles.btnDanger,
                ...(loading ? styles.btnDisabled : {})
              }}
              onClick={clearBill}
              disabled={loading}
            >
              🗑️ Clear All
            </button>
          </div>

          <button
            style={{
              ...styles.whatsappButton,
              ...(loading || activeProducts.length === 0 || (!customerPhone && !lastGeneratedBill?.customerPhone) ? styles.btnDisabled : {})
            }}
            onClick={handleWhatsAppShare}
            onMouseEnter={(e) => e.currentTarget.style.background = '#128C7E'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#25D366'}
            disabled={loading || activeProducts.length === 0 || (!customerPhone && !lastGeneratedBill?.customerPhone)}
          >
            <span>📱</span>
            Share Bill on WhatsApp to {customerPhone || (lastGeneratedBill?.customerPhone) || 'Customer Number'}
          </button>

          {billSaved && (
            <p style={{ fontSize: '11px', color: '#10b981', textAlign: 'center', marginTop: '10px' }}>
              ✓ Bill saved to database
            </p>
          )}
        </div>
      </div>

      {/* Print Options Modal */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            width: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#1e293b' }}>Select Bill Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  padding: '16px',
                  justifyContent: 'flex-start'
                }}
                onClick={() => {
                  setShowPrintModal(false);
                  handlePrint('cgst_sgst');
                }}
              >
                🖨️ Inter State Bill (CGST & SGST)
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnInfo,
                  padding: '16px',
                  justifyContent: 'flex-start'
                }}
                onClick={() => {
                  setShowPrintModal(false);
                  handlePrint('igst');
                }}
              >
                🖨️ Other State Bill (IGST)
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...styles.btnSecondary,
                  padding: '12px',
                  marginTop: '12px'
                }}
                onClick={() => setShowPrintModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bill;




