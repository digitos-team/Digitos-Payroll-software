import express from "express";
import { getRecentActivities } from "../controller/GetRecentActivities.js";
// import { getRecentActivities } from "../controller/RecentActivites.js";


const RecentActivitiesRoutes = express.Router();

RecentActivitiesRoutes.get("/recentactivities", getRecentActivities);

export {RecentActivitiesRoutes};
