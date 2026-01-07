import mongoose from "mongoose";
import { RecentActivity } from "../models/RecentActivitySchema.js";
import { sendEmail } from "../utils/Mailer.js"; // Use Mailer.sendEmail (Mailer.js exports sendEmail)

// -------------------- Get recent activities --------------------
const getRecentActivities = async (req, res) => {
  try {
    const { CompanyId, limit } = req.query;

    if (!CompanyId) {
      return res
        .status(400)
        .json({ success: false, message: "CompanyId is required" });
    }

    // Fetch recent activities, sorted by newest first
    const activities = await RecentActivity.find({
      CompanyId: new mongoose.Types.ObjectId(CompanyId),
    })
      .sort({ createdAt: -1 }) // newest first
      .limit(limit ? parseInt(limit) : 10) // default 10
      .populate("userId", "Name Email Role"); // <--- THIS WAS MISSING. Added populate to get User Name.

    res.status(200).json({
      success: true,
      CompanyId,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const createRecentActivity = async ({
  CompanyId,
  userId,
  action,
  target,
  hrEmails,
}) => {
  try {
    // Save activity
    const activity = new RecentActivity({ CompanyId, userId, action, target });
    await activity.save();

    // Send email to HR
    if (hrEmails && hrEmails.length) {
      const subject = `New Activity: ${action}`;
      const text = `An activity has occurred: ${action} on ${target || "N/A"}.`;
      const html = `<p>An activity has occurred: <b>${action}</b> on <b>${
        target || "N/A"
      }</b>.</p>`;

      await sendEmail({ to: hrEmails, subject, text, html });

      // Update activity as email sent
      activity.isEmailSent = true;
      await activity.save();
    }

    return activity;
  } catch (err) {
    console.error("Error creating recent activity:", err);
    throw err;
  }
};

export { getRecentActivities, createRecentActivity };
