import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../assets/Yuva logo.jpeg';
import QRImage from '../assets/QR.jpeg';
import {
  Search,
  Eye,
  Printer,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Smartphone,
  FileText,
  FileSpreadsheet,
  FileJson,
  Filter,
  Download,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  Tag,
  Package,
  IndianRupee,
  Receipt,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Home,
  Briefcase,
  Users,
  TrendingUp,
  Wallet,
  Banknote,
  Landmark,
  MessageCircle,
  Building2,
  Store,
  Globe
} from 'lucide-react';

// Crown icon component for VIP customers
const Crown = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4l3 12h14l3-12-6 3-4-6-4 3-6-3z" />
  </svg>
);

const VisitBillPage = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [copiedBillNo, setCopiedBillNo] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({});

  // Company/Shop Details from Backend
  const [companyDetails, setCompanyDetails] = useState({
    name: "SRI YUVVA ENTERPRISE",
    address: "Shop No.1, Pillaiyar Koil Street,",
    city: "Lm. Government High School Road, Redhills, Chennai – 600052",
    phone: "9962985868",
    email: "yuvaasenterprise@gmail.com",
    gst: "",
    logo: null,
    logoUrl: null
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBillData, setPrintBillData] = useState(null);

  // Load logo as data URL for printing
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(logoImage);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading logo:', err);
      }
    };
    loadLogo();
  }, []);

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

  const getFreeQuantity = (quantity) => {
    // For reports, we assume the free quantity was 1 for every 5 if it wasn't explicitly saved
    return Math.floor((quantity || 0) / 5);
  };

  const generateBillHTML = (bill, stateTaxType = 'cgst_sgst') => {
    const activeProducts = bill.items || [];
    
    // Recalculate if totals are zero
    let subtotal = parseFloat(bill.subtotal) || 0;
    if (subtotal === 0 && activeProducts.length > 0) {
      subtotal = activeProducts.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    }
    
    let discountAmount = parseFloat(bill.discountAmount) || 0;
    let taxAmount = parseFloat(bill.tax) || 0;
    let total = parseFloat(bill.total) || 0;
    
    if (total === 0 && subtotal > 0) {
      total = subtotal - discountAmount + taxAmount;
    }

    const paidAmount = parseFloat(bill.paidAmount) || 0;
    const due = Math.max(0, total - paidAmount);
    const change = Math.max(0, paidAmount - total);
    const amountInWords = formatAmountInWords(total);
    const grossAmount = subtotal - discountAmount;
    
    const GST_RATE_PERCENT = 5;
    const GST_MULTIPLIER = 1.05;
    
    const cgstTotal = (taxAmount / 2).toFixed(2);
    const sgstTotal = (taxAmount / 2).toFixed(2);
    const igstTotal = taxAmount.toFixed(2);
    
    const isTaxBill = taxAmount > 0;
    const isExclusiveTaxBill = bill.isExclusiveTaxBill || false;
    const customerType = bill.customerType || 'external';
    const paymentMethod = bill.paymentMethod || 'cash';
    const paymentStatus = bill.paymentStatus || (paidAmount >= total ? 'paid' : 'partial');

    // Fixed company details for header (hardcoded fallbacks)
    const printCompany = {
      name: companyDetails.name || "SRI YUVVA ENTERPRISE",
      address: companyDetails.address || "Shop No.1, Pillaiyar Koil Street,",
      city: companyDetails.city || "Lm. Government High School Road, Redhills, Chennai – 600052",
      phone: companyDetails.phone || "9962985868",
      email: companyDetails.email || "yuvaasenterprise@gmail.com",
      gst: companyDetails.gst || ""
    };

    // Fix for 5.5 hour time difference (UTC to IST)
    const parseBillDate = (dateSource) => {
      if (!dateSource) return new Date();
      const d = new Date(dateSource);
      if (typeof dateSource === 'string' && !dateSource.includes('Z') && !dateSource.includes('+')) {
        // If the string is "YYYY-MM-DD HH:MM:SS" (UTC from backend), force it to UTC
        const utcDate = new Date(dateSource.replace(' ', 'T') + 'Z');
        if (!isNaN(utcDate.getTime())) return utcDate;
      }
      return d;
    };

    const billDate = parseBillDate(bill.createdAt);

    const currentDate = billDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    const currentTime = billDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    // Helper functions for line items
    const getLineTaxAmount = (item) => {
      const itemTotal = parseFloat(item.total) || 0;
      if (!isTaxBill || itemTotal <= 0) return 0;
      if (isExclusiveTaxBill) {
        return (itemTotal / GST_MULTIPLIER) * (GST_RATE_PERCENT / 100);
      }
      return itemTotal - (itemTotal / GST_MULTIPLIER);
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 8px; width: 210mm; min-height: 297mm; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.4; background: white; }
            #billPaper { width: 100%; margin: 0 auto; padding: 8px; background: white; }
            .invoice-header { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; align-items: flex-start; }
            .logo-container { display: flex; gap: 8px; align-items: flex-start; }
            .logo-image { width: 90px; height: 90px; object-fit: contain; border: 1px solid #ccc; flex-shrink: 0; }
            .seller-address { flex: 1; font-size: 11px; line-height: 1.3; }
            .seller-address h2 { font-size: 16px; margin: 0 0 4px 0; text-transform: uppercase; font-weight: 700; }
            .seller-address p { margin: 2px 0; font-size: 10px; }
            .invoice-meta-container { display: flex; flex-direction: column; gap: 6px; min-width: 200px; }
            .invoice-top-right { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
            .original-badge { padding: 3px 6px; background: #000; color: #fff; font-size: 9px; font-weight: bold; border-radius: 2px; }
            .qr-code { width: 140px; height: 140px; border: 1px solid #000; }
            .invoice-details { padding: 6px 8px; border: 1px solid #000; background: #fafafa; font-size: 10px; line-height: 1.3; }
            .invoice-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px; }
            .address-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
            .address-box, .invoice-meta-box { border: 1px solid #000; padding: 6px; background: #fff; font-size: 10px; line-height: 1.3; min-height: 90px; }
            .address-box strong { display: block; margin-bottom: 4px; font-weight: 700; font-size: 10px; }
            .address-box p { margin: 2px 0; font-size: 9px; }
            .invoice-meta-box { background: #fafafa; }
            .amount-words { margin-top: 8px; margin-bottom: 6px; font-size: 11px; font-weight: bold; border-top: 1px dashed #000; padding-top: 6px; }
            .gross-summary { display: grid; gap: 2px; padding: 6px; border: 1px solid #000; background: #fafafa; font-size: 10px; line-height: 1.3; margin-bottom: 8px; }
            .bank-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
            .bank-section { border: 1px solid #000; padding: 6px; background: #fff; font-size: 10px; line-height: 1.3; }
            .bank-section strong { display: block; font-weight: 700; margin-bottom: 3px; }
            .bank-section p { margin: 2px 0; font-size: 9px; }
            .terms-section { font-size: 9px; margin-top: 8px; padding: 6px; border: 1px dashed #000; background: #fff; line-height: 1.3; }
            .signature-row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 10px; gap: 6px; }
            .signature-box { flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 4px; color: #333; font-size: 9px; }
            .bill-info { margin: 8px 0; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
            .bill-info-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9px; }
            .bill-number { font-weight: bold; color: #0066cc; }
            .customer-section { margin: 8px 0; padding: 6px; background: #f9f9f9; border-radius: 2px; border: 1px solid #ddd; }
            .customer-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9px; }
            .customer-label { font-weight: bold; color: #333; font-size: 9px; }
            .customer-value { color: #333; text-align: right; font-size: 9px; }
            .customer-type-badge { padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
            .internal-badge { background: #e3f2fd; color: #01579b; }
            .external-badge { background: #fff3e0; color: #e65100; }
            .vehicle-section { margin: 6px 0; padding: 4px; background: #f5f5f5; border-radius: 2px; border: 1px solid #ddd; }
            .vehicle-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 9px; }
            .bill-items { margin: 8px 0; }
            .bill-items-header { display: grid; grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'}; font-weight: bold; padding: 3px 2px; border-bottom: 1px solid #000; border-top: 1px solid #000; font-size: 9px; background: #f0f0f0; gap: 4px; text-align: center; }
            .bill-item { display: grid; grid-template-columns: ${isTaxBill ? (stateTaxType === 'igst' ? '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 1.2fr' : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 0.7fr 0.7fr 1.2fr') : '0.4fr 1.8fr 0.7fr 0.4fr 0.7fr 0.8fr 1.2fr'}; padding: 2px 2px; border-bottom: 1px dotted #ddd; font-size: 8px; gap: 4px; align-items: center; text-align: center; }
            .bill-item-name { display: flex; flex-direction: column; text-align: left; }
            .bill-item-small { font-size: 7px; color: #666; margin-top: 1px; }
            .bill-summary { margin: 8px 0; padding: 6px 0; border-top: 1px solid #000; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; padding: 2px 0; }
            .summary-row-total { font-weight: bold; font-size: 11px; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; color: #333; }
            .payment-section { margin: 8px 0; padding: 6px; background: #f9f9f9; border-radius: 2px; border: 1px solid #ddd; font-size: 9px; }
            .payment-row { display: flex; justify-content: space-between; margin-bottom: 3px; align-items: center; font-size: 9px; }
            .bill-footer { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; font-size: 8px; }
            .bill-footer p { margin-bottom: 2px; color: #666; font-size: 8px; }
            .change-amount { font-weight: bold; color: ${paidAmount >= total ? '#28a745' : '#dc3545'}; font-size: 9px; }
            .created-by { margin-top: 4px; padding-top: 3px; border-top: 1px dotted #ccc; font-size: 8px; text-align: center; color: #666; }
            .discount-section { margin: 6px 0; padding: 6px; background: #fff9e6; border-radius: 2px; border: 1px solid #ffe58f; font-size: 9px; }
            .discount-amount { font-weight: 600; color: #ff7a00; }
          </style>
        </head>
        <body>
          <div id="billPaper">
            <div class="invoice-header">
              <div class="logo-container">
                <img src="${logoDataUrl}" alt="Company Logo" class="logo-image" />
                <div class="seller-address">
                  <h2>${printCompany.name}</h2>
                  <p>${printCompany.address}</p>
                  <p>${printCompany.city}</p>
                  <p>Contact number : ${printCompany.phone}</p>
                  <p>E-mail : ${printCompany.email}</p>
                  ${isTaxBill && printCompany.gst ? `<p>GST: ${printCompany.gst}</p>` : ''}
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
                <p>${printCompany.address}</p>
                <p>${printCompany.city}</p>
                <p>PINCODE:600052 · ${printCompany.phone}</p>
              </div>
              <div class="address-box">
                <strong>SHIPPING ADDRESS</strong>
                <p>${bill.customerName || 'Walk-in Customer'}</p>
                ${bill.customerAddress ? `<p>${bill.customerAddress}</p>` : ''}
                ${bill.customerPhone ? `<p>Ph: ${bill.customerPhone}</p>` : ''}
              </div>
              <div class="invoice-meta-box">
                <div class="invoice-row"><span>Invoice No :</span><span>${bill.billNumber || '---'}</span></div>
                <div class="invoice-row"><span>Date :</span><span>${currentDate}</span></div>
                <div class="invoice-row"><span>Customer ID :</span><span>${bill.customerPhone || bill.customerEmail || '-'}</span></div>
                <div class="invoice-row"><span>D.C. No :</span><span>-</span></div>
              </div>
            </div>

            <div class="bill-info">
              <div class="bill-info-row">
                <span>Bill No:</span>
                <span class="bill-number">${bill.billNumber}</span>
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
            
            ${(bill.vehicleName || bill.vehicleNumber) ? `
            <div class="vehicle-section">
              ${bill.vehicleName ? `<div class="vehicle-row"><span class="customer-label">Vehicle:</span><span>${bill.vehicleName}</span></div>` : ''}
              ${bill.vehicleNumber ? `<div class="vehicle-row"><span class="customer-label">Vehicle No:</span><span>${bill.vehicleNumber}</span></div>` : ''}
            </div>
            ` : ''}
            
            <div class="customer-section">
              <div class="customer-row">
                <span class="customer-label">Customer Type:</span>
                <span class="customer-type-badge ${customerType === 'internal' ? 'internal-badge' : 'external-badge'}">
                  ${customerType === 'internal' ? '🏢 INTERNAL' : '👤 EXTERNAL'}
                </span>
              </div>
              <div class="customer-row">
                <span class="customer-label">Name:</span>
                <span class="customer-value">${bill.customerName || 'Walk-in Customer'}</span>
              </div>
              ${bill.customerPhone ? `<div class="customer-row"><span class="customer-label">Phone:</span><span class="customer-value">${bill.customerPhone}</span></div>` : ''}
              ${bill.customerGst && isTaxBill ? `<div class="customer-row"><span class="customer-label">GST:</span><span class="customer-value">${bill.customerGst}</span></div>` : ''}
            </div>
            
            ${discountAmount > 0 ? `
            <div class="discount-section">
              <div class="discount-amount">
                Discount Amount: -₹${discountAmount.toFixed(2)}
                ${customerType === 'internal' ? ' (Staff discount)' : ''}
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
                ${isTaxBill ? (stateTaxType === 'igst' ? `<span>IGST ${GST_RATE_PERCENT}%</span>` : `<span>CGST 2.5%</span><span>SGST 2.5%</span>`) : ''}
                <span>Total</span>
              </div>
              <div>
                ${activeProducts.map((item, idx) => {
                  const rate = parseFloat(item.sellPrice || 0);
                  const qty = item.quantity || 0;
                  const freeQty = getFreeQuantity(qty);
                  const itemTotal = parseFloat(item.total || 0);
                  const itemTax = getLineTaxAmount(item);
                  const cgstAmt = (itemTax / 2).toFixed(2);
                  const sgstAmt = (itemTax / 2).toFixed(2);
                  const igstAmt = itemTax.toFixed(2);

                  return `
                    <div class="bill-item">
                      <span>${idx + 1}</span>
                      <span class="bill-item-name">
                        ${item.productName.length > 25 ? item.productName.substring(0, 22) + '...' : item.productName}
                        ${item.productFlavour ? `<small class="bill-item-small">${item.productFlavour}</small>` : ''}
                      </span>
                      <span>${item.hsn || '21050000'}</span>
                      <span>${qty}</span>
                      <span>${freeQty}</span>
                      <span>${rate.toFixed(2)}</span>
                      ${isTaxBill ? (stateTaxType === 'igst' ? `<span>${igstAmt}</span>` : `<span>${cgstAmt}</span><span>${sgstAmt}</span>`) : ''}
                      <span>${itemTotal.toFixed(2)}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <div class="bill-summary">
              <div class="summary-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
              ${discountAmount > 0 ? `<div class="summary-row"><span>Discount:</span><span>-₹${discountAmount.toFixed(2)}</span></div>` : ''}
              <div class="summary-row"><span>After Discount:</span><span>₹${(subtotal - discountAmount).toFixed(2)}</span></div>
              ${isTaxBill ? `<div class="summary-row"><span>GST (${GST_RATE_PERCENT}%):</span><span>+₹${taxAmount.toFixed(2)}</span></div>` : ''}
              <div class="summary-row summary-row-total"><span>Total:</span><span>₹${total.toFixed(2)}</span></div>
            </div>

            <div class="amount-words">Amount in words : ${amountInWords}</div>

            <div class="gross-summary">
              <div class="invoice-row"><span>Gross Amt:</span><span>₹${grossAmount.toFixed(2)}</span></div>
              ${isTaxBill ? (stateTaxType === 'igst' ? `
              <div class="invoice-row"><span>IGST ${GST_RATE_PERCENT}%:</span><span>₹${igstTotal}</span></div>
              ` : `
              <div class="invoice-row"><span>CGST 2.5%:</span><span>₹${cgstTotal}</span></div>
              <div class="invoice-row"><span>SGST 2.5%:</span><span>₹${sgstTotal}</span></div>
              `) : ''}
              <div class="invoice-row"><span>Rounded Net Amount:</span><span>₹${total.toFixed(2)}</span></div>
            </div>

            <div class="bank-details">
              <div class="bank-section">
                <strong>Bank Details :</strong>
                <p style="margin: 6px 0 0">Sri Yuvaas Enterprise</p>
                <p style="margin: 4px 0">ICICI BANK : IFSC : ICIC0001543 </p>
                <p style="margin: 4px 0">Triplicane Branch</p>
                <p style="margin: 4px 0">A/c No : 154305001002</p>
                <p style="margin: 4px 0">Phonepe : ${companyDetails.phone}</p>
              </div>
              <div class="bank-section">
                <strong>Remarks :</strong>
                <p style="margin: 6px 0 0">Goods once sold will not be taken back.</p>
                <p style="margin: 4px 0">24% interest p.a. on overdue payments.</p>
              </div>
            </div>

            <div class="terms-section">Goods once sold will not be taken back. If the payment is not made within due date, we will charge interest on the bill amount. Please pay as per bill amount only.</div>

            <div class="signature-row">
              <div class="signature-box">Prepared by</div>
              <div class="signature-box">Received by</div>
              <div class="signature-box">Authorized Signature</div>
            </div>

            <div class="payment-section">
              <div class="payment-row"><span>Payment Method:</span><span>${paymentMethod.toUpperCase()}</span></div>
              <div class="payment-row"><span>Paid Amount:</span><span>₹${paidAmount.toFixed(2)}</span></div>
              <div class="payment-row"><span>Payment Status:</span><span style="font-weight: bold;">${paymentStatus.toUpperCase()}</span></div>
              ${due > 0.01 ? `<div class="payment-row"><span>Due Amount:</span><span>₹${due.toFixed(2)}</span></div>` : ''}
              ${paymentMethod === 'cash' && paidAmount >= total ? `<div class="payment-row"><span>Change:</span><span class="change-amount">₹${change.toFixed(2)}</span></div>` : ''}
            </div>
            
            <div class="bill-footer">
              <p>Thank you for your purchase!</p>
              <p>Goods once sold not returnable</p>
              <p>** Computer generated bill **</p>
              <div class="created-by">Bill created by: ${bill.createdByName || bill.createdBy || 'Admin'}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterCustomerType, setFilterCustomerType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [sortBy, setSortBy] = useState('newest');

  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  // Create axios instance with credentials
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Payment method icons and colors
  const paymentMethodMap = {
    cash: { icon: <DollarSign size={14} />, color: '#059669', label: 'Cash' },
    card: { icon: <CreditCard size={14} />, color: '#3b82f6', label: 'Card' },
    upi: { icon: <Smartphone size={14} />, color: '#8b5cf6', label: 'UPI' },
    cheque: { icon: <FileText size={14} />, color: '#f59e0b', label: 'Cheque' },
    mixed: { icon: <Filter size={14} />, color: '#6b7280', label: 'Mixed' }
  };

  // Customer type icons and colors
  const customerTypeMap = {
    internal: { icon: <Briefcase size={14} />, color: '#3b82f6', label: 'Internal' },
    external: { icon: <Users size={14} />, color: '#f59e0b', label: 'External' },
    regular: { icon: <User size={14} />, color: '#6b7280', label: 'Regular' },
    wholesale: { icon: <TrendingUp size={14} />, color: '#8b5cf6', label: 'Wholesale' },
    vip: { icon: <Crown size={14} />, color: '#d97706', label: 'VIP' },
    corporate: { icon: <Briefcase size={14} />, color: '#2563eb', label: 'Corporate' }
  };

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Load bills on component mount
  useEffect(() => {
    if (selectedCompanyId) {
      fetchBills();
    }
  }, [selectedCompanyId]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [bills, searchTerm, filterPaymentMethod, filterCustomerType, dateRange, sortBy]);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // Fetch companies from backend
  const fetchCompanies = async () => {
    setLoadingCompany(true);
    try {
      const response = await api.get('/companies/list');
      console.log('Companies response:', response.data);

      if (response.data && response.data.length > 0) {
        setCompanies(response.data);
        // Auto-select first company
        const firstCompany = response.data[0];
        setSelectedCompanyId(firstCompany.id);
        await fetchCompanyDetails(firstCompany.id);
      } else {
        // Use default empty company details
        setCompanyDetails({
          name: "",
          address: "",
          city: "",
          phone: "",
          email: "",
          gst: "",
          logo: null,
          logoUrl: null
        });
        setSelectedCompanyId('default');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      showMessage("error", "❌ Failed to fetch company details");
      // Use default empty company details
      setCompanyDetails({
        name: "SRI YUVVA ENTERPRISE",
        address: "Shop No.1, Pillaiyar Koil Street,",
        city: "Lm. Government High School Road, Redhills, Chennai – 600052",
        phone: "9962985868",
        email: "yuvaasenterprise@gmail.com",
        gst: "",
        logo: null,
        logoUrl: null
      });
      setSelectedCompanyId('default');
    } finally {
      setLoadingCompany(false);
    }
  };

  // Fetch company details by ID
  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      console.log('Company details:', response.data);

      const company = response.data;
      setCompanyDetails({
        name: company.name || "SRI YUVAAS ENTERPRISE",
        address: company.address || "Shop No.1, Pillaiyar Koil Street,",
        city: company.city || "Lm. Government High School Road, Redhills, Chennai – 600052",
        phone: company.phone || "9962985868",
        email: company.email || "yuvaasenterprise@gmail.com",
        gst: company.gst_number || company.gst || "",
        logo: company.logo || null,
        logoUrl: company.logo_url || null
      });
    } catch (err) {
      console.error('Error fetching company details:', err);
      // Keep existing company details if fetch fails
    }
  };

  // Handle company selection
  const handleCompanySelect = async (company) => {
    setSelectedCompanyId(company.id);
    setShowCompanySelector(false);
    await fetchCompanyDetails(company.id);
    showMessage("success", `✅ Switched to ${company.name}`);
    fetchBills(); // Refresh bills for the selected company
  };

  const fetchBills = async () => {
    setLoading(true);
    setError('');

    try {
      // Try different possible endpoints
      const endpoints = [
        `${API_BASE_URL}/billing/bills`,
        `${API_BASE_URL}/bills`,
        `${API_BASE_URL}/visit-bills`,
        `${API_BASE_URL}/billing/visit-bills`
      ];

      let response = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          response = await api.get(endpoint);
          if (response.data) {
            success = true;
            console.log('Success with endpoint:', endpoint);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
        }
      }

      if (!success || !response) {
        throw new Error('Could not fetch bills from any endpoint');
      }

      console.log('API Response:', response.data);

      // Extract bills data from response
      let billsData = [];

      if (Array.isArray(response.data)) {
        billsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        billsData = response.data.data;
      } else if (response.data.bills && Array.isArray(response.data.bills)) {
        billsData = response.data.bills;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        billsData = response.data.results;
      } else if (typeof response.data === 'object') {
        // Try to find any array property
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            billsData = response.data[key];
            break;
          }
        }
      }

      if (billsData.length === 0) {
        console.log('No bills data found in response');
        setBills([]);
        setFilteredBills([]);
        showMessage("info", "ℹ️ No bills found");
        setLoading(false);
        return;
      }

      // Process bills to ensure all fields are properly mapped
      const processedBills = billsData.map(bill => {
        // Handle discount - it could be amount or percentage
        let discountValue = parseFloat(bill.discount || bill.discount_amount || 0);
        let discountType = bill.discountType || bill.discount_type || 'amount';
        let subtotal = parseFloat(bill.subtotal || bill.sub_total || 0);

        // Calculate actual discount amount
        let discountAmount = discountValue;
        if (discountType === 'percentage' && subtotal > 0) {
          discountAmount = (subtotal * discountValue) / 100;
        }

        return {
          id: bill.id || bill._id || Math.random().toString(),
          billNumber: bill.billNumber || bill.bill_number || bill.billNo || bill.invoiceNo || bill.bill_no || `BILL-${Date.now()}`,
          customerName: bill.customerName || bill.customer_name || bill.customer?.name || 'Walk-in Customer',
          customerPhone: bill.customerPhone || bill.customer_phone || bill.customer?.phone || '',
          customerEmail: bill.customerEmail || bill.customer_email || bill.customer?.email || '',
          customerGst: bill.customerGst || bill.customer_gst || bill.customer?.gst || '',
          customerAddress: bill.customerAddress || bill.customer_address || bill.customer?.address || '',
          customerType: bill.customerType || bill.customer_type || bill.customer?.type || 'external',
          subtotal: parseFloat(bill.subtotal || bill.sub_total || bill.subTotal || 0),
          discountValue: discountValue,
          discountAmount: discountAmount,
          discountType: discountType,
          // Prioritize tax amount over tax rate
          tax: parseFloat(bill.taxAmount || bill.tax_amount || bill.tax || 0),
          taxType: bill.taxType || bill.tax_type || 'percentage',
          // Prioritize total amount fields
          total: parseFloat(bill.totalAmount || bill.grandTotal || bill.grand_total || bill.total || bill.amount || 0),
          paidAmount: parseFloat(bill.paidAmount || bill.paid_amount || bill.paid || 0),
          itemCount: parseInt(bill.itemCount || bill.item_count || bill.items_count || 0),
          changeAmount: parseFloat(bill.changeAmount || bill.change_amount || bill.change || 0),
          paymentMethod: bill.paymentMethod || bill.payment_method || bill.payment?.method || 'cash',
          createdAt: bill.createdAt || bill.created_at || bill.date || new Date().toISOString(),
          updatedAt: bill.updatedAt || bill.updated_at,
          createdBy: bill.createdBy || bill.created_by,
          createdByName: bill.createdByName || bill.created_by_name || 'Admin',
          vehicleName: bill.vehicleName || bill.vehicle_name || '',
          vehicleNumber: bill.vehicleNumber || bill.vehicle_number || '',
          isExclusiveTaxBill: bill.isExclusiveTaxBill || bill.is_exclusive_tax || false,
          paymentStatus: bill.paymentStatus || bill.payment_status || (parseFloat(bill.paidAmount || bill.paid_amount || 0) >= parseFloat(bill.total || bill.grandTotal || 0) ? 'paid' : 'partial'),
          items: Array.isArray(bill.items) ? bill.items.map(item => ({
            id: item.id || item._id,
            productId: item.productId || item.product_id || item.product,
            productName: item.productName || item.product_name || item.name || 'Unknown',
            productFlavour: item.productFlavour || item.product_flavour || item.productModel || item.product_model || item.model || item.flavour || '',
            productType: item.productType || item.product_type || item.type || '',
            hsn: item.hsn || item.hns || '21050000',
            sellPrice: parseFloat(item.sellPrice || item.sell_price || item.price || 0),
            quantity: parseInt(item.quantity || item.qty || 1),
            total: parseFloat(item.total || item.subtotal || 0),
          })) : [],
          payments: Array.isArray(bill.payments) ? bill.payments.map(payment => ({
            id: payment.id || payment._id,
            paymentId: payment.paymentId || payment.payment_id,
            amount: parseFloat(payment.amount || 0),
            method: payment.method || 'cash',
            status: payment.status || 'completed',
            reference: payment.reference || '',
            notes: payment.notes || '',
            createdAt: payment.createdAt || payment.created_at
          })) : []
        };
      });

      // Calculate item count and due amount for each bill
      processedBills.forEach(bill => {
        // If itemCount is missing or 0 but we have items, sum the quantities
        if ((!bill.itemCount || bill.itemCount === 0) && bill.items && bill.items.length > 0) {
          bill.itemCount = bill.items.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty || 0)), 0);
        }
        bill.dueAmount = (bill.total || 0) - (bill.paidAmount || 0);
      });

      // Filter to show only bills with bill numbers starting with "BT"
      const btBills = processedBills.filter(bill =>
        bill.billNumber && bill.billNumber.toUpperCase().startsWith('BT')
      );

      console.log('Processed Bills (BT only):', btBills);

      setBills(btBills);
      setFilteredBills(btBills);

      showMessage("success", `✅ Loaded ${btBills.length} BT bills successfully!`);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load bills. Please try again.');
      showMessage("error", "❌ Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetails = async (billId) => {
    try {
      setLoading(true);

      // First check if we already have the bill in state
      const existingBill = bills.find(b => b.id === billId);
      if (existingBill && existingBill.items && existingBill.items.length > 0) {
        console.log('Using existing bill data');
        setSelectedBill(existingBill);
        setShowBillModal(true);
        setLoading(false);
        return;
      }

      // Try different endpoints for single bill
      const endpoints = [
        `${API_BASE_URL}/billing/bills/${billId}`,
        `${API_BASE_URL}/bills/${billId}`,
        `${API_BASE_URL}/visit-bills/${billId}`,
        `${API_BASE_URL}/billing/visit-bills/${billId}`
      ];

      let response = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          console.log('Trying details endpoint:', endpoint);
          response = await api.get(endpoint);
          if (response.data) {
            success = true;
            console.log('Success with details endpoint:', endpoint);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
        }
      }

      if (!success || !response) {
        // If API fails, use the existing bill data
        const billFromList = bills.find(b => b.id === billId);
        if (billFromList) {
          console.log('Using bill from list as fallback');
          setSelectedBill(billFromList);
          setShowBillModal(true);
          setLoading(false);
          return;
        }
        throw new Error('Could not fetch bill details');
      }

      console.log('Bill Details Response:', response.data);

      // Process the bill data
      const billData = response.data;

      // Handle discount - it could be amount or percentage
      let discountValue = parseFloat(billData.discount || billData.discount_amount || 0);
      let discountType = billData.discountType || billData.discount_type || 'amount';
      let subtotal = parseFloat(billData.subtotal || billData.sub_total || 0);

      // Calculate actual discount amount
      let discountAmount = discountValue;
      if (discountType === 'percentage' && subtotal > 0) {
        discountAmount = (subtotal * discountValue) / 100;
      }

      const processedBill = {
        id: billData.id || billData._id || billId,
        billNumber: billData.billNumber || billData.bill_number || billData.billNo || 'N/A',
        customerName: billData.customerName || billData.customer_name || billData.customer?.name || 'Walk-in Customer',
        customerPhone: billData.customerPhone || billData.customer_phone || billData.customer?.phone || '',
        customerEmail: billData.customerEmail || billData.customer_email || billData.customer?.email || '',
        customerGst: billData.customerGst || billData.customer_gst || billData.customer?.gst || '',
        customerAddress: billData.customerAddress || billData.customer_address || billData.customer?.address || '',
        customerType: billData.customerType || billData.customer_type || billData.customer?.type || 'external',
        subtotal: subtotal,
        discountValue: discountValue,
        discountAmount: discountAmount,
        discountType: discountType,
        tax: parseFloat(billData.tax || billData.taxAmount || 0),
        taxType: billData.taxType || billData.tax_type || 'percentage',
        total: parseFloat(billData.total || billData.grandTotal || billData.amount || 0),
        paidAmount: parseFloat(billData.paidAmount || billData.paid_amount || billData.paid || 0),
        changeAmount: parseFloat(billData.changeAmount || billData.change_amount || billData.change || 0),
        paymentMethod: billData.paymentMethod || billData.payment_method || billData.payment?.method || 'cash',
        paymentStatus: billData.paymentStatus || billData.payment_status || (parseFloat(billData.paidAmount || billData.paid_amount || 0) >= parseFloat(billData.total || billData.grandTotal || 0) ? 'paid' : 'partial'),
        vehicleName: billData.vehicleName || billData.vehicle_name || '',
        vehicleNumber: billData.vehicleNumber || billData.vehicle_number || '',
        isExclusiveTaxBill: billData.isExclusiveTaxBill || billData.is_exclusive_tax || false,
        createdByName: billData.createdByName || billData.created_by_name || 'Admin',
        createdAt: billData.createdAt || billData.created_at || billData.date || new Date().toISOString(),
        updatedAt: billData.updatedAt || billData.updated_at,
        createdBy: billData.createdBy || billData.created_by,
        items: Array.isArray(billData.items) ? billData.items.map(item => ({
          id: item.id || item._id,
          productId: item.productId || item.product_id || item.product,
          productName: item.productName || item.product_name || item.name || 'Unknown',
          productFlavour: item.productFlavour || item.product_flavour || item.productModel || item.product_model || item.model || item.flavour || '',
          productType: item.productType || item.product_type || item.type || '',
          hsn: item.hsn || item.hns || '21050000',
          sellPrice: parseFloat(item.sellPrice || item.sell_price || item.price || 0),
          quantity: parseInt(item.quantity || item.qty || 1),
          total: parseFloat(item.total || item.subtotal || 0),
        })) : [],
        payments: Array.isArray(billData.payments) ? billData.payments.map(payment => ({
          id: payment.id || payment._id,
          paymentId: payment.paymentId || payment.payment_id,
          amount: parseFloat(payment.amount || 0),
          method: payment.method || 'cash',
          status: payment.status || 'completed',
          reference: payment.reference || '',
          notes: payment.notes || '',
          createdAt: payment.createdAt || payment.created_at
        })) : []
      };

      // Calculate item count and due amount
      processedBill.itemCount = processedBill.items.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty || 0)), 0);
      processedBill.dueAmount = processedBill.total - processedBill.paidAmount;

      console.log('Processed Bill Details:', processedBill);

      setSelectedBill(processedBill);
      setShowBillModal(true);
    } catch (err) {
      console.error('Error fetching bill details:', err);

      // Try to use the bill from the list as fallback
      const billFromList = bills.find(b => b.id === billId);
      if (billFromList) {
        console.log('Using bill from list as fallback after error');
        setSelectedBill(billFromList);
        setShowBillModal(true);
      } else {
        showMessage("error", "❌ Failed to load bill details");
      }
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp share function with company details
  const handleWhatsAppShare = (bill) => {
    if (!bill.customerPhone) {
      showMessage("error", "❌ No phone number available for this customer");
      return;
    }

    // Show sending status
    setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'sending' }));

    // Clean phone number (remove non-digits)
    const cleanPhone = bill.customerPhone.replace(/\D/g, '');

    // Check if phone number is valid
    if (cleanPhone.length < 10) {
      showMessage("error", "❌ Please enter a valid 10-digit phone number");
      setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'error' }));
      setTimeout(() => {
        setWhatsappStatus(prev => ({ ...prev, [bill.id]: null }));
      }, 2000);
      return;
    }

    // Format phone number for WhatsApp (add country code if not present)
    const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Create message with company details
    const dueAmount = (bill.total || 0) - (bill.paidAmount || 0);
    const items = bill.items || [];

    let message = `*${companyDetails.name}*\n`;
    message += `${companyDetails.address}\n`;
    message += `${companyDetails.city}\n`;
    if (companyDetails.phone) message += `Ph: ${companyDetails.phone}\n`;
    if (companyDetails.email) message += `Email: ${companyDetails.email}\n`;
    if (companyDetails.gst) message += `GST: ${companyDetails.gst}\n`;
    message += `═══════════════════════\n`;
    message += `*BILL DETAILS*\n`;
    message += `═══════════════════════\n`;
    message += `*Bill No:* ${bill.billNumber}\n`;
    message += `*Date:* ${new Date(bill.createdAt).toLocaleDateString()}\n`;
    message += `*Time:* ${new Date(bill.createdAt).toLocaleTimeString()}\n`;
    message += `*Customer:* ${bill.customerName || 'Walk-in Customer'}\n`;
    message += `*Type:* ${(bill.customerType || 'external').toUpperCase()}\n`;

    if (bill.customerPhone) {
      message += `*Phone:* ${bill.customerPhone}\n`;
    }

    message += `═══════════════════════\n`;
    message += `*ITEMS PURCHASED:*\n`;

    items.slice(0, 5).forEach(item => {
      const productName = item.productName || item.product_name || 'Unknown';
      const qty = item.quantity || 0;
      const price = parseFloat(item.sellPrice || item.sell_price || 0);
      const total = parseFloat(item.total || 0);
      message += `• ${productName.substring(0, 20)}${productName.length > 20 ? '...' : ''}\n`;
      message += `  ${qty} x ₹${price.toFixed(2)} = ₹${total.toFixed(2)}\n`;
    });

    if (items.length > 5) {
      message += `  ...and ${items.length - 5} more items\n`;
    }

    message += `═══════════════════════\n`;
    message += `*Subtotal:* ₹${(bill.subtotal || 0).toFixed(2)}\n`;

    if (bill.discountAmount > 0) {
      if (bill.discountType === 'percentage') {
        message += `*Discount:* ${bill.discountValue}% (₹${bill.discountAmount.toFixed(2)})\n`;
      } else {
        message += `*Discount:* ₹${bill.discountAmount.toFixed(2)}\n`;
      }
    }

    if (bill.tax > 0) {
      message += `*Tax:* ₹${(bill.tax || 0).toFixed(2)}\n`;
    }

    message += `*TOTAL AMOUNT:* ₹${(bill.total || 0).toFixed(2)}\n`;
    message += `*Paid:* ₹${(bill.paidAmount || 0).toFixed(2)}\n`;

    if (dueAmount > 0) {
      message += `*Due:* ₹${dueAmount.toFixed(2)}\n`;
    }

    if (bill.changeAmount > 0) {
      message += `*Change:* ₹${bill.changeAmount.toFixed(2)}\n`;
    }

    message += `*Payment Method:* ${(bill.paymentMethod || 'cash').toUpperCase()}\n`;
    message += `═══════════════════════\n`;
    message += `Thank you for shopping with us!\n`;
    message += `Goods once sold will not be taken back\n`;
    message += `** Computer generated bill **\n`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');

    // Update status
    setWhatsappStatus(prev => ({ ...prev, [bill.id]: 'sent' }));
    showMessage("success", "✅ WhatsApp opened successfully!");

    setTimeout(() => {
      setWhatsappStatus(prev => ({ ...prev, [bill.id]: null }));
    }, 3000);
  };

  const applyFilters = () => {
    let filtered = [...bills];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill =>
        (bill.billNumber?.toLowerCase().includes(term)) ||
        (bill.customerName?.toLowerCase().includes(term)) ||
        (bill.customerPhone?.toLowerCase().includes(term)) ||
        (bill.customerEmail?.toLowerCase().includes(term)) ||
        (bill.customerGst?.toLowerCase().includes(term))
      );
    }

    // Payment method filter
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(bill =>
        bill.paymentMethod?.toLowerCase() === filterPaymentMethod.toLowerCase()
      );
    }

    // Customer type filter
    if (filterCustomerType !== 'all') {
      filtered = filtered.filter(bill =>
        bill.customerType?.toLowerCase() === filterCustomerType.toLowerCase()
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.createdAt);
        return billDate >= start && billDate <= end;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return (b.total || 0) - (a.total || 0);
        case 'lowest':
          return (a.total || 0) - (b.total || 0);
        default:
          return 0;
      }
    });

    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterPaymentMethod('all');
    setFilterCustomerType('all');
    setDateRange({ start: '', end: '' });
    setSortBy('newest');
    setFilteredBills(bills);
    setCurrentPage(1);
    showMessage("info", "🔍 Filters cleared");
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredBills.map(bill => ({
        'Bill Number': bill.billNumber || '',
        'Date': new Date(bill.createdAt).toLocaleDateString(),
        'Time': new Date(bill.createdAt).toLocaleTimeString(),
        'Customer Name': bill.customerName || 'Walk-in Customer',
        'Customer Phone': bill.customerPhone || '',
        'Customer Email': bill.customerEmail || '',
        'Customer Type': (bill.customerType || 'external').toUpperCase(),
        'Items Count': bill.itemCount || 0,
        'Subtotal (₹)': (bill.subtotal || 0).toFixed(2),
        'Discount Value': bill.discountType === 'percentage' ? `${bill.discountValue}%` : `₹${bill.discountValue.toFixed(2)}`,
        'Discount Amount (₹)': (bill.discountAmount || 0).toFixed(2),
        'Discount Type': bill.discountType || 'amount',
        'Tax (₹)': (bill.tax || 0).toFixed(2),
        'Total (₹)': (bill.total || 0).toFixed(2),
        'Paid (₹)': (bill.paidAmount || 0).toFixed(2),
        'Change (₹)': (bill.changeAmount || 0).toFixed(2),
        'Due (₹)': ((bill.total || 0) - (bill.paidAmount || 0)).toFixed(2),
        'Payment Method': (bill.paymentMethod || 'cash').toUpperCase()
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");

      const wscols = [
        { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
        { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = wscols;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });

      const date = new Date().toISOString().split('T')[0];
      saveAs(file, `Bills_${date}.xlsx`);

      showMessage("success", `✅ Exported ${filteredBills.length} bills to Excel`);
    } catch (err) {
      console.error("Export error:", err);
      showMessage("error", "❌ Failed to export to Excel");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.text('Bills Report', 14, 22);

      // Add company details to PDF header
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${companyDetails.name}`, 14, 30);
      doc.text(`${companyDetails.address}, ${companyDetails.city}`, 14, 35);
      if (companyDetails.phone) doc.text(`Ph: ${companyDetails.phone}`, 14, 40);
      if (companyDetails.gst) doc.text(`GST: ${companyDetails.gst}`, 14, 45);

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 52);

      let filterY = 59;
      if (searchTerm) {
        doc.text(`Search: "${searchTerm}"`, 14, filterY);
        filterY += 5;
      }
      if (filterPaymentMethod !== 'all') {
        doc.text(`Payment Method: ${filterPaymentMethod}`, 14, filterY);
        filterY += 5;
      }
      if (filterCustomerType !== 'all') {
        doc.text(`Customer Type: ${filterCustomerType}`, 14, filterY);
        filterY += 5;
      }
      if (dateRange.start && dateRange.end) {
        doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, filterY);
        filterY += 5;
      }

      const totalAmount = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
      const totalPaid = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.paidAmount) || 0), 0);
      const totalDue = totalAmount - totalPaid;
      const totalDiscount = filteredBills.reduce((sum, bill) => sum + (parseFloat(bill.discountAmount) || 0), 0);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Bills: ${filteredBills.length}`, 14, filterY + 5);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, filterY + 12);
      doc.text(`Total Discount: ₹${totalDiscount.toFixed(2)}`, 14, filterY + 19);
      doc.text(`Total Paid: ₹${totalPaid.toFixed(2)}`, 14, filterY + 26);
      doc.text(`Total Due: ₹${totalDue.toFixed(2)}`, 14, filterY + 33);

      const tableColumn = [
        'Bill No', 'Date', 'Customer', 'Type', 'Items', 'Subtotal', 'Discount',
        'Total (₹)', 'Paid (₹)', 'Due (₹)', 'Method'
      ];

      const tableRows = filteredBills.map(bill => {
        // Format discount display safely
        const discountAmount = parseFloat(bill.discountAmount) || 0;
        const discountValue = parseFloat(bill.discountValue) || 0;
        const total = parseFloat(bill.total) || 0;
        const paidAmount = parseFloat(bill.paidAmount) || 0;
        const subtotal = parseFloat(bill.subtotal) || 0;

        let discountDisplay = '';
        if (bill.discountType === 'percentage') {
          discountDisplay = `${discountValue}%`;
        } else {
          discountDisplay = `₹${discountAmount.toFixed(2)}`;
        }

        return [
          bill.billNumber || '',
          new Date(bill.createdAt).toLocaleDateString(),
          (bill.customerName || 'Walk-in').substring(0, 20),
          (bill.customerType || 'ext').substring(0, 3).toUpperCase(),
          bill.itemCount || 0,
          subtotal.toFixed(2),
          discountDisplay,
          total.toFixed(2),
          paidAmount.toFixed(2),
          (total - paidAmount).toFixed(2),
          (bill.paymentMethod || 'cash').substring(0, 3).toUpperCase()
        ];
      });

      const startY = filterY + 42;

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      const date = new Date().toISOString().split('T')[0];
      doc.save(`Bills_Report_${date}.pdf`);

      showMessage("success", `✅ Exported ${filteredBills.length} bills to PDF`);
    } catch (err) {
      console.error("PDF export error:", err);
      showMessage("error", "❌ Failed to export to PDF");
    }
  };

  const handlePrintBill = (bill) => {
    handleExecutePrint(bill, 'cgst_sgst');
  };

  const handleExecutePrint = (bill, stateTaxType) => {
    if (!bill) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print.');
      return;
    }

    const printHTML = generateBillHTML(bill, stateTaxType);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; width: 210mm; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.3; background: white; }
            #billPaper { width: 210mm; margin: 0 auto; padding: 12px; background: white; }
            * { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 0; }
          </style>
        </head>
        <body>
          ${printHTML.replace('</html>', '')}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyBillNumber = (billNumber) => {
    navigator.clipboard.writeText(billNumber);
    setCopiedBillNo(billNumber);
    setTimeout(() => setCopiedBillNo(null), 2000);
    showMessage("success", "📋 Bill number copied!");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPaymentIcon = (method) => {
    return paymentMethodMap[method?.toLowerCase()]?.icon || <DollarSign size={14} />;
  };

  const getPaymentColor = (method) => {
    return paymentMethodMap[method?.toLowerCase()]?.color || '#6b7280';
  };

  const getCustomerTypeIcon = (type) => {
    return customerTypeMap[type?.toLowerCase()]?.icon || <User size={14} />;
  };

  const getCustomerTypeColor = (type) => {
    return customerTypeMap[type?.toLowerCase()]?.color || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return `₹${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  const parseBillDateTime = (value) => {
    if (!value) return null;
    let normalizedValue = value;
    if (typeof normalizedValue === 'string') {
      normalizedValue = normalizedValue.includes(' ') && !normalizedValue.includes('T')
        ? normalizedValue.replace(' ', 'T')
        : normalizedValue;

      // Backend stores UTC timestamps without timezone info, so mark naive ISO values as UTC.
      if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalizedValue)) {
        normalizedValue = `${normalizedValue}Z`;
      }
    }
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatBillDate = (value) => {
    const date = parseBillDateTime(value);
    return date ? date.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '-';
  };

  const formatBillTime = (value) => {
    const date = parseBillDateTime(value);
    return date ? date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) : '-';
  };

  // Dark Theme Styles
  const styles = {
    container: {
      padding: "30px 40px",
      backgroundColor: "#0a0c10",
      minHeight: "100vh",
      color: "#e5e7eb",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    shopHeader: {
      backgroundColor: "#1f2937",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid #374151",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "15px",
    },
    shopInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      flex: 1,
    },
    shopLogo: {
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      objectFit: "cover",
      marginRight: "15px",
    },
    shopName: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#6366f1",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    shopAddress: {
      fontSize: "14px",
      color: "#d1d5db",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    shopContact: {
      fontSize: "14px",
      color: "#d1d5db",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    companySelector: {
      backgroundColor: "#111827",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      border: "1px solid #374151",
      transition: "all 0.2s",
    },
    companyDropdown: {
      position: "absolute",
      top: "100%",
      right: 0,
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      borderRadius: "6px",
      marginTop: "5px",
      zIndex: 100,
      minWidth: "200px",
      maxHeight: "300px",
      overflowY: "auto",
    },
    companyOption: {
      padding: "10px 15px",
      cursor: "pointer",
      transition: "background 0.2s",
      color: "#e5e7eb",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
      flexWrap: "wrap",
      gap: "15px",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      margin: 0,
      color: "#f9fafb",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    refreshButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    button: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      borderRadius: "6px",
      backgroundColor: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #374151",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s",
    },
    primaryButton: {
      backgroundColor: "#6366f1",
      color: "#fff",
      border: "none",
    },
    successButton: {
      backgroundColor: "#059669",
      color: "#fff",
      border: "none",
    },
    infoButton: {
      backgroundColor: "#3b82f6",
      color: "#fff",
      border: "none",
    },
    filterBar: {
      backgroundColor: "#1f2937",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid #374151",
      marginBottom: "20px",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto",
      gap: "12px",
      alignItems: "center",
    },
    searchBox: {
      position: "relative",
      width: "100%",
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#6b7280",
    },
    searchInput: {
      width: "100%",
      padding: "10px 12px 10px 38px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    filterSelect: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      cursor: "pointer",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    dateInput: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
    },
    filterButton: {
      padding: "10px 16px",
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      color: "#f9fafb",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "13px",
      fontWeight: "500",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
      height: "41px",
    },
    tableContainer: {
      backgroundColor: "#1f2937",
      borderRadius: "8px",
      border: "1px solid #374151",
      overflow: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "1400px",
    },
    th: {
      backgroundColor: "#374151",
      padding: "14px 12px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#f3f4f6",
      borderBottom: "1px solid #4b5563",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    td: {
      padding: "14px 12px",
      borderBottom: "1px solid #374151",
      fontSize: "13px",
      color: "#f9fafb",
    },
    paymentBadge: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    customerTypeBadge: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "600",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    },
    actionsRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      flexWrap: "nowrap",
    },
    actionButton: {
      padding: "6px 10px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    whatsappButton: {
      padding: "6px 10px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#25D366",
      color: "white",
    },
    message: {
      padding: "12px 20px",
      borderRadius: "6px",
      marginBottom: "20px",
      fontSize: "14px",
      fontWeight: "500",
      whiteSpace: "pre-line",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    successMessage: {
      backgroundColor: "rgba(5, 150, 105, 0.2)",
      color: "#34d399",
      border: "1px solid #059669",
    },
    errorMessage: {
      backgroundColor: "rgba(220, 38, 38, 0.2)",
      color: "#f87171",
      border: "1px solid #dc2626",
    },
    infoMessage: {
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      color: "#60a5fa",
      border: "1px solid #3b82f6",
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "60px",
      color: "#9ca3af",
      fontSize: "16px",
    },
    noData: {
      textAlign: "center",
      padding: "60px",
      color: "#6b7280",
      fontStyle: "italic",
    },
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
      padding: "10px 0",
    },
    paginationInfo: {
      color: "#9ca3af",
      fontSize: "13px",
    },
    paginationControls: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    },
    pageButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 12px",
      backgroundColor: "#1f2937",
      border: "1px solid #374151",
      color: "#f9fafb",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "all 0.2s",
      minWidth: "38px",
    },
    activePageButton: {
      backgroundColor: "#6366f1",
      borderColor: "#6366f1",
    },
    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    pageNumbers: {
      display: "flex",
      gap: "4px",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    },
    modalContent: {
      backgroundColor: "#1f2937",
      padding: "30px",
      borderRadius: "12px",
      maxWidth: "700px",
      width: "95%",
      maxHeight: "85vh",
      overflow: "auto",
      position: "relative",
      border: "1px solid #374151",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
    },
    modalClose: {
      position: "absolute",
      top: "15px",
      right: "15px",
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#f9fafb",
      marginBottom: "20px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    modalSection: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#111827",
      borderRadius: "8px",
      border: "1px solid #374151",
    },
    modalText: {
      color: "#d1d5db",
      fontSize: "14px",
      lineHeight: "1.6",
      marginBottom: "6px",
    },
    modalTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
    },
    modalTh: {
      backgroundColor: "#374151",
      padding: "10px",
      textAlign: "left",
      color: "#f3f4f6",
      fontWeight: "500",
      fontSize: "12px",
    },
    modalTd: {
      padding: "8px",
      borderBottom: "1px solid #374151",
      color: "#f9fafb",
      fontSize: "13px",
    },
    modalFooter: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
    },
    itemsPerPageSelect: {
      padding: "8px",
      backgroundColor: "#111827",
      border: "1px solid #374151",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "13px",
      marginLeft: "10px",
    },
    copyButton: {
      background: "none",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      padding: "4px",
      marginLeft: "5px",
    },
  };

  if (loading && bills.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <RefreshCw size={30} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Loading BT bills...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>


      {/* Message Display */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === "success" ? styles.successMessage :
            message.type === "error" ? styles.errorMessage :
              styles.infoMessage)
        }}>
          {message.type === "success" && <CheckCircle size={18} />}
          {message.type === "error" && <AlertCircle size={18} />}
          {message.type === "info" && <Filter size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <h1 style={styles.title}>
            <Receipt size={32} color="#6366f1" />
            Visit Bills (BT Series)
          </h1>
          <button
            style={styles.refreshButton}
            onClick={fetchBills}
            title="Refresh"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f9fafb';
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RefreshCw size={18} />
          </button>
          <select
            style={styles.itemsPerPageSelect}
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.button, ...styles.infoButton }}
            onClick={handleExportExcel}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            style={{ ...styles.button, ...styles.successButton }}
            onClick={handleExportPDF}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <FileJson size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search bill no, customer name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          style={styles.filterSelect}
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="cheque">Cheque</option>
          <option value="mixed">Mixed</option>
        </select>

        <select
          style={styles.filterSelect}
          value={filterCustomerType}
          onChange={(e) => setFilterCustomerType(e.target.value)}
        >
          <option value="all">All Customers</option>
          <option value="internal">Internal (Staff)</option>
          <option value="external">External</option>
          <option value="regular">Regular</option>
          <option value="wholesale">Wholesale</option>
          <option value="vip">VIP</option>
          <option value="corporate">Corporate</option>
        </select>

        <input
          type="date"
          style={styles.dateInput}
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          placeholder="From Date"
        />

        <input
          type="date"
          style={styles.dateInput}
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          placeholder="To Date"
        />

        <select
          style={styles.filterSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>

        <button
          style={styles.filterButton}
          onClick={resetFilters}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3748';
            e.currentTarget.style.borderColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <X size={16} /> Clear
        </button>
      </div>

      {/* Bills Table */}
      <div style={styles.tableContainer}>
        {error && <div style={{ padding: '30px', color: '#f87171', textAlign: 'center' }}>{error}</div>}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Bill No.</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Subtotal</th>
              <th style={styles.th}>Discount</th>
              <th style={styles.th}>Tax</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Paid</th>
              <th style={styles.th}>Due</th>
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBills.length === 0 ? (
              <tr>
                <td colSpan="14" style={styles.noData}>
                  {searchTerm || filterPaymentMethod !== 'all' || filterCustomerType !== 'all' || dateRange.start
                    ? <div>
                      <Filter size={30} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <div>No BT bills match your filters</div>
                      <button
                        onClick={resetFilters}
                        style={{ ...styles.button, marginTop: '15px', display: 'inline-flex' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }}
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    </div>
                    : <div>
                      <Receipt size={30} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <div>No BT bills found</div>
                    </div>}
                </td>
              </tr>
            ) : (
              currentBills.map((bill) => {
                const dueAmount = (bill.total || 0) - (bill.paidAmount || 0);

                // Format discount display
                let discountDisplay = '';
                if (bill.discountType === 'percentage') {
                  discountDisplay = `${bill.discountValue}%`;
                } else {
                  discountDisplay = formatCurrency(bill.discountAmount);
                }

                return (
                  <tr key={bill.id}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong>{bill.billNumber}</strong>
                        <button
                          style={styles.copyButton}
                          onClick={() => handleCopyBillNumber(bill.billNumber)}
                          title="Copy bill number"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          {copiedBillNo === bill.billNumber ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>{formatBillDate(bill.createdAt)}</div>
                      <small style={{ color: '#9ca3af', fontSize: '11px' }}>
                        {formatBillTime(bill.createdAt)}
                      </small>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} color="#9ca3af" />
                        <span>{bill.customerName || 'Walk-in'}</span>
                      </div>
                      {bill.customerEmail && (
                        <small style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                          <Mail size={10} /> {bill.customerEmail}
                        </small>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.customerTypeBadge,
                        backgroundColor: `${getCustomerTypeColor(bill.customerType)}20`,
                        color: getCustomerTypeColor(bill.customerType),
                        border: `1px solid ${getCustomerTypeColor(bill.customerType)}40`
                      }}>
                        {getCustomerTypeIcon(bill.customerType)}
                        <span style={{ textTransform: 'capitalize' }}>{bill.customerType || 'external'}</span>
                      </span>
                    </td>
                    <td style={styles.td}>
                      {bill.customerPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} color="#9ca3af" />
                          <span>{bill.customerPhone}</span>
                        </div>
                      )}
                      {bill.customerGst && (
                        <small style={{ color: '#9ca3af', fontSize: '10px' }}>
                          GST: {bill.customerGst}
                        </small>
                      )}
                    </td>
                    <td style={styles.td}>{bill.itemCount || 0}</td>
                    <td style={styles.td}>{formatCurrency(bill.subtotal)}</td>
                    <td style={styles.td}>
                      <span title={`${bill.discountType === 'percentage' ? 'Percentage' : 'Fixed'} discount`}>
                        {discountDisplay}
                        {bill.discountType === 'percentage' && (
                          <small style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '10px' }}>
                            (₹{bill.discountAmount.toFixed(2)})
                          </small>
                        )}
                      </span>
                    </td>
                    <td style={styles.td}>{formatCurrency(bill.tax)}</td>
                    <td style={styles.td}><strong>{formatCurrency(bill.total)}</strong></td>
                    <td style={styles.td}>{formatCurrency(bill.paidAmount)}</td>
                    <td style={styles.td}>
                      <span style={{
                        color: dueAmount > 0 ? '#f87171' : '#34d399',
                        fontWeight: '600'
                      }}>
                        {formatCurrency(dueAmount)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{
                        ...styles.paymentBadge,
                        color: getPaymentColor(bill.paymentMethod),
                        border: `1px solid ${getPaymentColor(bill.paymentMethod)}30`
                      }}>
                        {getPaymentIcon(bill.paymentMethod)}
                        <span style={{ textTransform: 'capitalize' }}>{bill.paymentMethod}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                      <button
                        style={{ ...styles.actionButton, backgroundColor: '#3b82f6', color: 'white', marginRight: '4px' }}
                        onClick={() => fetchBillDetails(bill.id)}
                        title="View Details"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        style={{ ...styles.actionButton, backgroundColor: '#059669', color: 'white', marginRight: '4px' }}
                        onClick={() => handlePrintBill(bill)}
                        title="Print Bill"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#047857';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        style={{
                          ...styles.whatsappButton,
                          opacity: whatsappStatus[bill.id] === 'sending' ? 0.7 : 1,
                          cursor: whatsappStatus[bill.id] === 'sending' ? 'wait' : 'pointer',
                          backgroundColor: whatsappStatus[bill.id] === 'sent' ? '#059669' : '#25D366'
                        }}
                        onClick={() => handleWhatsAppShare(bill)}
                        title="Share on WhatsApp"
                        disabled={whatsappStatus[bill.id] === 'sending'}
                        onMouseEnter={(e) => {
                          if (!whatsappStatus[bill.id]) {
                            e.currentTarget.style.backgroundColor = '#128C7E';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!whatsappStatus[bill.id]) {
                            e.currentTarget.style.backgroundColor = '#25D366';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {whatsappStatus[bill.id] === 'sending' ? (
                          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : whatsappStatus[bill.id] === 'sent' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <MessageCircle size={14} />
                        )}
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
      {filteredBills.length > 0 && (
        <div style={styles.pagination}>
          <div style={styles.paginationInfo}>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBills.length)} of {filteredBills.length} BT bills
          </div>

          <div style={styles.paginationControls}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              style={{
                ...styles.pageButton,
                ...(currentPage === 1 ? styles.disabledButton : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#2d3748';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.borderColor = '#374151';
                }
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={styles.pageNumbers}>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      style={{
                        ...styles.pageButton,
                        ...(currentPage === pageNumber ? styles.activePageButton : {})
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNumber) {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNumber) {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 3 ||
                  pageNumber === currentPage + 3
                ) {
                  return <span key={pageNumber} style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              style={{
                ...styles.pageButton,
                ...(currentPage === totalPages ? styles.disabledButton : {})
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#2d3748';
                  e.currentTarget.style.borderColor = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.borderColor = '#374151';
                }
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bill Details Modal */}
      {showBillModal && selectedBill && (
        <div style={styles.modal} onClick={() => setShowBillModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.modalClose}
              onClick={() => setShowBillModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f9fafb';
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
            </button>

            <h2 style={styles.modalTitle}>
              <Receipt size={24} color="#6366f1" />
              Bill Details - {selectedBill.billNumber}
            </h2>

            <div style={styles.modalSection}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <p style={styles.modalText}>
                    <strong>Bill Number:</strong> {selectedBill.billNumber}
                  </p>
                  <p style={styles.modalText}>
                    <strong>Date:</strong> {formatBillDate(selectedBill.createdAt)}
                  </p>
                  <p style={styles.modalText}>
                    <strong>Time:</strong> {formatBillTime(selectedBill.createdAt)}
                  </p>
                  <p style={styles.modalText}>
                    <strong>Customer Type:</strong>{' '}
                    <span style={{
                      color: getCustomerTypeColor(selectedBill.customerType),
                      fontWeight: '600'
                    }}>
                      {(selectedBill.customerType || 'external').toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={styles.modalText}>
                    <strong>Customer:</strong> {selectedBill.customerName || 'Walk-in Customer'}
                  </p>
                  {selectedBill.customerPhone && (
                    <p style={styles.modalText}>
                      <strong>Phone:</strong> {selectedBill.customerPhone}
                    </p>
                  )}
                  {selectedBill.customerEmail && (
                    <p style={styles.modalText}>
                      <strong>Email:</strong> {selectedBill.customerEmail}
                    </p>
                  )}
                </div>
              </div>

              {selectedBill.customerAddress && (
                <p style={styles.modalText}>
                  <strong>Address:</strong> {selectedBill.customerAddress}
                </p>
              )}
              {selectedBill.customerGst && (
                <p style={styles.modalText}>
                  <strong>GST:</strong> {selectedBill.customerGst}
                </p>
              )}
            </div>

            <h3 style={{ color: '#f9fafb', marginBottom: '10px', fontSize: '16px' }}>
              Items ({selectedBill.items?.reduce((sum, item) => sum + (parseInt(item.quantity || item.qty || 0)), 0) || 0})
            </h3>

            <table style={styles.modalTable}>
              <thead>
                <tr>
                  <th style={styles.modalTh}>Item</th>
                  <th style={styles.modalTh}>Flavour</th>
                  <th style={styles.modalTh}>Price</th>
                  <th style={styles.modalTh}>Qty</th>
                  <th style={styles.modalTh}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items && selectedBill.items.length > 0 ? (
                  selectedBill.items.map((item, index) => {
                    const productName = item.productName || item.product_name || 'Unknown';
                    // Use robust normalization for Flavour
                    const productModel = item.productFlavour || item.product_flavour || item.productModel || item.product_model || item.model || item.Model || item.flavour || '';
                    const sellPrice = parseFloat(item.sellPrice || item.sell_price || 0);
                    const quantity = item.quantity || 0;
                    const total = parseFloat(item.total || 0);

                    return (
                      <tr key={index}>
                        <td style={styles.modalTd}>
                          <strong>{productName}</strong>
                        </td>
                        <td style={styles.modalTd}>
                          {productModel || '-'}
                        </td>
                        <td style={styles.modalTd}>₹{sellPrice.toFixed(2)}</td>
                        <td style={styles.modalTd}>{quantity}</td>
                        <td style={styles.modalTd}>₹{total.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ ...styles.modalTd, textAlign: 'center', color: '#9ca3af' }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Payment History if available */}
            {selectedBill.payments && selectedBill.payments.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#f9fafb', marginBottom: '10px', fontSize: '14px' }}>Payment History</h4>
                <div style={{ backgroundColor: '#111827', borderRadius: '6px', padding: '10px' }}>
                  {selectedBill.payments.map((payment, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      borderBottom: index < selectedBill.payments.length - 1 ? '1px solid #374151' : 'none'
                    }}>
                      <span style={{ color: '#d1d5db', fontSize: '12px' }}>
                        {formatBillTime(payment.createdAt)} - {payment.method?.toUpperCase()}
                      </span>
                      <span style={{ color: '#f9fafb', fontWeight: '500' }}>
                        ₹{payment.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.actionButton, backgroundColor: '#059669', color: 'white', padding: '12px 20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}
                onClick={() => {
                  setShowBillModal(false);
                  handlePrintBill(selectedBill);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Printer size={16} /> Print Bill
              </button>
              <button
                style={{ ...styles.actionButton, backgroundColor: '#25D366', color: 'white', padding: '12px 20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}
                onClick={() => {
                  setShowBillModal(false);
                  handleWhatsAppShare(selectedBill);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#128C7E';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#25D366';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                disabled={!selectedBill.customerPhone}
                title={!selectedBill.customerPhone ? "No phone number available" : "Share on WhatsApp"}
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button
                style={{ ...styles.actionButton, backgroundColor: '#374151', color: 'white', padding: '12px 20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '6px', fontSize: '14px', fontWeight: '500' }}
                onClick={() => setShowBillModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VisitBillPage;

