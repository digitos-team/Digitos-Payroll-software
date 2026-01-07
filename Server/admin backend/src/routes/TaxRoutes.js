import express from "express";
import {
  addTaxSlab,
  deleteTaxSlab,
  getTaxSlabs,
  updateTaxSlab,
} from "../controller/TasxSlabController.js";

const TaxRoutes = express.Router();

// ➕ Add a new tax slab
TaxRoutes.post("/addtaxslab", addTaxSlab);

// 📜 Get all tax slabs (optionally by CompanyId using query param)
TaxRoutes.get("/gettaxslab", getTaxSlabs);

// ✏️ Update a tax slab
TaxRoutes.put("/updatetaxslab", updateTaxSlab);

// ❌ Delete a tax slab
TaxRoutes.delete("/deletetaxslab", deleteTaxSlab);

export { TaxRoutes };
