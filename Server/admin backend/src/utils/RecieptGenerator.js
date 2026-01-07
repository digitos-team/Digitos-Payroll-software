import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import moment from "moment";

export const generateReceipt = (delivery) => {
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

  const filePath = path.join(exportDir, `receipt_${delivery._id}.pdf`);
  const doc = new PDFDocument({ margin: 40 });

  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(18).text("Delivery Receipt", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(12);
  doc.text(`Receipt ID: ${delivery._id}`);
  doc.text(`Date: ${moment().format("YYYY-MM-DD")}`);
  doc.text(`Client: ${delivery.ClientName}`);
  doc.text(`Delivered To: ${delivery.Address}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Delivered Items:", { underline: true });
  delivery.items.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.name} - Qty: ${item.quantity}`);
  });

  doc.moveDown(1);
  doc.text(`Total Value: ₹${delivery.total}`, { align: "right" });
  doc.text("Received in good condition.", { align: "center" });
  doc.end();

  return filePath;
};
