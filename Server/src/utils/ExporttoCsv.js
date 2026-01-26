// utils/exportToCSV.js
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";

export const exportToCSV = (data, filePrefix) => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Create 'exports' folder if not exists
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Prepare CSV data
  const fields = Object.keys(data[0]._doc || data[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  const filePath = path.join(exportDir, `${filePrefix}_${Date.now()}.csv`);
  fs.writeFileSync(filePath, csv);

  return filePath;
};
