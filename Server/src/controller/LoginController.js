import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Company } from "../models/companySchema.js";
import { User } from "../models/UserSchema.js";
import dotenv from "dotenv";
dotenv.config();
const loginUser = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password)
      return res
        .status(400)
        .json({ message: "Email and Password are required" });

    // Step 1: Check in User collection
    let user = await User.findOne({ Email }).populate("CompanyId");
    let role, source;

    if (user) {
      role = user.role;
      source = "user";
    } else {
      // Step 2: Check in Company (Admin)
      user = await Company.findOne({ AdminEmail: Email });
      if (user) {
        role = "Admin";
        source = "company";
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // Step 3: Compare passwords
    const isMatch = await bcrypt.compare(
      Password,
      source === "company" ? user.AdminPassword : user.Password
    );

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Step 4: Create token
    const token = jwt.sign(
      { id: user._id, role, source },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Step 5: Send response
   // Step 5: Send response
res.status(200).json({
  message: "Login successful",
  token,
  role,
  user: {
    id: user._id,
    name: source === "company" ? user.AdminName : user.Name,
    email: source === "company" ? user.AdminEmail : user.Email,
    companyId: source === "user" ? user.CompanyId?._id : user._id, // ✅ For HR/CA: their CompanyId, For Admin: their own ID
    companyName: source === "user" ? user.CompanyId?.CompanyName : user.CompanyName,
  },
});
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export { loginUser };
