import express from "express";

import {
  addDesignation,
  deleteDesignation,
  getDesignationsByCompany,
} from "../controller/DesignationController.js";

let DesignationRoutes = express.Router();


DesignationRoutes.delete("/deletedesignation/:id", deleteDesignation);
DesignationRoutes.delete("/deletedesignation", deleteDesignation);
DesignationRoutes.post("/getdesignationbycompany", getDesignationsByCompany);

DesignationRoutes.post("/add-designation", addDesignation);

export { DesignationRoutes };
