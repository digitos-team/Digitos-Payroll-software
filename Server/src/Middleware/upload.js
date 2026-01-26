import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage: imageStorage });

// Accept any single file from the multipart form-data and normalize to req.file
// This helps avoid Multer 'Unexpected field' errors when frontends use different field names.
export const acceptAnyFile = (req, res, next) => {
  const anyMiddleware = upload.any();
  anyMiddleware(req, res, (err) => {
    if (err) return next(err);
    // Debug: log incoming file fields to help diagnose Unexpected field issues
    try {
      if (req.files && req.files.length) {
        console.log(
          "acceptAnyFile: received files:",
          req.files.map((f) => ({
            field: f.fieldname,
            originalname: f.originalname,
          }))
        );
      } else {
        // If body contains other file-like data, log keys
        console.log(
          "acceptAnyFile: no files uploaded. req.body keys:",
          Object.keys(req.body || {})
        );
      }
    } catch (logErr) {
      console.error("acceptAnyFile logging error:", logErr);
    }

    // If multer populated req.files, normalize first file to req.file for compatibility
    if (req.files && req.files.length) {
      // Build a mapping like multer.fields would provide: req.filesByField and also set req.files[fieldName]
      const filesByField = {};
      for (const f of req.files) {
        if (!filesByField[f.fieldname]) filesByField[f.fieldname] = [];
        filesByField[f.fieldname].push(f);
      }
      // Attach mapped structure for backward compatibility (controllers expect req.files.FieldName)
      // Provide both original keys and common Aadhaar/Adhaar alias for compatibility
      for (const key of Object.keys(filesByField)) {
        req.files[key] = filesByField[key];
      }
      // Alias common misspelling: if client sent 'AdhaarCard' expose it as 'AadhaarCard' as well
      if (filesByField["AdhaarCard"] && !req.files["AadhaarCard"]) {
        req.files["AadhaarCard"] = filesByField["AdhaarCard"];
      }
      if (filesByField["AadhaarCard"] && !req.files["AdhaarCard"]) {
        req.files["AdhaarCard"] = filesByField["AadhaarCard"];
      }

      // Also normalize single file to req.file
      if (!req.file) req.file = req.files[0];
    }

    next();
  });
};
