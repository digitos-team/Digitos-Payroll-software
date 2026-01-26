import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== HELPER FUNCTIONS (DEFINED FIRST) ==================

const registerFonts = (doc) => {
  const fontPath = path.join(process.cwd(), "fonts");
  doc.registerFont("Noto", path.join(fontPath, "NotoSans-Regular.ttf"));
  doc.registerFont("Noto-Bold", path.join(fontPath, "NotoSans-Bold.ttf"));
};

const drawLine = (doc, y) => {
  doc.save();
  doc.strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .stroke();
  doc.restore();
};

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getMonthName = (monthNum) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[parseInt(monthNum) - 1] || "Unknown";
};

const addHeader = (doc, title, subtitle = null) => {
  doc.save();
  
  // Title
  doc.font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#1a1a1a")
    .text(title, 50, 50, { align: "center" });
  
  // Optional subtitle
  if (subtitle) {
    doc.fontSize(12)
      .fillColor("#666666")
      .text(subtitle, 50, 75, { align: "center" });
  }
  
  // Horizontal line
  const lineY = subtitle ? 95 : 75;
  doc.strokeColor("#cccccc")
    .lineWidth(1)
    .moveTo(50, lineY)
    .lineTo(doc.page.width - 50, lineY)
    .stroke();
  
  doc.restore();
  doc.moveDown(3);
};

const addFooter = (doc) => {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc.save();
    doc.strokeColor("#cccccc")
      .lineWidth(0.5)
      .moveTo(50, doc.page.height - 60)
      .lineTo(doc.page.width - 50, doc.page.height - 60)
      .stroke();
    doc.restore();
    
    // Page number and date
    doc.font("Helvetica")
      .fontSize(9)
      .fillColor("#666666")
      .text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 40,
        { align: "center" }
      );
    
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      50,
      doc.page.height - 40,
      { align: "right" }
    );
  }
};

// ================== MONTHLY REPORTS PDF GENERATOR ==================

export const generateMonthlyRevenueReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Revenue_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(doc, `Monthly Revenue Report - ${getMonthName(month)} ${year}`);

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Revenue: $${formatCurrency(data.summary.totalRevenue)}`);
      doc.text(`Number of Transactions: ${data.summary.count}`);
      doc.text(
        `Average Revenue: $${formatCurrency(data.summary.averageRevenue)}`
      );
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Revenue Details", { underline: true });
    doc.moveDown(0.5);

    if (data.revenues && data.revenues.length > 0) {
      // Table Header
      const pageWidth = doc.page.width - 100;
      const col1Width = pageWidth * 0.15;
      const col2Width = pageWidth * 0.25;
      const col3Width = pageWidth * 0.25;
      const col4Width = pageWidth * 0.35;

      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, y);
      doc.text("Amount", 50 + col1Width, y);
      doc.text("Client", 50 + col1Width + col2Width, y);
      doc.text("Description", 50 + col1Width + col2Width + col3Width, y);

      // Table rows
      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.revenues.forEach((revenue) => {
        const revenueDate = new Date(revenue.RevenueDate).toLocaleDateString();
        doc.text(revenueDate, 50);
        doc.text(`$${formatCurrency(revenue.Amount)}`, 50 + col1Width);
        doc.text(
          revenue.ClientName || "N/A",
          50 + col1Width + col2Width,
          doc.y - 11
        );
        doc.text(
          revenue.Source || "N/A",
          50 + col1Width + col2Width + col3Width,
          doc.y - 11
        );
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No revenue data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly revenue report:", error);
    throw error;
  }
};

export const generateMonthlyExpensesReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Expenses_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(doc, `Monthly Expenses Report - ${getMonthName(month)} ${year}`);

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(
        `Total Expenses: $${formatCurrency(data.summary.totalExpenses)}`
      );
      doc.text(`Number of Transactions: ${data.summary.count}`);
      doc.text(
        `Average Expense: $${formatCurrency(data.summary.averageExpense)}`
      );
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Expense Details", { underline: true });
    doc.moveDown(0.5);

    if (data.expenses && data.expenses.length > 0) {
      // Table Header
      const pageWidth = doc.page.width - 100;
      const col1Width = pageWidth * 0.15;
      const col2Width = pageWidth * 0.2;
      const col3Width = pageWidth * 0.25;
      const col4Width = pageWidth * 0.4;

      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Date", 50, y);
      doc.text("Amount", 50 + col1Width, y);
      doc.text("Type", 50 + col1Width + col2Width, y);
      doc.text("Description", 50 + col1Width + col2Width + col3Width, y);

      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.expenses.forEach((expense) => {
        const expenseDate = new Date(expense.ExpenseDate).toLocaleDateString();
        doc.text(expenseDate, 50);
        doc.text(`$${formatCurrency(expense.Amount)}`, 50 + col1Width);
        doc.text(
          expense.ExpenseType || "Other",
          50 + col1Width + col2Width,
          doc.y - 11
        );
        doc.text(
          expense.ExpenseTitle || "N/A",
          50 + col1Width + col2Width + col3Width,
          doc.y - 11
        );
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No expense data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly expenses report:", error);
    throw error;
  }
};

export const generateMonthlyOrdersReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Orders_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ========== REGISTER FONTS ==========
    const fontsDir = path.join(process.cwd(), "fonts");
    doc.registerFont("Noto", path.join(fontsDir, "NotoSans-Regular.ttf"));
    doc.registerFont("Noto-Bold", path.join(fontsDir, "NotoSans-Bold.ttf"));

    const logoPath = path.join(process.cwd(), "logo", "RGB.png");

    let y = 50;

    // ========== COMPANY HEADER ==========
    doc
      .font("Noto-Bold")
      .fontSize(18)
      .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });

    y += 25;

    doc
      .font("Noto")
      .fontSize(10)
      .text("Hudco Colony", 50, y, { align: "right" })
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, { align: "right" })
      .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
      .text("Email: info@digitositsolutions.com", 50, y + 36, { align: "right" })
      .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

    y += 90;

    // ========== TITLE ==========
    doc
      .font("Noto-Bold")
      .fontSize(20)
      .text(`Monthly Orders Report - ${getMonthName(month)} ${year}`, {
        align: "center",
      });

    y += 35;

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;

    // ========== WATERMARK ==========
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.40);
      doc.image(logoPath, 150, y + 20, { width: 300 });
      doc.restore();
    }

    // ========== SUMMARY ==========
    doc.font("Noto-Bold").fontSize(14).text("Summary");
    y = doc.y + 10;

    doc.font("Noto").fontSize(11);
    doc.text(`Total Orders: ${data.summary.count}`);
    doc.text(`Total Order Value: ₹${data.summary.totalValue.toLocaleString("en-IN")}`);
    doc.text(
      `Average Order Value: ₹${(
        data.summary.totalValue / (data.summary.count || 1)
      ).toLocaleString("en-IN")}`
    );

    y = doc.y + 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 25;

    // ========== TABLE HEADER ==========
    doc.font("Noto-Bold").fontSize(12);

    doc.text("Order Date", 50, y);
    doc.text("Client", 140, y);
    doc.text("Service", 260, y);
    doc.text("Amount (₹)", 400, y);
    doc.text("Status", 500, y);

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // ========== TABLE ROWS ==========
    doc.font("Noto").fontSize(10);

    data.orders.forEach((order) => {
      if (y > 700) {
        doc.addPage();
        y = 50;

        doc.font("Noto-Bold").fontSize(12);
        doc.text("Order Date", 50, y);
        doc.text("Client", 140, y);
        doc.text("Service", 260, y);
        doc.text("Amount (₹)", 400, y);
        doc.text("Status", 500, y);

        y += 20;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        doc.font("Noto").fontSize(10);
      }

      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");

      doc.text(orderDate, 50, y);
      doc.text(order.ClientName || "N/A", 140, y);
      doc.text(order.ServiceTitle || "N/A", 260, y);
      doc.text(order.Amount?.toLocaleString("en-IN"), 400, y);
      doc.text(order.PaymentStatus || "Pending", 500, y);

      y += 22;
    });

    // ========== FOOTER ==========
    const totalPages = doc.bufferedPageRange().count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .font("Noto")
        .fontSize(10)
        .text(`Page ${i + 1} of ${totalPages}`, 0, doc.page.height - 40, {
          align: "center",
        });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly orders report:", error);
    throw error;
  }
};

export const generateMonthlyPurchasesReport = async (data, month, year) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Monthly_Purchases_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    addHeader(
      doc,
      `Monthly Purchases & Profit Report - ${getMonthName(month)} ${year}`
    );

    // Summary Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true });
    doc.moveDown(0.5);

    if (data.summary) {
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Revenue: $${formatCurrency(data.summary.totalRevenue)}`);
      doc.text(
        `Total Expenses: $${formatCurrency(data.summary.totalExpenses)}`
      );
      doc.text(`Total Profit: $${formatCurrency(data.summary.totalProfit)}`, {
        color: "green",
      });
      doc.text(`Profit Margin: ${data.summary.profitMargin}%`);
      doc.text(`Number of Purchases: ${data.summary.count}`);
    }

    doc.moveDown(1);

    // Details Section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Purchase Details", { underline: true });
    doc.moveDown(0.5);

    if (data.purchases && data.purchases.length > 0) {
      // Table Header
      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Client", 50, y);
      doc.text("Revenue", 200, y);
      doc.text("Expenses", 280, y);
      doc.text("Profit", 360, y);
      doc.text("Margin", 440, y);

      doc
        .moveTo(50, y + 15)
        .lineTo(doc.page.width - 50, y + 15)
        .stroke();
      doc.moveDown(1);

      doc.fontSize(9).font("Helvetica");
      data.purchases.forEach((purchase) => {
        const profitMargin =
          purchase.OrderAmount > 0
            ? (
                ((purchase.OrderAmount - purchase.TotalExpense) /
                  purchase.OrderAmount) *
                100
              ).toFixed(2)
            : 0;

        doc.text(purchase.ClientName || "N/A", 50);
        doc.text(`$${formatCurrency(purchase.OrderAmount)}`, 200, doc.y - 11);
        doc.text(`$${formatCurrency(purchase.TotalExpense)}`, 280, doc.y - 11);
        doc.text(
          `$${formatCurrency(purchase.OrderAmount - purchase.TotalExpense)}`,
          360,
          doc.y - 11,
          { color: "green" }
        );
        doc.text(`${profitMargin}%`, 440, doc.y - 11);
        doc.moveDown(0.8);
      });
    } else {
      doc.text("No purchase data available.", { color: "red" });
    }

    addFooter(doc);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating monthly purchases report:", error);
    throw error;
  }
};

export const generateComprehensiveMonthlyReport = async (
  revenueData,
  expensesData,
  ordersData,
  purchasesData,
  month,
  year
) => {
  try {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir))
      fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `Comprehensive_Report_${month}_${year}_${Date.now()}.pdf`;
    const filePath = path.join(exportDir, fileName);

    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    registerFonts(doc);

    // =====================================================
    // CALCULATE CORRECT TOTALS FROM ACTUAL DATA
    // =====================================================
    const totalRevenue = revenueData.revenues?.reduce((sum, rev) => sum + (parseFloat(rev.Amount) || 0), 0) || 0;
    const totalExpenses = expensesData.expenses?.reduce((sum, exp) => sum + (parseFloat(exp.Amount) || 0), 0) || 0;
    const totalProfit = totalRevenue - totalExpenses;
    const totalOrders = ordersData.orders?.length || 0;

    // =====================================================
    // COMPANY HEADER (RIGHT ALIGNED)
    // =====================================================
    let y = 50;

    doc.font("Noto-Bold").fontSize(18)
      .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });
    y += 25;

    doc.font("Noto").fontSize(10)
      .text("Hudco Colony", 50, y, { align: "right" })
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, { align: "right" })
      .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
      .text("Email: info@digitositsolutions.com", 50, y + 36, { align: "right" })
      .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

    y += 80;

    // =====================================================
    // TITLE
    // =====================================================
    doc.font("Noto-Bold").fontSize(24).fillColor("#1a1a1a")
      .text(`Comprehensive Monthly Report`, 50, y, { align: "center" });
    y += 30;
    
    doc.fontSize(14).font("Noto").fillColor("#666666")
      .text(`${getMonthName(month)} ${year}`, 50, y, { align: "center" });
    
    y += 30;
    drawLine(doc, y);
    y += 30;

    // =====================================================
    // WATERMARK (MOVED EARLIER FOR BETTER PLACEMENT)
    // =====================================================
    const logoPath = path.join(process.cwd(), "logo", "RGB.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.08);
      doc.image(logoPath, 
        (doc.page.width - 400) / 2, 
        (doc.page.height - 400) / 2, 
        { width: 400 }
      );
      doc.restore();
    }

    // =====================================================
    // EXECUTIVE SUMMARY (IMPROVED LAYOUT)
    // =====================================================
    doc.font("Noto-Bold").fontSize(16).fillColor("#1a1a1a")
      .text("Executive Summary", 50, y);
    y += 25;

    // Summary box with background
    const summaryBoxY = y;
    doc.save();
    doc.fillColor("#f8f9fa")
      .rect(50, summaryBoxY, doc.page.width - 100, 110)
      .fill();
    doc.restore();

    y += 15;

    doc.font("Noto").fontSize(11).fillColor("#1a1a1a");
    
    // Left column
    doc.text("Total Revenue:", 70, y, { continued: false });
    doc.font("Noto-Bold").text(`₹${formatCurrency(totalRevenue)}`, 200, y);
    
    y += 20;
    doc.font("Noto").text("Total Expenses:", 70, y);
    doc.font("Noto-Bold").text(`₹${formatCurrency(totalExpenses)}`, 200, y);
    
    // Right column
    y -= 20;
    doc.font("Noto").text("Total Profit:", 320, y);
    doc.font("Noto-Bold").fillColor(totalProfit >= 0 ? "#28a745" : "#dc3545")
      .text(`₹${formatCurrency(totalProfit)}`, 450, y);
    
    y += 20;
    doc.font("Noto").fillColor("#1a1a1a").text("Total Orders:", 320, y);
    doc.font("Noto-Bold").text(`${totalOrders}`, 450, y);

    y += 35;
    drawLine(doc, y);
    y += 30;

    // =====================================================
    // TABLE RENDER FUNCTION (IMPROVED)
    // =====================================================
    const renderTable = (title, rows, columns) => {
      // Check if we need a new page for the table header
      if (doc.y > 700) {
        doc.addPage();
      }

      // Section title
      doc.font("Noto-Bold").fontSize(16).fillColor("#1a1a1a")
        .text(title, 50, doc.y);
      
      let yy = doc.y + 15;
      drawLine(doc, yy);
      yy += 15;

      // Check for empty data
      if (!rows || rows.length === 0) {
        doc.font("Noto").fontSize(11).fillColor("#999999")
          .text("No data available for this section.", 50, yy);
        doc.moveDown(2);
        return;
      }

      // Header row with background
      doc.save();
      doc.fillColor("#e9ecef")
        .rect(50, yy, doc.page.width - 100, 25)
        .fill();
      doc.restore();

      doc.font("Noto-Bold").fontSize(10).fillColor("#1a1a1a");
      columns.forEach(col => {
        doc.text(col.label, col.x, yy + 7, { width: col.w });
      });

      yy += 25;
      drawLine(doc, yy);
      yy += 12;

      // Data rows
      doc.font("Noto").fontSize(9).fillColor("#333333");

      rows.forEach((row, index) => {
        // Check if we need a new page
        if (yy > 720) {
          doc.addPage();
          yy = 50;

          // Repeat header on new page
          doc.save();
          doc.fillColor("#e9ecef")
            .rect(50, yy, doc.page.width - 100, 25)
            .fill();
          doc.restore();

          doc.font("Noto-Bold").fontSize(10).fillColor("#1a1a1a");
          columns.forEach(col => {
            doc.text(col.label, col.x, yy + 7, { width: col.w });
          });

          yy += 25;
          drawLine(doc, yy);
          yy += 12;
          doc.font("Noto").fontSize(9).fillColor("#333333");
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.save();
          doc.fillColor("#f8f9fa")
            .rect(50, yy - 5, doc.page.width - 100, 20)
            .fill();
          doc.restore();
        }

        columns.forEach(col => {
          let val = row[col.key] ?? "";

          if (col.format === "currency") {
            val = "₹" + formatCurrency(val);
          } else if (col.format === "date") {
            val = new Date(val).toLocaleDateString("en-IN");
          } else if (col.format === "percentage") {
            val = parseFloat(val).toFixed(2) + "%";
          }

          // Truncate long text
          const text = String(val).substring(0, 50);
          doc.text(text, col.x, yy, { width: col.w, ellipsis: true });
        });

        yy += 20;
      });

      doc.moveDown(2);
    };

    // =====================================================
    // REVENUE SECTION
    // =====================================================
    if (revenueData.revenues && revenueData.revenues.length > 0) {
      renderTable("Revenue Report", revenueData.revenues, [
        { label: "Date", key: "RevenueDate", x: 50, w: 90, format: "date" },
        { label: "Amount", key: "Amount", x: 145, w: 90, format: "currency" },
        { label: "Client", key: "ClientName", x: 240, w: 140 },
        { label: "Source", key: "Source", x: 385, w: 150 },
      ]);
    }

    // =====================================================
    // EXPENSES SECTION
    // =====================================================
    if (expensesData.expenses && expensesData.expenses.length > 0) {
      renderTable("Expenses Report", expensesData.expenses, [
        { label: "Date", key: "ExpenseDate", x: 50, w: 90, format: "date" },
        { label: "Amount", key: "Amount", x: 145, w: 90, format: "currency" },
        { label: "Type", key: "ExpenseType", x: 240, w: 120 },
        { label: "Description", key: "ExpenseTitle", x: 365, w: 170 },
      ]);
    }

    // =====================================================
    // ORDERS SECTION
    // =====================================================
    if (ordersData.orders && ordersData.orders.length > 0) {
      renderTable("Orders Report", ordersData.orders, [
        { label: "Client", key: "ClientName", x: 50, w: 140 },
        { label: "Service", key: "ServiceTitle", x: 195, w: 150 },
        { label: "Amount", key: "Amount", x: 350, w: 90, format: "currency" },
        { label: "Status", key: "PaymentStatus", x: 445, w: 90 },
      ]);
    }

    // =====================================================
    // PURCHASES / PROFIT SECTION
    // =====================================================
    if (purchasesData.purchases && purchasesData.purchases.length > 0) {
      renderTable("Purchases & Profit Report", purchasesData.purchases, [
        { label: "Client", key: "ClientName", x: 50, w: 110 },
        { label: "Revenue", key: "OrderAmount", x: 165, w: 85, format: "currency" },
        { label: "Expenses", key: "TotalExpense", x: 255, w: 85, format: "currency" },
        { label: "Profit", key: "Profit", x: 345, w: 85, format: "currency" },
        { label: "Margin %", key: "profitMargin", x: 435, w: 75, format: "percentage" },
      ]);
    }

    // =====================================================
    // FOOTER WITH PAGE NUMBERS
    // =====================================================
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.save();
      doc.strokeColor("#cccccc")
        .moveTo(50, doc.page.height - 60)
        .lineTo(doc.page.width - 50, doc.page.height - 60)
        .stroke();
      doc.restore();

      // Page number
      doc.font("Noto").fontSize(9).fillColor("#666666")
        .text(
          `Page ${i + 1} of ${range.count}`,
          0,
          doc.page.height - 40,
          { align: "center" }
        );
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });

  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    throw error;
  }
};

// ================== ANNUAL REPORT (IMPROVED) ==================

export const generateAnnualReportPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = path.join(process.cwd(), "reports");
      if (!fs.existsSync(reportsDir)) 
        fs.mkdirSync(reportsDir, { recursive: true });

      const filePath = path.join(reportsDir, `Annual_Report_${data.year}.pdf`);
      const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      registerFonts(doc);

      let y = 50;

      // ================== COMPANY HEADER ==================
      doc.font("Noto-Bold").fontSize(18).fillColor("#1a1a1a")
        .text("Digitos It Solutions Pvt Ltd", 50, y, { align: "right" });

      y += 25;

      doc.font("Noto").fontSize(10).fillColor("#666666")
        .text("Hudco Colony", 50, y, { align: "right" })
        .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 12, { align: "right" })
        .text("Phone: +91 98765 43210", 50, y + 24, { align: "right" })
        .text("Email: info@digitositsolutions.com", 50, y + 36, { align: "right" })
        .text("GSTIN: 27ABCDE1234F1Z5", 50, y + 48, { align: "right" });

      y += 80;

      // ================== TITLE ==================
      doc.font("Noto-Bold").fontSize(24).fillColor("#1a1a1a")
        .text(`Annual Report - ${data.year}`, 50, y, { align: "center" });

      y += 40;
      drawLine(doc, y);
      y += 30;

      // ================== WATERMARK ==================
      const logoPath = path.join(process.cwd(), "logo", "RGB.png");
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.opacity(0.08);
        doc.image(logoPath, 
          (doc.page.width - 400) / 2,
          (doc.page.height - 400) / 2,
          { width: 400 }
        );
        doc.restore();
      }

      // ================== SUMMARY SECTION ==================
      doc.font("Noto-Bold").fontSize(16).fillColor("#1a1a1a")
        .text("Annual Summary", 50, y);

      y += 20;

      const summaryBoxY = y;
      doc.save();
      doc.fillColor("#f8f9fa")
        .rect(50, summaryBoxY, doc.page.width - 100, 90)
        .fill();
      doc.restore();

      y += 15;

      doc.font("Noto").fontSize(11).fillColor("#1a1a1a");
      doc.text("Total Revenue:", 70, y);
      doc.font("Noto-Bold").text(`₹${formatCurrency(data.totals.revenue)}`, 200, y);

      y += 20;
      doc.font("Noto").text("Total Expenses:", 70, y);
      doc.font("Noto-Bold").text(`₹${formatCurrency(data.totals.expenses)}`, 200, y);

      y -= 20;
      doc.font("Noto").text("Total Profit:", 320, y);
      doc.font("Noto-Bold").fillColor(data.totals.profit >= 0 ? "#28a745" : "#dc3545")
        .text(`₹${formatCurrency(data.totals.profit)}`, 450, y);

      y += 20;
      doc.font("Noto").fillColor("#1a1a1a").text("Total Orders:", 320, y);
      doc.font("Noto-Bold").text(`${data.totals.orders}`, 450, y);

      y += 35;
      drawLine(doc, y);
      y += 30;

      // ================== MONTHLY BREAKDOWN ==================
      doc.font("Noto-Bold").fontSize(16).fillColor("#1a1a1a")
        .text("Monthly Revenue Breakdown", 50, y);

      y += 20;

      // Table header
      doc.save();
      doc.fillColor("#e9ecef")
        .rect(50, y, doc.page.width - 100, 25)
        .fill();
      doc.restore();

      doc.font("Noto-Bold").fontSize(11).fillColor("#1a1a1a");
      doc.text("Month", 70, y + 7);
      doc.text("Revenue", 350, y + 7);

      y += 25;
      drawLine(doc, y);
      y += 15;

      // Table rows
      doc.font("Noto").fontSize(10).fillColor("#333333");

      data.monthlyBreakdown.forEach((month, index) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }

        const monthName = new Date(data.year, month._id - 1, 1)
          .toLocaleString("en", { month: "long" });

        // Alternate row background
        if (index % 2 === 0) {
          doc.save();
          doc.fillColor("#f8f9fa")
            .rect(50, y - 5, doc.page.width - 100, 22)
            .fill();
          doc.restore();
        }

        doc.text(monthName, 70, y);
        doc.text(`₹${formatCurrency(month.total)}`, 350, y);

        y += 22;
      });

      // ================== FOOTER ==================
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        doc.save();
        doc.strokeColor("#cccccc")
          .moveTo(50, doc.page.height - 60)
          .lineTo(doc.page.width - 50, doc.page.height - 60)
          .stroke();
        doc.restore();

        doc.font("Noto").fontSize(9).fillColor("#666666")
          .text(
            `Page ${i + 1} of ${range.count}`,
            0,
            doc.page.height - 40,
            { align: "center" }
          );
      }

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
};