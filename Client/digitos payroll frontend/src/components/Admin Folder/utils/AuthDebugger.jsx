import React, { useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../../../utils/axiosInstance";

/**
 * AuthDebugger Component
 * 
 * A diagnostic tool to inspect authentication state and test API calls.
 * This component helps identify authentication issues by displaying:
 * - Current Redux auth state
 * - Token validity
 * - User role and permissions
 * - Ability to test API calls with current auth
 */
export default function AuthDebugger() {
    const { token, companyId, role, user } = useSelector((state) => state.auth);
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    // Decode JWT token (basic decode, doesn't verify signature)
    const decodeToken = (token) => {
        if (!token) return null;
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    const tokenPayload = token ? decodeToken(token) : null;
    const isTokenExpired = tokenPayload
        ? tokenPayload.exp * 1000 < Date.now()
        : false;

    // Test API call with current auth
    const testAuthenticatedCall = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const actualCompanyId = companyId?._id || companyId;
            const response = await axiosInstance.post(
                `/gettotalrevenue/${actualCompanyId}`
            );
            setTestResult({
                success: true,
                data: response.data,
                message: "✅ API call successful!",
            });
        } catch (error) {
            setTestResult({
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status,
                message: `❌ API call failed: ${error.response?.status || "Network Error"}`,
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto z-50">
            <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-2">
                🔍 Auth Debugger
            </h2>

            {/* Token Status */}
            <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Token Status</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Has Token:</span>
                        <span className={token ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {token ? "✅ YES" : "❌ NO"}
                        </span>
                    </div>
                    {token && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Token Preview:</span>
                                <span className="text-xs font-mono text-gray-500">
                                    {token.substring(0, 15)}...
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Expired:</span>
                                <span className={isTokenExpired ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                    {isTokenExpired ? "❌ YES" : "✅ NO"}
                                </span>
                            </div>
                            {tokenPayload?.exp && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expires:</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(tokenPayload.exp * 1000).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* User Info */}
            <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">User Info</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{user?.Name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-xs">{user?.Email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className={`font-bold ${role ? "text-blue-600" : "text-red-600"}`}>
                            {role?.toUpperCase() || "❌ NO ROLE"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Company ID:</span>
                        <span className="text-xs font-mono">
                            {companyId?._id || companyId || "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Token Payload */}
            {tokenPayload && (
                <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Token Payload</h3>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(tokenPayload, null, 2)}</pre>
                    </div>
                </div>
            )}

            {/* Authorization Check */}
            <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Authorization Check</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Required Roles:</span>
                        <span className="font-medium">Admin, CA</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Your Role:</span>
                        <span className={`font-bold ${role === "admin" || role === "ca"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}>
                            {role?.toUpperCase() || "NONE"}
                        </span>
                    </div>
                    <div className="mt-2 p-2 rounded text-xs">
                        {role === "admin" || role === "ca" ? (
                            <div className="bg-green-100 text-green-800 p-2 rounded">
                                ✅ You have permission to access this endpoint
                            </div>
                        ) : (
                            <div className="bg-red-100 text-red-800 p-2 rounded">
                                ❌ Your role ({role || "none"}) doesn't match required roles (Admin, CA)
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Test API Call */}
            <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Test API Call</h3>
                <button
                    onClick={testAuthenticatedCall}
                    disabled={testing || !token}
                    className={`w-full py-2 px-4 rounded font-medium ${testing || !token
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    {testing ? "Testing..." : "Test /gettotalrevenue"}
                </button>

                {testResult && (
                    <div className={`mt-3 p-3 rounded text-sm ${testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                        }`}>
                        <div className="font-semibold mb-2">{testResult.message}</div>
                        {testResult.status && (
                            <div className="text-xs mb-1">Status: {testResult.status}</div>
                        )}
                        <div className="text-xs font-mono overflow-x-auto">
                            <pre>{JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
                <div className="font-semibold text-yellow-800 mb-1">💡 Tips:</div>
                <ul className="list-disc ml-4 text-yellow-700 space-y-1">
                    <li>Check browser console for detailed request logs</li>
                    <li>Open DevTools → Network tab to inspect headers</li>
                    <li>Verify backend middleware is working correctly</li>
                    <li>Ensure JWT secret matches between frontend/backend</li>
                </ul>
            </div>
        </div>
    );
}
