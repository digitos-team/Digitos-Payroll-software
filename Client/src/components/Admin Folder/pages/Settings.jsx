import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getAdminProfile, changeAdminPassword } from "../../../utils/api/adminapi";
import { updateCompany } from "../../../utils/api/companyapi";

export default function Settings() {
  const { companyId } = useSelector((state) => state.auth);

  const [admin, setAdmin] = useState({
    AdminName: "",
    AdminEmail: "",
    AdminPhone: "",
    CompanyEmail: "",
    CompanyPhone: "",
    CompanyAddress: "",
    CompanyCity: "",
    CompanyState: "",
    CompanyPincode: "",
    Password: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getAdminProfile();
      console.log("data:" + data);

      if (data && data.length > 0) {
        const profile = data[0];
        setAdmin((prev) => ({
          ...prev,
          ...profile,
          Password: "",
        }));
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const actualCompanyId = companyId?._id || companyId;
    if (!actualCompanyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");

      // Prepare update payload (exclude Password field)
      const updates = {
        AdminName: admin.AdminName,
        AdminEmail: admin.AdminEmail,
        AdminPhone: admin.AdminPhone,
        CompanyPhone: admin.CompanyPhone,
        CompanyAddress: admin.CompanyAddress,
        CompanyCity: admin.CompanyCity,
        CompanyState: admin.CompanyState,
        CompanyPincode: admin.CompanyPincode,
      };

      const response = await updateCompany(actualCompanyId, updates);

      if (response && response.message) {
        setSaveMessage(response.message);
        alert("Profile updated successfully!");

        // Reload profile data
        const data = await getAdminProfile();
        if (data && data.length > 0) {
          const profile = data[0];
          setAdmin((prev) => ({
            ...prev,
            ...profile,
            Password: "",
          }));
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMsg = error.response?.data?.message || "Failed to update profile. Please try again.";
      alert(errorMsg);
      setSaveMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };



  const handleChangePassword = async () => {
    if (!admin.Password) {
      alert("Please enter a new password before changing.");
      return;
    }

    const res = await changeAdminPassword(admin.Password);

    if (res) {
      alert("Password updated successfully!");
      setAdmin((prev) => ({ ...prev, Password: "" })); // clear after update
    } else {
      alert("Failed to update password");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-500">
          Configure application preferences and your admin profile.
        </p>
      </header>

      {/* Theme Section */}
      {/* <section>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Theme</h3>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-gray-600">Current Theme</label>
              <div className="mt-1 font-medium">{theme}</div>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`px-4 py-2 rounded ${
                  theme === "light" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-4 py-2 rounded ${
                  theme === "dark" ? "bg-blue-600 text-white" : "bg-gray-100"
                }`}
              >
                Dark
              </button>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>
      </section> */}

      <section>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Admin Profile</h3>

          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Admin Fields */}
            <div>
              <label className="text-sm text-gray-600">Admin Name</label>
              <input
                name="AdminName"
                value={admin.AdminName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Admin Email</label>
              <input
                name="AdminEmail"
                value={admin.AdminEmail}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Admin Phone</label>
              <input
                name="AdminPhone"
                value={admin.AdminPhone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            {/* Company Info */}
            <div>
              <label className="text-sm text-gray-600">Company Email</label>
              <input
                name="CompanyEmail"
                value={admin.CompanyEmail}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Company Phone</label>
              <input
                name="CompanyPhone"
                value={admin.CompanyPhone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Company Address</label>
              <input
                name="CompanyAddress"
                value={admin.CompanyAddress}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">City</label>
              <input
                name="CompanyCity"
                value={admin.CompanyCity}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">State</label>
              <input
                name="CompanyState"
                value={admin.CompanyState}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Pincode</label>
              <input
                name="CompanyPincode"
                value={admin.CompanyPincode}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            {/* Password Field */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="Password"
                  value={admin.Password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full border rounded px-3 py-2 pr-32"
                />

                <button
                  type="button"
                  className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={handleChangePassword}
                >
                  Change
                </button>
              </div>
            </div>


            {/* Save Button */}
            <div className="flex items-end justify-end sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>


    </div>
  );
}
