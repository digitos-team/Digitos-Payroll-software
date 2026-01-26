// import fs from "fs";
// import path from "path";
// import PDFDocument from "pdfkit";
// import moment from "moment";

// // Helper: draw horizontal line
// const drawLine = (doc, y, x1 = 50, x2 = 545) => {
//   doc
//     .strokeColor("#000000")
//     .lineWidth(0.5)
//     .moveTo(x1, y)
//     .lineTo(x2, y)
//     .stroke();
// };

// // Helper: Format amount without decimals
// const formatAmount = (amount) => {
//   return `₹${Math.round(amount).toLocaleString("en-IN")}`;
// };

// // Helper: Register Noto Sans fonts
// const registerFonts = (doc) => {
//   const fontPath = path.join(process.cwd(), "fonts");

//   doc.registerFont("NotoSans", path.join(fontPath, "NotoSans-Regular.ttf"));
//   doc.registerFont("NotoSans-Bold", path.join(fontPath, "NotoSans-Bold.ttf"));
// };

// // ==================== PROFORMA INVOICE ====================
// export const generateOrderInvoice = (order) => {
//   return new Promise((resolve, reject) => {
//     const exportDir = path.join(process.cwd(), "exports");
//     if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

//     const filePath = path.join(exportDir, `invoice_${order._id}.pdf`);
//     const stream = fs.createWriteStream(filePath);

//     const doc = new PDFDocument({ margin: 50, size: "A4" });
//     doc.pipe(stream);

//     registerFonts(doc);

//     let y = 50;

//     // BIG INVOICE TITLE AT TOP
//     doc
//       .font("NotoSans-Bold")
//       .fontSize(28)
//       .fillColor("#556B2F")
//       .text("TAX INVOICE", 50, y);
//     doc.fillColor("#000000"); // Reset to black

//     y += 45; // Move down after INVOICE title

//     // LEFT COMPANY DETAILS
//     doc
//       .font("NotoSans-Bold")
//       .fontSize(14)
//       .text("Digitos It Solutions Pvt Ltd", 50, y);
//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .text("Hudco Colony", 50, y + 18)
//       .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 30)
//       .text("Phone : +91 7620195100", 50, y + 42)
//       .text("Email : support@digitositsolutionpvtltd.com", 50, y + 54)
//       .text("GSTIN : 27AAKCD9025H1ZG", 50, y + 66);

//     // RIGHT SECTION (Bill To + Details) with Red Background
//     doc.rect(350, y - 5, 80, 25).fillAndStroke("#DC3545", "#DC3545");
//     doc
//       .font("NotoSans-Bold")
//       .fontSize(16)
//       .fillColor("#FFFFFF")
//       .text("Bill To", 358, y);
//     doc.fillColor("#000000"); // Reset to black for remaining text

//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .text("Invoice Number :", 350, y + 35)
//       .text(order.OrderNumber || order._id.toString().slice(-4), 445, y + 35, {
//         width: 200,
//       })

//       .text("Customer Name :", 350, y + 50)
//       .text(order.ClientName, 445, y + 50, { width: 200 })

//       .text("Customer Add :", 350, y + 65)
//       .text(order.ClientState || "N/A", 445, y + 65, { width: 200 })

//       .text("Date :", 350, y + 80)
//       .text(moment(order.createdAt).format("DD MMMM YYYY"), 445, y + 80, {
//         width: 200,
//       });

//     y += 120;

//     // TABLE HEADER
//     drawLine(doc, y);
//     y += 10;

//     doc
//       .font("NotoSans-Bold")
//       .fontSize(11)
//       .text("Description", 50, y)
//       .text("HNC", 200, y)
//       .text("Quantity", 270, y)
//       .text("Unit Price", 360, y)
//       .text("Total", 470, y);

//     y += 15;
//     drawLine(doc, y);
//     y += 20;

//     const descStartY = y;

//     // DESCRIPTION
//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .text(order.ServiceTitle, 50, y, { width: 140 });

//     y += 15;

//     if (order.ServiceDescription && order.ServiceDescription.trim() !== "") {
//       doc
//         .fontSize(9)
//         .fillColor("#555")
//         .text(order.ServiceDescription, 50, y, { width: 140 });
//       y += 35;
//     } else {
//       y += 10;
//     }

//     // VALUE ALIGNMENT (Perfect Under Headers)
//     const valueY = descStartY + 5;

//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .fillColor("#000")
//       .text(order.HSNCode || "998314", 200, valueY) // HSN Code from frontend
//       .text("1", 270, valueY)

//       // **************************************************
//       // ✅ FIX APPLIED: UNIT PRICE == TOTAL PRICE
//       // **************************************************
//       .text(formatAmount(order.BaseAmount), 360, valueY)
//       .text(formatAmount(order.BaseAmount), 470, valueY);

//     y += 40;

//     // WATERMARK
//     const logoPath = path.resolve("logo/RGB.png");
//     if (fs.existsSync(logoPath)) {
//       doc.save();
//       doc.opacity(0.4);
//       doc.image(logoPath, 125, descStartY - 10, { width: 350 });
//       doc.restore();
//     }

//     // SUBTOTAL + TOTAL
//     y += 60;
//     console.log(formatAmount(order.amount));

//     // Calculate GST at 18% of BaseAmount
//     const gstAmount = order.BaseAmount * 0.18;

//     doc
//       .font("NotoSans")
//       .fontSize(11)
//       .text("GST(18%)", 360, y)
//       .text(": " + formatAmount(gstAmount), 470, y);

//     y += 25;

//     doc
//       .font("NotoSans-Bold")
//       .fontSize(12)
//       .text("Total Amount Due :", 330, y)
//       .text(formatAmount(order.Amount), 470, y);

//     y += 15;

//     drawLine(doc, y, 50, 545);

//     y += 35;

//     // PAYMENT TERMS - 50% Advance and 50% After Delivery
//     const advanceAmount = order.Amount / 2; // Calculate 50% of total
//     const advance = formatAmount(advanceAmount);
//     const remaining = formatAmount(order.Amount - advanceAmount); // Remaining 50%

//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .text(`Delivery Time : ${order.DeliveryDays || "10"} Days`, 50, y);

//     y += 20;

//     doc.text(
//       `Payment Terms : ${advance} Advance and ${remaining} After Delivery `,
//       50,
//       y
//     );

//     y += 20;

//     doc.text("Payment Methods : Check, Credit Card, or Bank Transfer", 50, y);

//     y += 30;

//     // BANK DETAILS SECTION
//     doc
//       .font("NotoSans-Bold")
//       .fontSize(11)
//       .text("Bank Details for Payment:", 50, y);
//     y += 18;

//     doc
//       .font("NotoSans")
//       .fontSize(10)
//       .text(`Bank Name : ${process.env.BANK_NAME || "Axis Bank"}`, 50, y)
//       .text(
//         `Account Number : ${
//           process.env.BANK_ACCOUNT_NUMBER || "924020022246773"
//         }`,
//         50,
//         y + 14
//       )
//       .text(
//         `IFSC Code : ${process.env.BANK_IFSC_CODE || "UTIB0000165"}`,
//         50,
//         y + 28
//       )
//       .text(
//         `Account Name : ${
//           process.env.BANK_ACCOUNT_NAME ||
//           "DIGITOS IT SOLUTIONS PRIVATE LIMITED"
//         }`,
//         50,
//         y + 42
//       );

//     y += 65;

//     doc.font("NotoSans-Bold").text("Thank you for your business!", 50, y);

//     // FOOTER MESSAGE
//     doc
//       .font("NotoSans")
//       .fontSize(9)
//       .text("Please contact us if you have", 380, 750)
//       .text("any questions regarding this", 380, 762)
//       .text("invoice.", 380, 774);

//     doc.end();

//     stream.on("finish", () => resolve(filePath));
//     stream.on("error", reject);
//   });
// };
// // ==================== FINAL BILL / TAX INVOICE ====================
// export const generateFinalBill = (order) => {
//   return new Promise((resolve, reject) => {
//     const exportDir = path.join(process.cwd(), "exports");
//     if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

//     const filePath = path.join(exportDir, `final_bill_${order._id}.pdf`);
//     const stream = fs.createWriteStream(filePath);

//     const doc = new PDFDocument({ margin: 50, size: "A4" });
//     doc.pipe(stream);

//     registerFonts(doc);

//     let yPosition = 60;

//     // ===== COMPANY HEADER - RIGHT ALIGNED =====
//     const companyName =
//       order.CompanyId?.CompanyName || "Digitos It Solutions Pvt Ltd";
//     const companyGST = order.CompanyId?.GstNumber || "27ABCDE1234F1Z5";
//     const companyState = order.CompanyId?.CompanyState || "Maharashtra";

//     doc
//       .fontSize(16)
//       .font("NotoSans-Bold")
//       .fillColor("#000000")
//       .text(companyName, 300, yPosition, { align: "right" });

//     yPosition += 20;

//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .text("Hudco Colony", 300, yPosition, { align: "right" })
//       .text(`Chhatrapati Sambhajinagar, ${companyState}`, 300, yPosition + 14, {
//         align: "right",
//       })
//       .text("Phone: +91 98765 43210", 300, yPosition + 28, { align: "right" })
//       .text("Email: info@digitositsolutions.com", 300, yPosition + 42, {
//         align: "right",
//       })
//       .text(`GSTIN: ${companyGST}`, 300, yPosition + 56, { align: "right" });

//     yPosition += 85;

//     // ===== TAX INVOICE TITLE =====
//     doc
//       .fontSize(20)
//       .font("NotoSans-Bold")
//       .text("TAX INVOICE", 50, yPosition, { width: 300 });

//     // ===== PAID IN FULL BADGE =====
//     doc.rect(400, yPosition - 5, 145, 30).fillAndStroke("#4CAF50", "#4CAF50");

//     doc
//       .fontSize(14)
//       .font("NotoSans-Bold")
//       .fillColor("#FFFFFF")
//       .text("PAID IN FULL", 410, yPosition + 3);

//     yPosition += 45;

//     // ===== LEFT COLUMN - INVOICE DETAILS =====
//     doc
//       .fontSize(11)
//       .font("NotoSans-Bold")
//       .fillColor("#000000")
//       .text("Invoice Details:", 50, yPosition);

//     yPosition += 20;

//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .text(
//         `Invoice No: ${
//           order.TaxInvoiceNumber || order._id.toString().slice(-8).toUpperCase()
//         }`,
//         50,
//         yPosition
//       )
//       .text(
//         `Issue Date: ${moment(order.createdAt).format("DD MMM YYYY")}`,
//         50,
//         yPosition + 15
//       )
//       .text(
//         `Completion Date: ${moment(order.updatedAt).format("DD MMM YYYY")}`,
//         50,
//         yPosition + 30
//       );

//     // ===== RIGHT COLUMN - CLIENT DETAILS =====
//     const clientY = yPosition;

//     doc
//       .fontSize(11)
//       .font("NotoSans-Bold")
//       .text("Bill To:", 320, clientY, { align: "right" });

//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .text(order.ClientName, 320, clientY + 20, { align: "right" })
//       .text(order.ClientEmail || "N/A", 320, clientY + 35, { align: "right" })
//       .text(order.ClientPhone || "N/A", 320, clientY + 50, { align: "right" });

//     let clientEndY = clientY + 65;

//     if (order.ClientGSTIN) {
//       doc.text(`GSTIN: ${order.ClientGSTIN}`, 320, clientEndY, {
//         align: "right",
//       });
//       clientEndY += 15;
//     }
//     if (order.ClientState) {
//       doc.text(`State: ${order.ClientState}`, 320, clientEndY, {
//         align: "right",
//       });
//       clientEndY += 15;
//     }

//     yPosition = Math.max(yPosition + 50, clientEndY + 10);
//     drawLine(doc, yPosition);
//     yPosition += 20;

//     // ===== TABLE HEADER =====
//     doc
//       .fontSize(11)
//       .font("NotoSans-Bold")
//       .text("Description", 50, yPosition)
//       .text("HSN/SAC", 240, yPosition, { width: 60, align: "center" })
//       .text("Qty", 310, yPosition, { width: 40, align: "center" })
//       .text("Rate", 360, yPosition, { width: 80, align: "right" })
//       .text("Amount", 460, yPosition, { width: 85, align: "right" });

//     yPosition += 20;
//     drawLine(doc, yPosition);
//     yPosition += 20;

//     // ===== SERVICE ROW =====
//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .text(order.ServiceTitle, 50, yPosition, { width: 180 })
//       .text(order.HSNCode || "998314", 240, yPosition, {
//         width: 60,
//         align: "center",
//       })
//       .text("1", 310, yPosition, { width: 40, align: "center" })
//       .text(formatAmount(order.BaseAmount), 360, yPosition, {
//         width: 80,
//         align: "right",
//       })
//       .text(formatAmount(order.BaseAmount), 460, yPosition, {
//         width: 85,
//         align: "right",
//       });

//     yPosition += 25;
//     yPosition += 10;
//     drawLine(doc, yPosition);
//     yPosition += 25;

//     // ===== PERFECT CENTER WATERMARK (between table & TOTAL PAID) =====
//     const taxLogo = path.resolve("logo/RGB.png");

//     // Calculate middle position between service row end & TOTAL PAID section
//     const watermarkY = yPosition - 120; // shift slightly upward to sit between lines

//     if (fs.existsSync(taxLogo)) {
//       doc.save();
//       doc.opacity(0.2); // final recommended opacity
//       doc.image(taxLogo, 150, watermarkY, { width: 300 });
//       doc.restore();
//     }

//     // ===== GST BREAKDOWN =====
//     const summaryX = 340;

//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .fillColor("#000000")
//       .text("Taxable Amount:", summaryX, yPosition)
//       .text(formatAmount(order.BaseAmount), 480, yPosition, { align: "right" });

//     yPosition += 25;

//     if (order.IsIGST) {
//       doc
//         .fontSize(10)
//         .text(`IGST @ ${order.GSTRate}%:`, summaryX, yPosition)
//         .text(formatAmount(order.IGSTAmount), 480, yPosition, {
//           align: "right",
//         });
//       yPosition += 20;
//     } else {
//       const halfRate = order.GSTRate / 2;

//       doc
//         .fontSize(10)
//         .text(`CGST @ ${halfRate}%:`, summaryX, yPosition)
//         .text(formatAmount(order.CGSTAmount), 480, yPosition, {
//           align: "right",
//         });

//       yPosition += 20;

//       doc
//         .text(`SGST @ ${halfRate}%:`, summaryX, yPosition)
//         .text(formatAmount(order.SGSTAmount), 480, yPosition, {
//           align: "right",
//         });

//       yPosition += 20;
//     }

//     drawLine(doc, yPosition, summaryX, 545);
//     yPosition += 15;

//     doc
//       .fontSize(10)
//       .font("NotoSans-Bold")
//       .text("Total GST:", summaryX, yPosition)
//       .text(formatAmount(order.TotalGSTAmount), 480, yPosition, {
//         align: "right",
//       });

//     yPosition += 25;
//     drawLine(doc, yPosition, summaryX, 545);
//     yPosition += 15;

//     // ===== TOTAL PAID =====
//     doc
//       .fontSize(12)
//       .font("NotoSans-Bold")
//       .text("TOTAL PAID:", summaryX, yPosition)
//       .text(formatAmount(order.Amount), 480, yPosition, { align: "right" });

//     yPosition += 35;
//     drawLine(doc, yPosition);
//     yPosition += 25;

//     doc
//       .fontSize(11)
//       .font("NotoSans-Bold")
//       .fillColor("#4CAF50")
//       .text("Service Completed Successfully", 50, yPosition);

//     yPosition += 20;

//     doc
//       .fontSize(10)
//       .font("NotoSans")
//       .fillColor("#000000")
//       .text(
//         "This Tax Invoice confirms full payment received and service completion.",
//         50,
//         yPosition
//       );

//     // ===== FOOTER =====
//     const footerY = 720;
//     drawLine(doc, footerY);

//     doc
//       .fontSize(9)
//       .font("NotoSans")
//       .fillColor("#000000")
//       .text(
//         "This is a computer generated Tax Invoice and requires no signature.",
//         50,
//         footerY + 10,
//         {
//           width: 495,
//           align: "center",
//         }
//       )
//       .text(
//         "For any queries, please contact us at info@digitositsolutions.com",
//         50,
//         footerY + 24,
//         {
//           width: 495,
//           align: "center",
//         }
//       );

//     yPosition = footerY + 45;

//     doc
//       .fontSize(10)
//       .font("NotoSans-Bold")
//       .text("Thank you for your trust and business!", 50, yPosition, {
//         width: 495,
//         align: "center",
//       });

//     doc.end();

//     stream.on("finish", () => resolve(filePath));
//     stream.on("error", reject);
//   });
// };
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import moment from "moment";

// Helper: draw horizontal line
const drawLine = (doc, y, x1 = 50, x2 = 545) => {
  doc
    .strokeColor("#000000")
    .lineWidth(0.5)
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke();
};

// Helper: Format amount without decimals
const formatAmount = (amount) => {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
};

// Helper: Register Noto Sans fonts
const registerFonts = (doc) => {
  const fontPath = path.join(process.cwd(), "fonts");

  doc.registerFont("NotoSans", path.join(fontPath, "NotoSans-Regular.ttf"));
  doc.registerFont("NotoSans-Bold", path.join(fontPath, "NotoSans-Bold.ttf"));
};

// ==================== PROFORMA INVOICE ====================
export const generateOrderInvoice = (order) => {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `invoice_${order._id}.pdf`);
    const stream = fs.createWriteStream(filePath);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(stream);

    registerFonts(doc);

    let y = 50;

    // BIG INVOICE TITLE AT TOP
    doc
      .font("NotoSans-Bold")
      .fontSize(28)
      .fillColor("#556B2F")
      .text("TAX INVOICE", 50, y);
    doc.fillColor("#000000"); // Reset to black

    y += 45; // Move down after INVOICE title

    // LEFT COMPANY DETAILS
    doc
      .font("NotoSans-Bold")
      .fontSize(14)
      .text("Digitos It Solutions Pvt Ltd", 50, y);
    doc
      .font("NotoSans")
      .fontSize(10)
      .text("Hudco Colony", 50, y + 18)
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 30)
      .text("Phone : +91 7620195100", 50, y + 42)
      .text("Email : support@digitositsolutionpvtltd.com", 50, y + 54)
      .text("GSTIN : 27AAKCD9025H1ZG", 50, y + 66);

    // RIGHT SECTION (Bill To + Details) with Red Background
    doc.rect(350, y - 5, 80, 25).fillAndStroke("#DC3545", "#DC3545");
    doc
      .font("NotoSans-Bold")
      .fontSize(16)
      .fillColor("#FFFFFF")
      .text("Bill To", 358, y);
    doc.fillColor("#000000"); // Reset to black for remaining text

    doc
      .font("NotoSans")
      .fontSize(10)
      .text("Invoice Number :", 350, y + 35)
      .text(order.OrderNumber || order._id.toString().slice(-4), 445, y + 35, {
        width: 200,
      })

      .text("Customer Name :", 350, y + 50)
      .text(order.ClientName, 445, y + 50, { width: 200 })

      .text("Customer Add :", 350, y + 65)
      .text(order.ClientState || "N/A", 445, y + 65, { width: 200 })

      .text("Date :", 350, y + 80)
      .text(moment(order.createdAt).format("DD MMMM YYYY"), 445, y + 80, {
        width: 200,
      });

    y += 120;

    // TABLE HEADER
    drawLine(doc, y);
    y += 10;

    doc
      .font("NotoSans-Bold")
      .fontSize(11)
      .text("Description", 50, y)
      .text("HNC", 200, y)
      .text("Quantity", 270, y)
      .text("Unit Price", 360, y)
      .text("Total", 470, y);

    y += 15;
    drawLine(doc, y);
    y += 20;

    const descStartY = y;

    // DESCRIPTION
    doc
      .font("NotoSans")
      .fontSize(10)
      .text(order.ServiceTitle, 50, y, { width: 140 });

    y += 15;

    if (order.ServiceDescription && order.ServiceDescription.trim() !== "") {
      doc
        .fontSize(9)
        .fillColor("#555")
        .text(order.ServiceDescription, 50, y, { width: 140 });
      y += 35;
    } else {
      y += 10;
    }

    // VALUE ALIGNMENT (Perfect Under Headers)
    const valueY = descStartY + 5;

    doc
      .font("NotoSans")
      .fontSize(10)
      .fillColor("#000")
      .text(order.HSNCode || "998314", 200, valueY) // HSN Code from frontend
      .text("1", 270, valueY)

      // **************************************************
      // ✅ FIX APPLIED: UNIT PRICE == TOTAL PRICE
      // **************************************************
      .text(formatAmount(order.BaseAmount), 360, valueY)
      .text(formatAmount(order.BaseAmount), 470, valueY);

    y += 40;

    // WATERMARK
    const logoPath = path.resolve("logo/RGB.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.4);
      doc.image(logoPath, 125, descStartY - 10, { width: 350 });
      doc.restore();
    }

    // SUBTOTAL + TOTAL
    y += 60;
    console.log(formatAmount(order.amount));

    // Calculate GST at 18% of BaseAmount
    const gstAmount = order.BaseAmount * 0.18;

    doc
      .font("NotoSans")
      .fontSize(11)
      .text("GST(18%)", 360, y)
      .text(": " + formatAmount(gstAmount), 470, y);

    y += 25;

    doc
      .font("NotoSans-Bold")
      .fontSize(12)
      .text("Total Amount Due :", 330, y)
      .text(formatAmount(order.Amount), 470, y);

    y += 15;

    drawLine(doc, y, 50, 545);

    y += 35;

    // PAYMENT TERMS - 50% Advance and 50% After Delivery
    const advanceAmount = order.Amount / 2; // Calculate 50% of total
    const advance = formatAmount(advanceAmount);
    const remaining = formatAmount(order.Amount - advanceAmount); // Remaining 50%

    doc
      .font("NotoSans")
      .fontSize(10)
      .text(`Delivery Time : ${order.DeliveryDays || "10"} Days`, 50, y);

    y += 20;

    doc.text(
      `Payment Terms : ${advance} Advance and ${remaining} After Delivery `,
      50,
      y
    );

    y += 20;

    doc.text("Payment Methods : Check, Credit Card, or Bank Transfer", 50, y);

    y += 30;

    // BANK DETAILS SECTION
    doc
      .font("NotoSans-Bold")
      .fontSize(11)
      .text("Bank Details for Payment:", 50, y);
    y += 18;

    doc
      .font("NotoSans")
      .fontSize(10)
      .text(`Bank Name : ${process.env.BANK_NAME || "Axis Bank"}`, 50, y)
      .text(
        `Account Number : ${
          process.env.BANK_ACCOUNT_NUMBER || "924020022246773"
        }`,
        50,
        y + 14
      )
      .text(
        `IFSC Code : ${process.env.BANK_IFSC_CODE || "UTIB0000165"}`,
        50,
        y + 28
      )
      .text(
        `Account Name : ${
          process.env.BANK_ACCOUNT_NAME ||
          "DIGITOS IT SOLUTIONS PRIVATE LIMITED"
        }`,
        50,
        y + 42
      );

    y += 65;

    doc.font("NotoSans-Bold").text("Thank you for your business!", 50, y);

    // FOOTER MESSAGE
    doc
      .font("NotoSans")
      .fontSize(9)
      .text("Please contact us if you have", 380, 750)
      .text("any questions regarding this", 380, 762)
      .text("invoice.", 380, 774);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

// ==================== FINAL BILL / TAX INVOICE (SAME DESIGN AS ORDER INVOICE) ====================
export const generateFinalBill = (order) => {
  return new Promise((resolve, reject) => {
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filePath = path.join(exportDir, `final_bill_${order._id}.pdf`);
    const stream = fs.createWriteStream(filePath);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(stream);

    registerFonts(doc);

    let y = 50;

    // BIG INVOICE TITLE AT TOP
    doc
      .font("NotoSans-Bold")
      .fontSize(28)
      .fillColor("#556B2F")
      .text("TAX INVOICE", 50, y);
    doc.fillColor("#000000"); // Reset to black

    y += 45; // Move down after INVOICE title

    // LEFT COMPANY DETAILS
    doc
      .font("NotoSans-Bold")
      .fontSize(14)
      .text("Digitos It Solutions Pvt Ltd", 50, y);
    doc
      .font("NotoSans")
      .fontSize(10)
      .text("Hudco Colony", 50, y + 18)
      .text("Chhatrapati Sambhajinagar, Maharashtra", 50, y + 30)
      .text("Phone : +91 7620195100", 50, y + 42)
      .text("Email : support@digitositsolutionpvtltd.com", 50, y + 54)
      .text("GSTIN : 27AAKCD9025H1ZG", 50, y + 66);

    // RIGHT SECTION (Bill To + Details) with Red Background
  // RIGHT SECTION (Bill To + Details) with Green Background for PAID
doc.rect(350, y - 5, 95, 25).fillAndStroke("#4CAF50", "#4CAF50"); // Increased width to 95
doc
  .font("NotoSans-Bold")
  .fontSize(14) // Reduced from 16 to fit better
  .fillColor("#FFFFFF")
  .text("PAID IN FULL", 355, y + 4); // Adjusted position and size
doc.fillColor("#000000"); // Reset to black for remaining text


    doc
      .font("NotoSans")
      .fontSize(10)
      .text("Invoice Number :", 350, y + 35)
      .text(order.TaxInvoiceNumber || order.OrderNumber || order._id.toString().slice(-4), 445, y + 35, {
        width: 200,
      })

      .text("Customer Name :", 350, y + 50)
      .text(order.ClientName, 445, y + 50, { width: 200 })

      .text("Customer Add :", 350, y + 65)
      .text(order.ClientState || "N/A", 445, y + 65, { width: 200 })

      .text("Date :", 350, y + 80)
      .text(moment(order.updatedAt || order.createdAt).format("DD MMMM YYYY"), 445, y + 80, { // Use updatedAt for completion
        width: 200,
      });

    y += 120;

    // TABLE HEADER
    drawLine(doc, y);
    y += 10;

    doc
      .font("NotoSans-Bold")
      .fontSize(11)
      .text("Description", 50, y)
      .text("HNC", 200, y)
      .text("Quantity", 270, y)
      .text("Unit Price", 360, y)
      .text("Total", 470, y);

    y += 15;
    drawLine(doc, y);
    y += 20;

    const descStartY = y;

    // DESCRIPTION
    doc
      .font("NotoSans")
      .fontSize(10)
      .text(order.ServiceTitle, 50, y, { width: 140 });

    y += 15;

    if (order.ServiceDescription && order.ServiceDescription.trim() !== "") {
      doc
        .fontSize(9)
        .fillColor("#555")
        .text(order.ServiceDescription, 50, y, { width: 140 });
      y += 35;
    } else {
      y += 10;
    }

    // VALUE ALIGNMENT (Perfect Under Headers)
    const valueY = descStartY + 5;

    doc
      .font("NotoSans")
      .fontSize(10)
      .fillColor("#000")
      .text(order.HSNCode || "998314", 200, valueY)
      .text("1", 270, valueY)
      .text(formatAmount(order.BaseAmount), 360, valueY)
      .text(formatAmount(order.BaseAmount), 470, valueY);

    y += 40;

    // WATERMARK
    const logoPath = path.resolve("logo/RGB.png");
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.4);
      doc.image(logoPath, 125, descStartY - 10, { width: 350 });
      doc.restore();
    }

    // SUBTOTAL + TOTAL
    y += 60;

    // Calculate GST at 18% of BaseAmount
    const gstAmount = order.BaseAmount * 0.18;

    doc
      .font("NotoSans")
      .fontSize(11)
      .text("GST(18%)", 360, y)
      .text(": " + formatAmount(gstAmount), 470, y);

    y += 25;

    doc
      .font("NotoSans-Bold")
      .fontSize(12)
      .text("Total Amount Paid :", 330, y) // Changed to "Paid"
      .text(formatAmount(order.Amount), 470, y);

    y += 15;

    drawLine(doc, y, 50, 545);

    y += 35;

    // COMPLETION TERMS (instead of payment terms)
    doc
      .font("NotoSans")
      .fontSize(10)
      .text(`Service Completed : ${moment(order.updatedAt || order.createdAt).format("DD MMMM YYYY")}`, 50, y);

    y += 20;

    doc.text("Status : Service Delivered & Payment Received", 50, y);

    y += 20;

    doc.text("Payment Methods : Check, Credit Card, or Bank Transfer", 50, y);

    y += 30;

    // BANK DETAILS SECTION
    doc
      .font("NotoSans-Bold")
      .fontSize(11)
      .text("Bank Details (Reference):", 50, y);
    y += 18;

    doc
      .font("NotoSans")
      .fontSize(10)
      .text(`Bank Name : ${process.env.BANK_NAME || "Axis Bank"}`, 50, y)
      .text(
        `Account Number : ${
          process.env.BANK_ACCOUNT_NUMBER || "924020022246773"
        }`,
        50,
        y + 14
      )
      .text(
        `IFSC Code : ${process.env.BANK_IFSC_CODE || "UTIB0000165"}`,
        50,
        y + 28
      )
      .text(
        `Account Name : ${
          process.env.BANK_ACCOUNT_NAME ||
          "DIGITOS IT SOLUTIONS PRIVATE LIMITED"
        }`,
        50,
        y + 42
      );

    y += 65;

    doc.font("NotoSans-Bold").text("Thank you for your business!", 50, y);

    // FOOTER MESSAGE
    doc
      .font("NotoSans")
      .fontSize(9)
      .text("Service completed successfully.", 380, 750)
      .text("This is a computer generated invoice.", 380, 762)
      .text("No signature required.", 380, 774);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
