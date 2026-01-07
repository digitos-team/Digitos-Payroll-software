
import { store } from "../../components/redux/MainStore";
import axiosInstance from "../axiosInstance";

const getCompanyId = () => {
    const state = store.getState();
    return state.auth?.companyId;
};

// Helper function to download PDF blob
const downloadPDF = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

// ==================== COMPREHENSIVE MONTHLY REPORT ====================
export const downloadComprehensiveMonthlyReport = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        // Extract month number if input is YYYY-MM
        let monthValue = month;
        if (month.includes("-")) {
            monthValue = month.split("-")[1];
        }

        const response = await axiosInstance.get("/monthlycomprehensivepdf", {
            params: { month: monthValue, year, CompanyId },
            responseType: "blob",
        });

        const filename = `Comprehensive_Report_${month}_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading comprehensive monthly report:", error);
        throw error;
    }
};

// ==================== ANNUAL REPORT ====================
export const downloadAnnualReport = async (year) => {
    try {
        const CompanyId = getCompanyId();

        const response = await axiosInstance.get("/annualreportpdf", {
            params: { year, CompanyId },
            responseType: "blob",
        });

        const filename = `Annual_Report_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Annual report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading annual report:", error);
        throw error;
    }
};

// ==================== SALARY REPORT ====================
// export const downloadSalaryReport = async (month = null) => {
//     try {
//         const CompanyId = getCompanyId();

//         const params = { CompanyId };
//         if (month) {
//             params.Month = month;
//             // Also send separated parts just in case
//             if (month.includes("-")) {
//                 const [y, m] = month.split("-");
//                 params.month = m;
//                 params.year = y;
//             }
//         }

//         const response = await axiosInstance.post("/generatesalaryreportpdf", null, {
//             params,
//             responseType: "blob",
//         });

//         const filename = month
//             ? `Salary_Report_${month}.pdf`
//             : `Salary_Report_All_Months.pdf`;
//         downloadPDF(response.data, filename);

//         return { success: true, message: "Salary report downloaded successfully" };
//     } catch (error) {
//         console.error("Error downloading salary report:", error);
//         throw error;
//     }
// };
export const downloadSalaryReport = async (month = null) => {
    try {
        const CompanyId = getCompanyId();

        const params = { CompanyId };

        if (month) {
            params.Month = month;

            if (month.includes("-")) {
                const [y, m] = month.split("-");
                params.year = y;
                params.month = m;
            }
        }

        const response = await axiosInstance.get("/generatesalaryreportpdf", {
            params,
            responseType: "blob",
        });

        const filename = month
            ? `Salary_Report_${month}.pdf`
            : `Salary_Report_All_Months.pdf`;

        downloadPDF(response.data, filename);

        return { success: true };
    } catch (error) {
        console.error("Error downloading salary report:", error);
        throw error;
    }
};


// ==================== MONTHLY PAYROLL REPORT ====================
export const downloadMonthlyPayrollReport = async (month) => {
    try {
        const CompanyId = getCompanyId();

        const params = { CompanyId, Month: month };

        // Extract and send separate month/year params to cover all backend expectations
        if (month && month.includes("-")) {
            const [y, m] = month.split("-");
            params.month = m;
            params.year = y;
        }

        const response = await axiosInstance.get("/export-monthly-pdf", {
            params,
            responseType: "blob",
        });

        const filename = `Payroll_Report_${month}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Payroll report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading payroll report:", error);
        throw error;
    }
};

// ==================== ALL EMPLOYEES CSV EXPORT ====================
export const downloadAllEmployeesCSV = async () => {
    try {
        const response = await axiosInstance.get("/export-users-csv", {
            responseType: "blob",
        });

        const filename = "AllUsers.csv";
        downloadPDF(response.data, filename); // Reusing downloadPDF helper as it handles blobs generically

        return { success: true, message: "CSV exported successfully" };
    } catch (error) {
        console.error("Error exporting employees CSV:", error);
        throw error;
    }
};

// ==================== MONTHLY REVENUE REPORT ====================
export const downloadMonthlyRevenueReport = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        let monthValue = month;
        if (month.includes("-")) {
            monthValue = month.split("-")[1];
        }

        const response = await axiosInstance.get("/export-monthly-revenue-pdf", {
            params: { month: monthValue, year, CompanyId },
            responseType: "blob",
        });

        const filename = `Revenue_Report_${month}_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Revenue report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading monthly revenue report:", error);
        throw error;
    }
};

// ==================== MONTHLY EXPENSES REPORT ====================
export const downloadMonthlyExpensesReport = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        let monthValue = month;
        if (month.includes("-")) {
            monthValue = month.split("-")[1];
        }

        const response = await axiosInstance.get("/export-monthly-expenses-pdf", {
            params: { month: monthValue, year, CompanyId },
            responseType: "blob",
        });

        const filename = `Expenses_Report_${month}_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Expenses report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading monthly expenses report:", error);
        throw error;
    }
};

// ==================== MONTHLY ORDERS REPORT ====================
export const downloadMonthlyOrdersReport = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        let monthValue = month;
        if (month.includes("-")) {
            monthValue = month.split("-")[1];
        }

        const response = await axiosInstance.get("/export-monthly-orders-pdf", {
            params: { month: monthValue, year, CompanyId },
            responseType: "blob",
        });

        const filename = `Orders_Report_${month}_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Orders report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading monthly orders report:", error);
        throw error;
    }
};

// ==================== MONTHLY PURCHASES REPORT ====================
export const downloadMonthlyPurchasesReport = async (month, year) => {
    try {
        const CompanyId = getCompanyId();

        let monthValue = month;
        if (month.includes("-")) {
            monthValue = month.split("-")[1];
        }

        const response = await axiosInstance.get("/export-monthly-purchases-pdf", {
            params: { month: monthValue, year, CompanyId },
            responseType: "blob",
        });

        const filename = `Purchases_Report_${month}_${year}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Purchases report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading monthly purchases report:", error);
        throw error;
    }
};

// ==================== OVERALL ORDERS REPORT ====================
export const downloadOverallOrdersReport = async (startDate = null, endDate = null) => {
    try {
        const CompanyId = getCompanyId();

        const params = { CompanyId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await axiosInstance.get("/export-overall-orders-pdf", {
            params,
            responseType: "blob",
        });

        const filename = `Overall_Orders_Report_${startDate || 'All'}_to_${endDate || 'All'}.pdf`;
        downloadPDF(response.data, filename);

        return { success: true, message: "Overall orders report downloaded successfully" };
    } catch (error) {
        console.error("Error downloading overall orders report:", error);
        throw error;
    }
};
