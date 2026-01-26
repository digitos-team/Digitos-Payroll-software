import React from "react";

const Payroll = () => {


  return (
    <div className="p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Payroll Summary</h2>

        <button className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">
          Process All Payments
        </button>
      </div>

      {/* Payroll Table Container */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-gray-600">Employee</th>
              <th className="py-3 px-4 text-gray-600">Department</th>
              <th className="py-3 px-4 text-gray-600">Base</th>
              <th className="py-3 px-4 text-gray-600">Gross</th>
              <th className="py-3 px-4 text-gray-600">Deductions</th>
              <th className="py-3 px-4 text-gray-600">Net</th>
              <th className="py-3 px-4 text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody>
            {payrollData.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="py-3 px-4">{row.name}</td>
                <td className="py-3 px-4">{row.department}</td>

                <td className="py-3 px-4 text-gray-700">₹{row.base}</td>
                <td className="py-3 px-4 text-blue-600 font-medium">₹{row.gross}</td>
                <td className="py-3 px-4 text-red-500 font-medium">₹{row.deductions}</td>

                <td className="py-3 px-4 text-green-600 font-semibold">
                  ₹{row.net.toLocaleString()}
                </td>

                <td className="py-3 px-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Generate Slip
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
