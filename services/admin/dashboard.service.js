import User from "../../models/user/userModel.js";
import Order from "../../models/user/orderModel.js";
import Product from "../../models/admin/productModel.js";
import Variant from "../../models/admin/variantModel.js";
import XLSX from "xlsx-js-style";
import PDFDocument from "pdfkit";

export const getDashboardStatsService = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const earningsData = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { 
          _id: null, 
          totalEarnings: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalProductCount: { $sum: "$items.quantity" }
      }}
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;
    const totalProductCount = earningsData.length > 0 ? earningsData[0].totalProductCount : 0;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const popularProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // 1. TODAY (Hourly)
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const todayRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $hour: "$createdAt" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const todayData = Array.from({length: 6}, (_, i) => {
      const hour = (i + 1) * 4;
      const match = todayRaw.find(r => r._id >= hour - 4 && r._id < hour);
      return { label: `${hour > 12 ? hour-12 : hour}${hour >= 12 ? 'pm' : 'am'}`, value: match ? match.revenue : 0 };
    });

    // 2. WEEK (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const weekData = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = weekRaw.find(s => s._id === dateStr);
      weekData.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: match ? match.revenue : 0 });
    }

    // 3. MONTH (Weeks of current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const monthData = Array.from({length: 4}, (_, i) => {
      const match = monthRaw.find(r => r._id === i + 1);
      return { label: `Week ${i + 1}`, value: match ? match.revenue : 0 };
    });

    // 4. YEAR (Months of current year)
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    const yearRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      { $unwind: "$items" },
      { $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { "_id": 1 } }
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearData = monthNames.map((name, i) => {
      const match = yearRaw.find(r => r._id === i + 1);
      return { label: name, value: match ? match.revenue : 0 };
    });

    const chartData = { today: todayData, week: weekData, month: monthData, year: yearData };

    const subcategorySales = await Order.aggregate([
      { $unwind: "$items" },
      { $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
      }},
      { $unwind: "$product" },
      { $lookup: {
          from: "subcategories",
          localField: "product.subcategory",
          foreignField: "_id",
          as: "subcat"
      }},
      { $unwind: "$subcat" },
      { $group: {
          _id: "$subcat._id",
          name: { $first: "$subcat.name" },
          totalSold: { $sum: "$items.quantity" }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 4 }
    ]);

    const topProduct = popularProducts.length > 0 ? popularProducts[0] : null;
    const outOfStockCount = await Variant.countDocuments({ stock: 0 });
    const lowStockCount = await Variant.countDocuments({ stock: { $gt: 0, $lte: 10 } });
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const orderStatusCounts = { Delivered: 0, Pending: 0, Cancelled: 0, Returned: 0, Placed: 0, Confirmed: 0, Processing: 0, Shipped: 0 };
    statusCounts.forEach(s => { orderStatusCounts[s._id] = s.count; });

    return {
        stats: { totalUsers, totalOrders: totalProductCount, totalProducts, totalRevenue: totalEarnings },
        recentOrders, popularProducts, subcategorySales, chartData, topProduct,
        inventoryStats: { outOfStock: outOfStockCount, lowStock: lowStockCount },
        orderStatusCounts
    };
};

export const getOrdersForReportService = async (startDate, endDate) => {
    return await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Cancelled'] }
    }).sort({ createdAt: -1 });
};

export const getSalesReportStatsService = async (startDate, prevStartDate, endDate) => {
    const getStats = async (start, end) => {
      const stats = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $nin: ['Cancelled'] } }},
        { $unwind: "$items" },
        { $match: { "items.status": { $nin: ['Cancelled', 'Returned'] } } },
        { $group: {
            _id: null,
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            orders: { $addToSet: "$_id" },
            products: { $sum: "$items.quantity" }
        }},
        { $project: {
            revenue: 1,
            orderCount: { $size: "$orders" },
            productCount: "$products"
        }}
      ]);
      return stats[0] || { revenue: 0, orderCount: 0, productCount: 0 };
    };

    const currentStats = await getStats(startDate, endDate);
    const previousStats = await getStats(prevStartDate, startDate);

    const revenueOverviewRaw = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['Cancelled'] } }},
      { $unwind: "$items" },
      { $match: { "items.status": { $nin: ['Cancelled', 'Returned'] } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    const revenueOverview = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const match = revenueOverviewRaw.find(d => d._id === dateStr);
      revenueOverview.push({ _id: dateStr, revenue: match ? match.revenue : 0 });
      current.setDate(current.getDate() + 1);
    }

    const couponUsage = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, couponCode: { $ne: null } }},
      { $group: { _id: "$couponCode", count: { $sum: 1 }, discount: { $sum: "$discount" } }},
      { $limit: 5 }
    ]);

    const orderBreakdown = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).limit(5);

    return { currentStats, previousStats, revenueOverview, couponUsage, orderBreakdown };
};

export const generateExcelReportService = (res, orders, orderRows, period, startDate, totalRevenue) => {
    const wb = XLSX.utils.book_new();
    const ws = {};

    const setCell = (r, c, val, type, format = null, style = {}) => {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = { v: val, t: type };
        if (format) cell.z = format;
        if (style) cell.s = style;
        ws[cellRef] = cell;
    };

    const headers = ["Order Number", "Date", "Subtotal", "Discount", "Total Amount", "Payment Method"];
    const headerStyle = {
        fill: { fgColor: { rgb: "1E5E2F" } },
        font: { color: { rgb: "FFFFFF" }, bold: true, name: "Calibri", sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
    };

    headers.forEach((h, c) => setCell(0, c, h, 's', null, headerStyle));

    const dataStyle = (align) => ({
        font: { name: "Calibri", sz: 11 },
        alignment: { horizontal: align, vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
    });

    orderRows.forEach((row, i) => {
        const ord = orders[i];
        const r = i + 1;
        const yyyy = ord.createdAt.getFullYear();
        const mm = String(ord.createdAt.getMonth() + 1).padStart(2, '0');
        const dd = String(ord.createdAt.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        setCell(r, 0, row.orderNumber, 's', null, dataStyle("center"));
        setCell(r, 1, formattedDate, 's', null, dataStyle("center"));
        setCell(r, 2, parseFloat(row.subtotal), 'n', '"₹"#,##0.00', dataStyle("right"));
        setCell(r, 3, parseFloat(row.discount), 'n', '"₹"#,##0.00', dataStyle("right"));
        setCell(r, 4, parseFloat(row.total), 'n', '"₹"#,##0.00', dataStyle("right"));
        setCell(r, 5, ord.paymentMethod.toUpperCase(), 's', null, dataStyle("center"));
    });

    const rGrand = orderRows.length + 2;
    const grandLabelStyle = { font: { bold: true, name: "Calibri", sz: 11 }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } };
    const grandValueStyle = { font: { bold: true, name: "Calibri", sz: 11 }, alignment: { horizontal: "right", vertical: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } };
    
    setCell(rGrand, 3, "GRAND TOTAL", 's', null, grandLabelStyle);
    setCell(rGrand, 4, parseFloat(totalRevenue.toFixed(2)), 'n', '"₹"#,##0.00', grandValueStyle);

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rGrand, c: 5 } });
    ws['!cols'] = [ { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 } ];

    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Sales_Report_${period}_${startDate.toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
};

export const generatePDFReportService = (res, orderRows, period, startDate, reportTitle, periodStr, generatedStr, totalOrders, totalRevenue, totalDiscount, unitsSold) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Sales_Report_${period}_${startDate.toISOString().split('T')[0]}.pdf`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.rect(40, 30, 515, 6).fill('#1E5E2F');

    doc.fillColor('#1C1C1C').font('Times-Bold').fontSize(30).text('AJAX', 40, 55);
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(12).text(reportTitle, 300, 55, { width: 255, align: 'right' });
    doc.fillColor('#6B7280').font('Helvetica').fontSize(8.5).text(`Period: ${periodStr}`, 300, 72, { width: 255, align: 'right' });
    doc.fillColor('#9CA3AF').font('Helvetica').fontSize(8.5).text(`Generated: ${generatedStr}`, 300, 85, { width: 255, align: 'right' });

    const boxY = 115;
    const boxW = 121.25;
    const boxH = 50;
    const boxGap = 10;

    const metrics = [
        { label: 'TOTAL ORDERS', val: totalOrders.toString() },
        { label: 'TOTAL REVENUE', val: `Rs.${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
        { label: 'TOTAL DISCOUNT', val: `Rs.${totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
        { label: 'UNITS SOLD', val: unitsSold.toString() }
    ];

    metrics.forEach((m, idx) => {
        const boxX = 40 + idx * (boxW + boxGap);
        doc.fillColor('#FAFAF8').strokeColor('#E2E8F0').lineWidth(0.75).roundedRect(boxX, boxY, boxW, boxH, 6).fillAndStroke();
        doc.fillColor('#888888').font('Helvetica-Bold').fontSize(7).text(m.label, boxX, boxY + 12, { width: boxW, align: 'center' });
        doc.fillColor('#1C1C1C').font('Helvetica-Bold').fontSize(12).text(m.val, boxX, boxY + 26, { width: boxW, align: 'center' });
    });

    doc.fillColor('#1C1C1C').font('Helvetica-Bold').fontSize(11).text('Order Details', 40, 185);

    const tableY = 202;
    doc.fillColor('#1E352F').rect(40, tableY, 515, 22).fill();

    const cols = [
        { name: '#', x: 40, w: 25, align: 'left' },
        { name: 'Order Number', x: 65, w: 110, align: 'left' },
        { name: 'Date', x: 175, w: 80, align: 'left' },
        { name: 'Qty', x: 255, w: 30, align: 'center' },
        { name: 'Subtotal', x: 285, w: 65, align: 'right' },
        { name: 'Discount', x: 350, w: 60, align: 'right' },
        { name: 'Payment', x: 410, w: 55, align: 'left' },
        { name: 'Total', x: 465, w: 90, align: 'right' }
    ];

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
    cols.forEach(c => doc.text(c.name, c.x, tableY + 7, { width: c.w, align: c.align }));

    let currentY = tableY + 22;
    const rowHeight = 20;

    orderRows.forEach(row => {
        if (currentY > 780) {
            doc.addPage();
            currentY = 40;
            doc.fillColor('#1E352F').rect(40, currentY, 515, 22).fill();
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
            cols.forEach(c => doc.text(c.name, c.x, currentY + 7, { width: c.w, align: c.align }));
            currentY += 22;
        }

        doc.fillColor('#1C1C1C');
        doc.font('Helvetica').fontSize(7.5).text(row.index.toString(), cols[0].x, currentY + 6, { width: cols[0].w, align: cols[0].align });
        doc.font('Helvetica-Bold').text(row.orderNumber, cols[1].x, currentY + 6, { width: cols[1].w, align: cols[1].align });
        doc.font('Helvetica').text(row.date, cols[2].x, currentY + 6, { width: cols[2].w, align: cols[2].align });
        doc.text(row.qty.toString(), cols[3].x, currentY + 6, { width: cols[3].w, align: cols[3].align });
        doc.text(`Rs.${parseFloat(row.subtotal).toLocaleString(undefined, {minimumFractionDigits:2})}`, cols[4].x, currentY + 6, { width: cols[4].w, align: cols[4].align });
        doc.fillColor('#EF4444').text(`Rs.${parseFloat(row.discount).toLocaleString(undefined, {minimumFractionDigits:2})}`, cols[5].x, currentY + 6, { width: cols[5].w, align: cols[5].align });
        doc.fillColor('#1C1C1C').text(row.payment, cols[6].x, currentY + 6, { width: cols[6].w, align: cols[6].align });
        doc.font('Helvetica-Bold').text(`Rs.${parseFloat(row.total).toLocaleString(undefined, {minimumFractionDigits:2})}`, cols[7].x, currentY + 6, { width: cols[7].w, align: cols[7].align });

        doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(40, currentY + rowHeight).lineTo(555, currentY + rowHeight).stroke();
        currentY += rowHeight;
    });

    if (currentY > 780) {
        doc.addPage();
        currentY = 40;
    }

    doc.fillColor('#F4FBF7').rect(40, currentY, 515, 22).fill();
    doc.strokeColor('#1E5E2F').lineWidth(1).moveTo(40, currentY).lineTo(555, currentY).stroke();
    doc.strokeColor('#1E5E2F').lineWidth(1).moveTo(40, currentY + 22).lineTo(555, currentY + 22).stroke();

    doc.fillColor('#1E5E2F').font('Helvetica-Bold').fontSize(7.5);
    doc.text('GRAND TOTAL', cols[0].x, currentY + 7, { width: cols[0].w + cols[1].w + cols[2].w, align: 'left' });
    doc.text(unitsSold.toString(), cols[3].x, currentY + 7, { width: cols[3].w, align: cols[3].align });
    doc.text(`Rs.${totalDiscount.toLocaleString(undefined, {minimumFractionDigits:2})}`, cols[5].x, currentY + 7, { width: cols[5].w, align: cols[5].align });
    doc.text(`Rs.${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}`, cols[7].x, currentY + 7, { width: cols[7].w, align: cols[7].align });

    doc.end();
};
