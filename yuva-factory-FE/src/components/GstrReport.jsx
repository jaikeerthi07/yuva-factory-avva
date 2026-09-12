// import { useState, useCallback } from "react";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ─── Tab definitions ───────────────────────────────────────────────────────────
const TABS = ["b2b,sez,de", "b2cl", "b2cs", "cdnr", "cdnur", "exp", "at", "atadj", "exemp", "hsn", "hsn(b2b)", "hsn(b2c)", "docs"];

const TAB_COLUMNS = {
  "b2b,sez,de": ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice Date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"],
  "b2cl": ["Invoice Number", "Invoice Date", "Invoice Value", "Place Of Supply", "Rate", "Applicable % of Tax Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN", "Sale from Bonded WH"],
  "b2cs": ["Type", "Place Of Supply", "Rate", "Applicable % of Tax Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
  "cdnr": ["GSTIN/UIN of Recipient", "Receiver Name", "Note Number", "Note Date", "Note Type", "Place Of Supply", "Reverse Charge", "Note Supply Type", "Note Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"],
  "cdnur": ["UR Type", "Note Number", "Note Date", "Note Type", "Place Of Supply", "Note Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"],
  "exp": ["Export Type", "Invoice Number", "Invoice Date", "Invoice Value", "Port Code", "Shipping Bill Number", "Shipping Bill Date", "Rate", "Applicable % of Tax Rate", "Taxable Value", "Cess Amount"],
  "at": ["Place Of Supply", "Rate", "Applicable % of Tax Rate", "Gross Advance Received", "Cess Amount"],
  "atadj": ["Place Of Supply", "Rate", "Applicable % of Tax Rate", "Gross Advance Adjusted", "Cess Amount"],
  "exemp": ["Description", "Nil Rated Supplies", "Exempted (other than Nil Rated / Non-GST Supply)", "Non-GST Supplies"],
  "hsn": ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount", "Rate"],
  "hsn(b2b)": ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount", "Rate"],
  "hsn(b2c)": ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount", "Rate"],
  "docs": ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],

};

const DEFAULT_DATA = {
  "b2b,sez,de": [],
  "b2cl": [],
  "b2cs": [],
  "cdnr": [],
  "cdnur": [],
  "exp": [],
  "at": [],
  "atadj": [],
  "exemp": [],
  "hsn": [],
  "hsn(b2b)": [],
  "hsn(b2c)": [],
  "docs": [],
  "⊞": [],
};
// ─── Seed data ─────────────────────────────────────────────────────────────────
// const B2B_RAW = [
//   {g:"33AAACN2084L1ZH",n:"Narangs International Hotels Pvt Ltd",inv:"D01012374",dt:"01-Apr-2026",val:1541,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1468.0,cs:0.0},
//   {g:"33AAPFN9270N1ZI",n:"Nikita Foods",inv:"D01012382",dt:"01-Apr-2026",val:2069,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1970.0,cs:0.0},
//   {g:"33AROPR5107L1ZF",n:"Niya Naturals",inv:"D01012386",dt:"01-Apr-2026",val:1250,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1190.0,cs:0.0},
//   {g:"33AANFB3064E1ZR",n:"Bhatinda Xpress",inv:"D01012388",dt:"01-Apr-2026",val:5040,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:4800.0,cs:0.0},
//   {g:"33AAKFE8123E1ZP",n:"Edesia Foods",inv:"D01012393",dt:"01-Apr-2026",val:3465,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:3300.0,cs:0.0},
//   {g:"33GFNPS7942H1ZS",n:"The Patiala House",inv:"D01012398",dt:"02-Apr-2026",val:5103,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:4860.0,cs:0.0},
//   {g:"33BBKPV3272K1Z7",n:"VISHNU TRADING COMPANY",inv:"D01012407",dt:"02-Apr-2026",val:7009,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:6675.0,cs:0.0},
//   {g:"34DFRPR2546F1Z4",n:"SOFTSERVE NATION",inv:"D01012411",dt:"02-Apr-2026",val:20286,pl:"34-Pondicherry",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:19320.0,cs:0.0},
//   {g:"33AILPA9680R1ZJ",n:"ADBRIS",inv:"D01012418",dt:"03-Apr-2026",val:2100,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2000.0,cs:0.0},
//   {g:"33BNOPM0752R3ZC",n:"MSR ENTERPRISE",inv:"D01012419",dt:"03-Apr-2026",val:2934,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2794.0,cs:0.0},
//   {g:"33ACAFA1820A1ZH",n:"Abhi Hospitalities Pind chrompet",inv:"D01012424",dt:"04-Apr-2026",val:8222,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:7830.0,cs:0.0},
//   {g:"33ESTPA3358E1ZR",n:"VETRI FOODS",inv:"D01012426",dt:"04-Apr-2026",val:14980,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:14267.0,cs:0.0},
//   {g:"33BNOPM0752R3ZC",n:"MSR ENTERPRISE",inv:"D01012432",dt:"04-Apr-2026",val:3061,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2915.0,cs:0.0},
//   {g:"33AFJPN5473L1Z0",n:"SHREE VAARI Foods",inv:"D01012433",dt:"04-Apr-2026",val:6841,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:6515.0,cs:0.0},
//   {g:"34DFRPR2546F1Z4",n:"SOFTSERVE NATION",inv:"D01012459",dt:"05-Apr-2026",val:22932,pl:"34-Pondicherry",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:21840.0,cs:0.0},
//   {g:"33CHUPR5059P1Z9",n:"DELIFC THORAI PAKKAM",inv:"D01012478",dt:"07-Apr-2026",val:3480,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:0,tx:3480.0,cs:0.0},
//   {g:"33AAACN2084L1ZH",n:"Narangs International Hotels Pvt Ltd",inv:"D01012479",dt:"07-Apr-2026",val:2400,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2286.0,cs:0.0},
//   {g:"33AAECK2870K1ZG",n:"Kalyan Grand stay Pvt Ltd",inv:"D01012480",dt:"07-Apr-2026",val:9555,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:9100.0,cs:0.0},
//   {g:"33AAGCP1774P2ZX",n:"PRC INTERNATIONAL HOTELS PRIVATE LIMITED",inv:"D01012482",dt:"07-Apr-2026",val:1660,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1581.25,cs:0.0},
//   {g:"33BNOPM0752R3ZC",n:"MSR ENTERPRISE",inv:"D01012483",dt:"07-Apr-2026",val:2506,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2387.0,cs:0.0},
//   {g:"33COKPS0285K1ZJ",n:"Muthalamman Traders",inv:"D01012486",dt:"07-Apr-2026",val:8050,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:7667.0,cs:0.0},
//   {g:"33AODPL6435K1ZV",n:"Shri Keerthi Foods",inv:"D01012493",dt:"07-Apr-2026",val:13259,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:12628.0,cs:0.0},
//   {g:"33AROPR5107L1ZF",n:"Niya Naturals",inv:"D01012494",dt:"07-Apr-2026",val:1481,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1410.0,cs:0.0},
//   {g:"33AODPL6435K1ZV",n:"Shri Keerthi Foods",inv:"D01012496",dt:"07-Apr-2026",val:4426,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:4215.0,cs:0.0},
//   {g:"34DFRPR2546F1Z4",n:"SOFTSERVE NATION",inv:"D01012498",dt:"07-Apr-2026",val:14112,pl:"34-Pondicherry",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:13440.0,cs:0.0},
//   {g:"33AAKFE8123E1ZP",n:"Edesia Foods",inv:"D01012500",dt:"08-Apr-2026",val:2835,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2700.0,cs:0.0},
//   {g:"33ADRFS3252J1ZR",n:"Sunprise Enterprise",inv:"D01012501",dt:"08-Apr-2026",val:1890,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1800.0,cs:0.0},
//   {g:"33ABRFA2281P1ZY",n:"Amman Foods",inv:"D01012503",dt:"08-Apr-2026",val:3108,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:2960.0,cs:0.0},
//   {g:"33AAXFB1925C1ZN",n:"Dr Bubbles",inv:"D01012507",dt:"08-Apr-2026",val:1449,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1380.0,cs:0.0},
//   {g:"33AAGCP1774P2ZX",n:"PRC INTERNATIONAL HOTELS PRIVATE LIMITED",inv:"D01012511",dt:"08-Apr-2026",val:1527,pl:"33-Tamil Nadu",rc:"N",app:"",it:"Regular B2B",ec:"",r:5,tx:1454.75,cs:0.0},
// ].map(d => ({
//   "GSTIN/UIN of Recipient": d.g, "Receiver Name": d.n, "Invoice Number": d.inv,
//   "Invoice Date": d.dt, "Invoice Value": String(d.val), "Place Of Supply": d.pl,
//   "Reverse Charge": d.rc, "Applicable % of Tax Rate": d.app, "Invoice Type": d.it,
//   "E-Commerce GSTIN": d.ec, "Rate": String(d.r), "Taxable Value": String(d.tx), "Cess Amount": String(d.cs)
// }));

// const SEED_DATA = {
//   "b2b,sez,de": B2B_RAW,
//   "b2cl": [], "b2cs": [], "cdnr": [], "cdnur": [], "exp": [], "at": [], "atadj": [],
//   "exemp": [
//     {"Description":"Inter-State Supplies to Registered persons","Nil Rated Supplies":"0","Exempted (other than Nil Rated / Non-GST Supply)":"","Non-GST Supplies":"0"},
//     {"Description":"Intra-State Supplies to Registered persons","Nil Rated Supplies":"0","Exempted (other than Nil Rated / Non-GST Supply)":"","Non-GST Supplies":"0"},
//     {"Description":"Inter-State Supplies to UnRegistered persons","Nil Rated Supplies":"0","Exempted (other than Nil Rated / Non-GST Supply)":"","Non-GST Supplies":"0"},
//     {"Description":"Intra-State Supplies to UnRegistered persons","Nil Rated Supplies":"0","Exempted (other than Nil Rated / Non-GST Supply)":"","Non-GST Supplies":"0"},
//   ],
//   "hsn": [
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"9394","Total Value":"1562380","Taxable Value":"1562380","Integrated Tax Amount":"0","Central Tax Amount":"0","State/UT Tax Amount":"0","Cess Amount":"0","Rate":"0"},
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"4816","Total Value":"973662.11","Taxable Value":"927297.25","Integrated Tax Amount":"10610","Central Tax Amount":"17877.43","State/UT Tax Amount":"17877.43","Cess Amount":"0","Rate":"5"},
//   ],
//   "hsn(b2b)": [
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"12","Total Value":"3480","Taxable Value":"3480","Integrated Tax Amount":"0","Central Tax Amount":"0","State/UT Tax Amount":"0","Cess Amount":"0","Rate":"0"},
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"3985","Total Value":"774742.76","Taxable Value":"737850.25","Integrated Tax Amount":"10610","Central Tax Amount":"13141.26","State/UT Tax Amount":"13141.26","Cess Amount":"0","Rate":"5"},
//   ],
//   "hsn(b2c)": [
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"9382","Total Value":"1558900","Taxable Value":"1558900","Integrated Tax Amount":"0","Central Tax Amount":"0","State/UT Tax Amount":"0","Cess Amount":"0","Rate":"0"},
//     {"HSN":"21050000","Description":"All Items","UQC":"NOS-NUMBERS","Total Quantity":"831","Total Value":"198919.35","Taxable Value":"189447","Integrated Tax Amount":"0","Central Tax Amount":"4736.17","State/UT Tax Amount":"4736.17","Cess Amount":"0","Rate":"5"},
//   ],
//   "docs": [
//     {"Nature of Document":"Invoices for outward supply","Sr. No. From":"C01000058","Sr. No. To":"C01000058","Total Number":"1","Cancelled":"0"},
//     {"Nature of Document":"Invoices for outward supply","Sr. No. From":"D01012372","Sr. No. To":"D01012939","Total Number":"568","Cancelled":"16"},
//   ],
//   "⊞": [],
// };

// ─── Download helpers ──────────────────────────────────────────────────────────
const DOWNLOAD_TABS = ["b2b,sez,de", "b2cl", "b2cs", "cdnr", "cdnur", "exp", "at", "atadj", "exemp", "hsn", "hsn(b2b)", "hsn(b2c)", "docs"];
const TAB_FILENAME = { "b2b,sez,de": "B2B_SEZ_DE", "b2cl": "B2CL", "b2cs": "B2CS", "cdnr": "CDNR", "cdnur": "CDNUR", "exp": "EXP", "at": "AT", "atadj": "ATADJ", "exemp": "EXEMP", "hsn": "HSN", "hsn(b2b)": "HSN_B2B", "hsn(b2c)": "HSN_B2C", "docs": "DOCS" };

function rowsToCSV(cols, rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = cols.map(esc).join(",");
  const body = rows.map(r => cols.map(c => esc(r[c] ?? "")).join(",")).join("\n");
  return "\uFEFF" + header + "\n" + body;
}

function rowsToJSON(rows) {
  return JSON.stringify(rows, null, 2);
}

// Simple XLSX-compatible XML (single-sheet workbook)
function rowsToXLSXXML(cols, rows) {
  const escX = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table>`;
  const mkRow = cells => `<Row>${cells.map(c => `<Cell><Data ss:Type="String">${escX(c)}</Data></Cell>`).join("")}</Row>`;
  xml += mkRow(cols);
  rows.forEach(r => { xml += mkRow(cols.map(c => r[c] ?? "")); });
  xml += `</Table></Worksheet></Workbook>`;
  return xml;
}

// ── Correct ZIP builder (STORE, no compression) ──────────────────────────────
function buildZip(files) {
  const enc = new TextEncoder();
  const toU8 = s => typeof s === "string" ? enc.encode(s) : s;

  // CRC-32 table
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xFFFFFFFF >>> 0;
    for (let i = 0; i < buf.length; i++) c = (CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)) >>> 0;
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // Write helpers into a DataView
  function w16(dv, off, v) { dv.setUint16(off, v, true); }
  function w32(dv, off, v) { dv.setUint32(off, v, true); }

  const LOCAL_HDR = 30; // fixed local file header size (excl. filename + extra)
  const CENTRAL_HDR = 46; // fixed central dir entry size (excl. filename)

  const entries = files.map(f => {
    const data = toU8(f.data);
    const name = toU8(f.name);
    return { data, name, crc: crc32(data), size: data.length };
  });

  // Calculate total size
  let localSize = 0;
  entries.forEach(e => { localSize += LOCAL_HDR + e.name.length + e.size; });
  const cdSize = entries.reduce((a, e) => a + CENTRAL_HDR + e.name.length, 0);
  const eocdSize = 22;
  const buf = new ArrayBuffer(localSize + cdSize + eocdSize);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);

  let pos = 0;
  const offsets = [];

  // Local file entries
  entries.forEach(e => {
    offsets.push(pos);
    w32(dv, pos, 0x04034B50); // local file header sig
    w16(dv, pos + 4, 20);          // version needed
    w16(dv, pos + 6, 0);           // flags
    w16(dv, pos + 8, 0);           // compression: STORE
    w16(dv, pos + 10, 0);           // mod time
    w16(dv, pos + 12, 0);           // mod date
    w32(dv, pos + 14, e.crc);
    w32(dv, pos + 18, e.size);      // compressed size
    w32(dv, pos + 22, e.size);      // uncompressed size
    w16(dv, pos + 26, e.name.length);
    w16(dv, pos + 28, 0);           // extra field length
    pos += 30;
    u8.set(e.name, pos); pos += e.name.length;
    u8.set(e.data, pos); pos += e.size;
  });

  // Central directory
  const cdStart = pos;
  entries.forEach((e, i) => {
    w32(dv, pos, 0x02014B50); // central dir sig
    w16(dv, pos + 4, 20);          // version made by
    w16(dv, pos + 6, 20);          // version needed
    w16(dv, pos + 8, 0);           // flags
    w16(dv, pos + 10, 0);           // compression
    w16(dv, pos + 12, 0);           // mod time
    w16(dv, pos + 14, 0);           // mod date
    w32(dv, pos + 16, e.crc);
    w32(dv, pos + 20, e.size);      // compressed
    w32(dv, pos + 24, e.size);      // uncompressed
    w16(dv, pos + 28, e.name.length);
    w16(dv, pos + 30, 0);           // extra
    w16(dv, pos + 32, 0);           // comment
    w16(dv, pos + 34, 0);           // disk start
    w16(dv, pos + 36, 0);           // int attrs
    w32(dv, pos + 38, 0);           // ext attrs
    w32(dv, pos + 42, offsets[i]);  // local header offset
    pos += 46;
    u8.set(e.name, pos); pos += e.name.length;
  });

  // End of central directory
  w32(dv, pos, 0x06054B50);      // EOCD sig
  w16(dv, pos + 4, 0);               // disk number
  w16(dv, pos + 6, 0);               // disk with CD
  w16(dv, pos + 8, entries.length);  // entries this disk
  w16(dv, pos + 10, entries.length);  // total entries
  w32(dv, pos + 12, cdSize);          // CD size
  w32(dv, pos + 16, cdStart);         // CD offset
  w16(dv, pos + 20, 0);               // comment length

  return new Uint8Array(buf);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

function downloadZip(format, tabData) {
  const files = DOWNLOAD_TABS.map(tab => {
    const cols = TAB_COLUMNS[tab] || [];
    const rows = tabData[tab] || [];
    const fname = TAB_FILENAME[tab];
    let content, ext;
    if (format === "json") {
      content = rowsToJSON(rows); ext = "json";
    } else if (format === "csv") {
      content = rowsToCSV(cols, rows); ext = "csv";
    } else {
      content = rowsToXLSXXML(cols, rows); ext = "xls";
    }
    return { name: `${fname}.${ext}`, data: content };
  });
  const zip = buildZip(files);
  triggerDownload(new Blob([zip], { type: "application/zip" }), `GSTR1_${format.toUpperCase()}.zip`);
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  app: {
    fontFamily: "'Inter', sans-serif",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#fff",
    padding: "20px",
  },

  // HEADER
  titleBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  titleLabel: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
  },

  // FILTER SECTION
  params: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "16px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },

  paramRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },

  paramLabel: {
    minWidth: "180px",
    fontSize: "14px",
    color: "#cbd5e1",
    fontWeight: "500",
  },

  paramVal: {
    flex: 1,
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "10px 12px",
  },

  pInp: {
    background: "#1e293b",
    border: "1px solid #475569",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    borderRadius: "8px",
    padding: "10px 12px",
    boxSizing: "border-box",
  },

  pSel: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },

  // BUTTONS
  loadBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },

  expBtn: {
    background: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    marginLeft: "8px",
  },

  // TABLE WRAPPER
  gridWrap: {
    background: "#111827",
    borderRadius: "18px",
    overflow: "auto",
    border: "1px solid #334155",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    marginTop: "18px",
    maxHeight: "70vh",
  },

  // TABLE HEADER
  th: {
    background: "#1e293b",
    color: "#f8fafc",
    padding: "16px 14px",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "left",
    position: "sticky",
    top: 0,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #475569",
    zIndex: 2,
  },

  thS: {
    background: "#1e293b",
    color: "#fff",
    padding: "16px 12px",
    fontSize: "13px",
    width: "60px",
    position: "sticky",
    top: 0,
    zIndex: 2,
    borderBottom: "1px solid #475569",
  },

  // TABLE DATA
  td: {
    padding: "14px",
    borderBottom: "1px solid #1e293b",
    color: "#e2e8f0",
    fontSize: "13px",
    whiteSpace: "nowrap",
    transition: "0.2s",
  },

  tdS: {
    padding: "14px",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
    borderBottom: "1px solid #1e293b",
  },

  inp: {
    width: "100%",
    background: "transparent",
    border: "1px solid transparent",
    color: "#fff",
    outline: "none",
    fontSize: "13px",
    padding: "8px 10px",
    borderRadius: "8px",
    transition: "0.2s",
  },

  // EMPTY
  emptyCell: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    fontSize: "15px",
  },

  // ADD BUTTON
  addBtn: {
    background: "#22c55e",
    border: "none",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // TAB BAR
  tabsBar: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  tab: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
  },

  tabAct: {
    background: "#2563eb",
    border: "1px solid #2563eb",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },

  // STATUS BAR
  statusBar: {
    marginTop: "20px",
    color: "#94a3b8",
    fontSize: "13px",
  },

  // TOAST
  toast: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "#2563eb",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
};
// ─── Component ─────────────────────────────────────────────────────────────────
export default function GSTR1Report() {
  const [activeTab, setActiveTab] = useState(0);
  // const [tabData,     setTabData]     = useState(JSON.parse(JSON.stringify(SEED_DATA)));
  const [tabData, setTabData] = useState(DEFAULT_DATA);
  const [fromDate, setFromDate] = useState("yyyy-mm-dd");
  const [toDate, setToDate] = useState("yyyy-mm-dd");
  const [hsnDetail, setHsnDetail] = useState("Master");
  const [toverFormat, setToverFormat] = useState("New Format");
  const [annualTO, setAnnualTO] = useState("More Than 5 Crore");
  const [mode, setMode] = useState("Export");
  const [eInvoice, setEInvoice] = useState("All");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const tabKey = TABS[activeTab];
  const cols = TAB_COLUMNS[tabKey] || [];
  const rows = tabData[tabKey] || [];

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // ── Load Report ──────────────────────────────────────────────────────────────
  const handleLoadReport = () => {
    setLoading(true);
    setTimeout(() => {
      // setTabData(JSON.parse(JSON.stringify(SEED_DATA)));
      loadReportData();
      setLoading(false);
      showToast("Report reloaded successfully!");
    }, 700);
  };

  // ── Cell edit ────────────────────────────────────────────────────────────────
  const onCell = useCallback((ri, col, val) => {
    setTabData(prev => {
      const copy = prev[tabKey].map((r, i) => i === ri ? { ...r, [col]: val } : r);
      return { ...prev, [tabKey]: copy };
    });
  }, [tabKey]);

  // ── Add row ──────────────────────────────────────────────────────────────────
  const addRow = useCallback(() => {
    const blank = {};
    cols.forEach(c => { blank[c] = ""; });
    setTabData(prev => ({ ...prev, [tabKey]: [...(prev[tabKey] || []), blank] }));
  }, [tabKey, cols]);

  // ── Delete row ───────────────────────────────────────────────────────────────
  const delRow = useCallback((ri) => {
    setTabData(prev => ({ ...prev, [tabKey]: prev[tabKey].filter((_, i) => i !== ri) }));
  }, [tabKey]);

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = (fmt) => {
    try {
      downloadZip(fmt, tabData);
      showToast(`Downloading GSTR1_${fmt.toUpperCase()}.zip…`);
    } catch (e) {
      showToast("Download failed: " + e.message);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [
        b2bRes,
        b2clRes,
        b2csRes,
        cdnrRes,
        cdnurRes,
        expRes,
        atRes,
        atadjRes,
        exempRes,
        hsnRes,
        hsnb2b,
        hsnb2c,
        docsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/gstr1/b2b`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/b2c1`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/b2cs`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/cdnr`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/cdnur`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/exp`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/at`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/at`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/exemp`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/hsn`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/hsn`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/hsn`, { params: { from_date: fromDate, to_date: toDate } }),
        axios.get(`${API_BASE_URL}/gstr1/docs`, { params: { from_date: fromDate, to_date: toDate } })
      ]);



      setTabData({
        ...DEFAULT_DATA,

        "b2b,sez,de": b2bRes.data.map((item) => ({
          "GSTIN/UIN of Recipient": item.gstin || "",
          "Receiver Name": item.receiver_name || "",
          "Invoice Number": item.invoice_no || "",
          "Invoice Date": item.invoice_date || "",
          "Invoice Value": item.invoice_value || "",
          "Place Of Supply": item.place_supply || "",
          "Reverse Charge": item.reverse_charge || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Invoice Type": item.invoice_type || "",
          "E-Commerce GSTIN": item.ecommerce_gstin || "",
          "Rate": item.rate || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "b2cl": b2clRes.data.map((item) => ({
          "Invoice Number": item.invoice_no || "",
          "Invoice Date": item.invoice_date || "",
          "Invoice Value": item.invoice_value || "",
          "Place Of Supply": item.place_supply || "",
          "Rate": item.rate || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
          "E-Commerce GSTIN": item.ecommerce_gstin || "",
          "Sale from Bonded WH": item.sale_from_bonded_wh || "",
        })),

        "b2cs": b2csRes.data.map((item) => ({
          "Type": item.type || "",
          "Place Of Supply": item.place_supply || "",
          "Rate": item.rate || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
          "E-Commerce GSTIN": item.ecommerce_gstin || "",
        })),

        "cdnr": cdnrRes.data.map((item) => ({
          "GSTIN/UIN of Recipient": item.gstin || "",
          "Receiver Name": item.receiver_name || "",
          "Note Number": item.note_no || "",
          "Note Date": item.note_date || "",
          "Note Type": item.note_type || "",
          "Place Of Supply": item.place_supply || "",
          "Reverse Charge": item.reverse_charge || "",
          "Note Supply Type": item.note_supply_type || "",
          "Note Value": item.note_value || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Rate": item.rate || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
        })),


        "cdnur": cdnurRes.data.map((item) => ({
          "UR Type": item.ur_type || "",
          "Note Number": item.note_no || "",
          "Note Date": item.note_date || "",
          "Note Type": item.note_type || "",
          "Place Of Supply": item.place_supply || "",
          "Note Value": item.note_value || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Rate": item.rate || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
        })),


        "exp": expRes.data.map((item) => ({
          "Export Type": item.exp_type || "",
          "Invoice Number": item.invoice_no || "",
          "Invoice Date": item.invoice_date || "",
          "Invoice Value": item.invoice_value || "",
          "Port Code": item.po_code || "",
          "Shipping Bill Number": item.shipping_bill_no || "",
          "Shipping Bill Date": item.shipping_bill_date || "",
          "Rate": item.rate || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Taxable Value": item.taxable_value || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "at": atRes.data.map((item) => ({
          "Place Of Supply": item.place_supply || "",
          "Rate": item.rate || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Gross Advance Received": item.gross_adv_recive || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "atadj": atadjRes.data.map((item) => ({
          "Place Of Supply": item.place_supply || "",
          "Rate": item.rate || "",
          "Applicable % of Tax Rate": item.applicable_tax || "",
          "Gross Advance Received": item.gross_adv_recive || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "exemp": exempRes.data.map((item) => ({
          "Description": item.description || "",
          "Nil Rated Supplies": item.nill_rate_supplies || "",
          "Exempted (other than Nil Rated / Non-GST Supply)": item.excempted || "",
          "Non-GST Supplies": item.non_gst_supplies || "",
        })),

        "hsn": hsnRes.data.map((item) => ({
          "HSN": item.hsn || "",
          "Description": item.description || "",
          "UQC": item.uqc || "",
          "Total Quantity": item.total_quantity || "",
          "Total Value": item.total_value || "",
          "Taxable Value": item.taxable_value || "",
          "Integrated Tax Amount": item.integ_tax_amount || "",
          "Central Tax Amount": item.central_tax_amount || "",
          "State/UT Tax Amount": item.state_tax_amount || "",
          "Rate": item.rate || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "hsn(b2b)": hsnb2b.data.map((item) => ({
          "HSN": item.hsn || "",
          "Description": item.description || "",
          "UQC": item.uqc || "",
          "Total Quantity": item.total_quantity || "",
          "Total Value": item.total_value || "",
          "Taxable Value": item.taxable_value || "",
          "Integrated Tax Amount": item.integ_tax_amount || "",
          "Central Tax Amount": item.central_tax_amount || "",
          "State/UT Tax Amount": item.state_tax_amount || "",
          "Rate": item.rate || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "hsn(b2c)": hsnb2c.data.map((item) => ({
          "HSN": item.hsn || "",
          "Description": item.description || "",
          "UQC": item.uqc || "",
          "Total Quantity": item.total_quantity || "",
          "Total Value": item.total_value || "",
          "Taxable Value": item.taxable_value || "",
          "Integrated Tax Amount": item.integ_tax_amount || "",
          "Central Tax Amount": item.central_tax_amount || "",
          "State/UT Tax Amount": item.state_tax_amount || "",
          "Rate": item.rate || "",
          "Cess Amount": item.cess_amount || "",
        })),

        "docs": docsRes.data.map((item) => ({
          "Nature of Document": item.nature_of_doc || "",
          "Sr. No. From": item.sr_no_from || "",
          "Sr. No. To": item.sr_no_to || "",
          "Total Number": item.total_number || "",
          "Cancelled": item.cancelled || "",
        })),

      });

      showToast("Report loaded successfully!");
    } catch (error) {
      console.error("API Error:", error);
      showToast("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);


  return (
    <>
      <style>
        {`
      input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }
      `}
      </style>
      <div style={s.app}>
        <div style={{ maxWidth: "1500px", margin: "0 auto" }}></div>
        {/* Title Bar */}
        <div style={s.titleBar}>
          <div style={s.titleLabel}>GSTR1 Report</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11 }}>Default</span>
            <select style={{ fontSize: 11, height: 20, border: "1px inset #999" }}><option>Default</option></select>
          </div>
        </div>

        {/* Parameters */}
        <div style={s.params}>
          {/* Left column */}
          <div>
            {[["Enter From Date", fromDate, setFromDate], ["Enter To Date", toDate, setToDate]].map(([lbl, val, set]) => (
              <div key={lbl} style={s.paramRow}>
                <div style={s.paramLabel}>{lbl}</div>
                <div style={s.paramVal}><input type="date" value={val} onChange={e => set(e.target.value)} style={s.pInp} /></div>
              </div>
            ))}
            <div style={s.paramRow}>
              <div style={s.paramLabel}>HSN/GST detail</div>
              <div style={s.paramVal}>
                <select value={hsnDetail} onChange={e => setHsnDetail(e.target.value)} style={s.pSel}>
                  <option value="Master">Master</option>
                  <option value="Transaction">Transaction</option>
                </select>
              </div>
            </div>
            <div style={s.paramRow}>
              <div style={s.paramLabel}>Annual TurnOver Format</div>
              <div style={s.paramVal}>
                <select value={toverFormat} onChange={e => setToverFormat(e.target.value)} style={s.pSel}>
                  <option>New Format</option>
                  <option>Old Format</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div style={s.paramRow}>
              <div style={{ ...s.paramLabel, minWidth: 190 }}>Annual TurnOver(HSN Summary)</div>
              <div style={{ ...s.paramVal, minWidth: 150 }}>
                <select value={annualTO} onChange={e => setAnnualTO(e.target.value)} style={s.pSel}>
                  <option value="Upto 5 Crore">Upto 5 Crore</option>
                  <option value="More Than 5 Crore">More Than 5 Crore</option>
                </select>
              </div>
            </div>
            <div style={s.paramRow}>
              <div style={{ ...s.paramLabel, minWidth: 190 }}>Mode</div>
              <div style={{ ...s.paramVal, minWidth: 150 }}>
                <select value={mode} onChange={e => setMode(e.target.value)} style={s.pSel}>
                  <option value="Export">Export</option>
                  <option value="View">View</option>
                </select>
              </div>
            </div>
            <div style={s.paramRow}>
              <div style={{ ...s.paramLabel, minWidth: 190 }}>e-Invoice status</div>
              <div style={{ ...s.paramVal, minWidth: 150 }}>
                <select value={eInvoice} onChange={e => setEInvoice(e.target.value)} style={s.pSel}>
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Uploaded">Uploaded</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 6 }}>
              <button style={s.loadBtn} onClick={handleLoadReport} disabled={loading}>
                {loading ? "Loading…" : "Load Report"}
              </button>
              <button style={s.expBtn} onClick={() => handleDownload("json")}>JSON</button>
              <button style={s.expBtn} onClick={() => handleDownload("csv")}>CSV</button>
              <button style={s.expBtn} onClick={() => handleDownload("excel")}>Excel</button>
            </div>
          </div>
        </div>

        {/* F10 bar */}
        <div style={s.f10bar}>
          <span style={{ color: "#0000cc", cursor: "pointer" }}>F10 - View Options</span>
          &nbsp; Annual TurnOver Format &nbsp; {toverFormat}
        </div>

        {/* Dynamic Data Grid */}
        <div style={s.gridWrap}>
          {loading ? (
            <div style={{ ...s.emptyCell, padding: "40px 0" }}>⏳ Reloading report data…</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0, minWidth: "1400px", }}>
              <thead>
                <tr>
                  <th style={s.thS}>#</th>
                  {cols.map((c, i) => <th key={i} style={s.th}>{c}</th>)}
                  {/* {cols.length>0 && <th style={s.thAct}>Action</th>} */}
                </tr>
              </thead>
              <tbody>
                {cols.length === 0 ? (
                  <tr><td colSpan={2} style={s.emptyCell}>Select a tab to view columns</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={cols.length + 2} style={s.emptyCell}>No data — click "+ Add Row" to begin</td></tr>
                ) : rows.map((row, ri) => (
                  <tr key={ri}
                    style={{
                      background: ri % 2 === 0 ? "#172033" : "#0f172a",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#263449";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        ri % 2 === 0 ? "#172033" : "#0f172a";
                    }}>
                    <td style={s.tdS}>{ri + 1}</td>
                    {cols.map((col, ci) => (
                      <td key={ci} style={s.td}>
                        <input
                          value={row[col] ?? ""}
                          onChange={e => onCell(ri, col, e.target.value)}
                          style={s.inp}
                        />
                      </td>
                    ))}
                    {/* <td style={{...s.td,textAlign:"center",width:48}}>
                    <button style={s.delBtn} onClick={()=>delRow(ri)}>✕</button>
                  </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Row bar */}
        {/* {cols.length>0 && !loading && (
        <div style={{background:"#e8dfc0",borderTop:"1px solid #ccc",padding:"3px 0"}}>
          <button style={s.addBtn} onClick={addRow}>+ Add Row</button>
          <span style={{fontSize:10,color:"#555"}}>{rows.length} record{rows.length!==1?"s":""} in <strong>{tabKey}</strong></span>
        </div>
      )} */}

        {/* Bottom Tabs */}
        <div style={s.tabsBar}>
          {/* <span style={{fontSize:11,marginRight:4,color:"#000"}}>|◄ ◄ ► ►|</span> */}
          {TABS.map((tab, i) => (
            <button key={i} style={activeTab === i ? s.tabAct : s.tab} onClick={() => setActiveTab(i)}>{tab}</button>
          ))}
        </div>

        {/* Status Bar */}
        {/* <div style={s.statusBar}>
        Esc - Exit, F2 - Current Month, More Help Press Alt+F1 and View
      </div> */}

        {/* Toast */}
        {toast && <div style={s.toast}>{toast}</div>}

      </div>
    </>
  );
}