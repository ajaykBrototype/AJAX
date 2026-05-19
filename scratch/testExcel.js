import XLSX from "xlsx-js-style";
import fs from "fs";

// Create workbook
const wb = XLSX.utils.book_new();

// Define data
const orderRows = [
  { orderNumber: "ORD-QUAKHGX9VY", date: "2026-05-18", subtotal: 659.00, discount: 0.00, total: 759.00, payment: "COD" },
  { orderNumber: "ORD-MBR7UH9MHQ", date: "2026-05-07", subtotal: 1598.40, discount: 0.00, total: 1598.40, payment: "WALLET" },
  { orderNumber: "ORD-KCGPTWH69L", date: "2026-05-05", subtotal: 399.00, discount: 0.00, total: 499.00, payment: "COD" },
  { orderNumber: "ORD-KGYLU91OFE", date: "2026-05-05", subtotal: 890.00, discount: 0.00, total: 990.00, payment: "RAZORPAY" },
  { orderNumber: "ORD-MY36UAM2AU", date: "2026-05-04", subtotal: 399.00, discount: 0.00, total: 499.00, payment: "COD" },
  { orderNumber: "ORD-E04ZNU5LX9", date: "2026-05-02", subtotal: 896.00, discount: 0.00, total: 996.00, payment: "COD" }
];

const totalDiscount = 0.00;
const totalRevenue = 5341.40;

// Set up sheet
const ws = {};

// Helper for cell creation
function setCell(r, c, val, type, format = null, style = {}) {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  const cell = { v: val, t: type };
  if (format) {
    cell.z = format;
  }
  if (style) {
    cell.s = style;
  }
  ws[cellRef] = cell;
}

// 1. Headers
const headers = ["Order Number", "Date", "Subtotal", "Discount", "Total Amount", "Payment Method"];
const headerStyle = {
  fill: {
    fgColor: { rgb: "1E5E2F" } // forest green
  },
  font: {
    color: { rgb: "FFFFFF" },
    bold: true,
    name: "Calibri",
    sz: 11
  },
  alignment: {
    horizontal: "center",
    vertical: "center"
  },
  border: {
    top: { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
    left: { style: "thin", color: { rgb: "D1D5DB" } },
    right: { style: "thin", color: { rgb: "D1D5DB" } }
  }
};

headers.forEach((h, c) => {
  setCell(0, c, h, 's', null, headerStyle);
});

// 2. Data Rows
const dataStyle = (align) => ({
  font: {
    name: "Calibri",
    sz: 11
  },
  alignment: {
    horizontal: align,
    vertical: "center"
  },
  border: {
    top: { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
    left: { style: "thin", color: { rgb: "D1D5DB" } },
    right: { style: "thin", color: { rgb: "D1D5DB" } }
  }
});

orderRows.forEach((row, i) => {
  const r = i + 1;
  setCell(r, 0, row.orderNumber, 's', null, dataStyle("center"));
  setCell(r, 1, row.date, 's', null, dataStyle("center"));
  setCell(r, 2, row.subtotal, 'n', '"₹"#,##0.00', dataStyle("right"));
  setCell(r, 3, row.discount, 'n', '"₹"#,##0.00', dataStyle("right"));
  setCell(r, 4, row.total, 'n', '"₹"#,##0.00', dataStyle("right"));
  setCell(r, 5, row.payment, 's', null, dataStyle("center"));
});

// 3. Blank row
// Row 8 is index 7. We don't write anything.

// 4. Grand Total Row (Row index 8)
const grandLabelStyle = {
  font: {
    bold: true,
    name: "Calibri",
    sz: 11
  },
  alignment: {
    horizontal: "right",
    vertical: "center"
  },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const grandValueStyle = {
  font: {
    bold: true,
    name: "Calibri",
    sz: 11
  },
  alignment: {
    horizontal: "right",
    vertical: "center"
  },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  }
};

const rGrand = orderRows.length + 2; // e.g. 6 + 2 = 8 (which is Row 9)
setCell(rGrand, 3, "GRAND TOTAL", 's', null, grandLabelStyle);
setCell(rGrand, 4, totalRevenue, 'n', '"₹"#,##0.00', grandValueStyle);

// Set ref
const maxRow = rGrand + 1;
ws['!ref'] = XLSX.utils.encode_range({
  s: { r: 0, c: 0 },
  e: { r: maxRow - 1, c: 5 }
});

// Set columns width
ws['!cols'] = [
  { wch: 20 }, // Order Number
  { wch: 15 }, // Date
  { wch: 15 }, // Subtotal
  { wch: 15 }, // Discount
  { wch: 15 }, // Total Amount
  { wch: 18 }  // Payment Method
];

XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
fs.writeFileSync("scratch/test_report.xlsx", buffer);
console.log("Successfully wrote test_report.xlsx!");
