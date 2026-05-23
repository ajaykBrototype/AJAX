import * as dashboardService from "../../services/admin/dashboard.service.js";

export const loadDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardStatsService();
    res.render("admin/dashboard", data);
  } catch (err) {
    console.log("LOAD DASHBOARD ERROR:", err);
    res.redirect("/admin/dashboard");
  }
};

export const loadSalesReport = async (req, res) => {
  try {
    const period = req.query.period || 'month';
    let startDate = new Date();
    let prevStartDate = new Date();
    const endDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (req.query.download) {
      const formatDate = (date) => date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      const formatDateTime = (date) => date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const periodStr = `${formatDate(startDate)} -> ${formatDate(endDate)}`;
      const generatedStr = formatDateTime(new Date());

      const orders = await dashboardService.getOrdersForReportService(startDate, endDate);

      let totalOrders = orders.length;
      let totalDiscount = 0;
      let unitsSold = 0;
      let totalRevenue = 0;

      const orderRows = orders.map((ord, index) => {
        const activeItems = ord.items.filter(item => item.status !== 'Cancelled' && item.status !== 'Returned');
        const qty = activeItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = ord.discount || 0;
        const payment = ord.paymentMethod === 'COD' ? 'Cash' : (ord.paymentMethod === 'RAZORPAY' ? 'Razorpay' : 'Wallet');
        const total = ord.totalAmount;

        totalDiscount += discount;
        unitsSold += qty;
        totalRevenue += total;

        return {
          index: index + 1,
          orderNumber: `ORD-${ord._id.toString().slice(-8).toUpperCase()}`,
          date: ord.createdAt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          qty,
          subtotal: subtotal.toFixed(2),
          discount: discount.toFixed(2),
          payment,
          total: total.toFixed(2)
        };
      });

      const reportTitle = `${period.toUpperCase()} REPORT`;

      if (req.query.download === 'excel') {
        return dashboardService.generateExcelReportService(res, orders, orderRows, period, startDate, totalRevenue);
      }

      if (req.query.download === 'pdf') {
        return dashboardService.generatePDFReportService(res, orderRows, period, startDate, reportTitle, periodStr, generatedStr, totalOrders, totalRevenue, totalDiscount, unitsSold);
      }
    }

    const reportStats = await dashboardService.getSalesReportStatsService(startDate, prevStartDate, endDate);

    res.render("admin/salesReport", {
      currentPath: "/admin/sales-report",
      period,
      ...reportStats,
      startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  } catch (err) {
    console.log("LOAD SALES REPORT ERROR:", err);
    res.redirect("/admin/dashboard");
  }
};