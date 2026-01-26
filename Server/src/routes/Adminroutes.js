import express from "express"
import { fetchDetails, registerAdmin, updateCompany, changeCompanyPassword } from "../controller/AdminController.js"
import { verifyToken } from "../Middleware/authMiddleware.js"



let Adminroutes = express.Router()



Adminroutes.get("/fetchdetails", fetchDetails)
Adminroutes.post("/registeradmin", registerAdmin)
Adminroutes.put("/updatecompany/:id", updateCompany)
Adminroutes.post("/changepassword", verifyToken, changeCompanyPassword)
// Adminroutes.post("/adminlogin", adminLogin)

export { Adminroutes }