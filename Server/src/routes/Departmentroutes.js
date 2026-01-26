import express from "express"
import { addDepartment, deleteDepartment, getDepartmentsByCompany, countDepartmentsByCompany } from "../controller/DepartmentController.js"


let Departmentroutes = express.Router()



Departmentroutes.delete("/deletedepartment/:DepartmentId", deleteDepartment)
Departmentroutes.post("/getdepartment", getDepartmentsByCompany)

Departmentroutes.post("/adddepartment", addDepartment)
Departmentroutes.get("/countdepartment/:CompanyId", countDepartmentsByCompany)
export { Departmentroutes }