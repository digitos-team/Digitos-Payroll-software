import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";

export const exportToPDF = (data, fileName, title = "Financial Report") => {
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  const filePath = path.join(exportDir, `${fileName}.pdf`);
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(20).text(title, { align: "center" }).moveDown();

  // Table headers
  doc.fontSize(12);
  const headers = Object.keys(data[0]);
  doc.text(headers.join(" | "), { underline: true });
  doc.moveDown(0.5);

  // Rows
  data.forEach((row) => {
    const rowData = headers.map((key) => row[key] ?? "").join(" | ");
    doc.text(rowData);
  });

  doc.end();

  return filePath;
};
