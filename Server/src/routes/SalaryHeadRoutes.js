import express from "express"
import { AddSalaryHeads, DeleteSalaryHead, FetchSalaryHeads } from "../controller/SalaryHeadsController.js"




let SalaryHeadsRoutes = express.Router()



SalaryHeadsRoutes.post("/addsalaryheads", AddSalaryHeads)
SalaryHeadsRoutes.get("/getsalaryheads", FetchSalaryHeads)
SalaryHeadsRoutes.delete("/deletesalaryhead", DeleteSalaryHead)

export { SalaryHeadsRoutes }