import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/loginSlice";

import loginImage from "../../../assets/login_image.jpeg";
import logo from "../../../assets/Black Text Logo.jpeg";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        Email: email,
        Password: password,
      });

      console.log("Login response:", res.data);

      const { token, role, user } = res.data;
      console.log("🔍 DEBUG - Raw role from backend:", role);
      console.log("🔍 DEBUG - User data:", user);

      if (!token || !user) {
        setError("Invalid credentials");
        return;
      }

      if (!user.companyId) {
        setError("Company information missing. Please contact admin.");
        return;
      }

      const normalizedRole = role?.toLowerCase();
      const companyId = user.companyId;

      console.log("🔍 DEBUG - Normalized role:", normalizedRole);
      console.log("🔍 DEBUG - CompanyId:", companyId);

      // Dispatch login to Redux
      dispatch(
        loginSuccess({
          token,
          companyId,
          role: normalizedRole,
          user,
        })
      );

      console.log("🔍 DEBUG - Dispatched to Redux successfully");

      setSuccess("Login successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 min-h-screen px-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white min-h-[80vh]">

          {/* Image section */}
          {/* Image section */}
          <div className="w-full lg:w-1/2 h-56 sm:h-64 md:h-72 lg:h-auto relative bg-gray-100">
            <img
              src={loginImage}
              alt="Login Visual"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-violet-700/40 to-transparent lg:hidden"></div>
          </div>

          {/* Login Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <div className="mb-6">
              <img
                src={logo}
                alt="Company Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              Hello, Welcome Back
            </h3>
            <p className="text-gray-600 mb-8">Sign in to your account.</p>

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-2.5 right-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}

              {/* Button */}
              <button
                type="submit"
                className="w-full bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 transition font-semibold mt-2"
              >
                Sign In
              </button>

              <div className="flex justify-between items-center text-sm text-gray-600 mt-3">
                <Link
                  to="/forgot-password"
                  className="text-violet-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}