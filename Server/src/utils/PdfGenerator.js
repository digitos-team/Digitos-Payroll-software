import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generatePDFReport = (title, data, fileName) => {
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

  const filePath = path.join(exportDir, `${fileName}.pdf`);
  const doc = new PDFDocument({ margin: 40 });

  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(20).text(title, { align: "center" }).moveDown(1);

  if (!data.length) {
    doc.text("No data available.", { align: "center" });
    doc.end();
    return filePath;
  }

  const headers = Object.keys(data[0]);
  doc.fontSize(12).text(headers.join(" | "), { underline: true });
  doc.moveDown(0.5);

  data.forEach((row) => {
    const rowData = headers.map((key) => row[key] ?? "").join(" | ");
    doc.text(rowData);
  });

  doc.moveDown(1);
  doc.fontSize(14).text(`Total Records: ${data.length}`, { align: "right" });
  doc.end();

  return filePath;
};
