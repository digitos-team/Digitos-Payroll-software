import express from "express";
import { addHoliday, getHolidays, updateHoliday, deleteHoliday } from "../controller/HolidayController.js";

const HolidayRoutes = express.Router();

HolidayRoutes.post("/holiday/add", addHoliday);
HolidayRoutes.get("/holiday/list", getHolidays);
HolidayRoutes.put("/holiday/update", updateHoliday);
HolidayRoutes.delete("/holiday/delete/:HolidayId", deleteHoliday);

export default HolidayRoutes;