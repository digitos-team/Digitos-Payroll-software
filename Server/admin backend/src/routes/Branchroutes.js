import express from "express"
import { AddBranch, DeleteBranch, getBranchByCompany, getBranchWiseMonthlyPayroll, getTotalBranches } from "../controller/BranchController.js"


let Branchroutes = express.Router()




Branchroutes.post("/addbranch", AddBranch)
Branchroutes.post("/getbranchbycompany", getBranchByCompany)
Branchroutes.delete("/deletebranch", DeleteBranch)
Branchroutes.get("/countbranches/:CompanyId", getTotalBranches);
Branchroutes.get("/getbranchwisemonthlypayroll", getBranchWiseMonthlyPayroll)

export {Branchroutes}