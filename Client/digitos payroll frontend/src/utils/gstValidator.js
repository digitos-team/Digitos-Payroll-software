import { STATE_CODE_MAP } from "../components/Admin Folder/constants/indianStates";


export const validateGSTIN = (gstin) => {
    if (!gstin) return { valid: true, message: "" }; // Optional field

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(gstin)) {
        return {
            valid: false,
            message: "Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5"
        };
    }

    return { valid: true, message: "" };
};

/**
 * Extracts state code from GSTIN (first 2 digits)
 */
export const getStateCodeFromGSTIN = (gstin) => {
    if (!gstin || gstin.length < 2) return null;
    return gstin.substring(0, 2);
};

/**
 * Gets state name from GSTIN
 */
export const getStateFromGSTIN = (gstin) => {
    const stateCode = getStateCodeFromGSTIN(gstin);
    if (!stateCode) return null;
    return STATE_CODE_MAP[stateCode] || null;
};

/**
 * Formats GSTIN for display (uppercase)
 */
export const formatGSTIN = (gstin) => {
    if (!gstin) return "";
    return gstin.toUpperCase().trim();
};

/**
 * Calculates GST amounts based on base amount and rate
 * @param {number} baseAmount - Amount before GST
 * @param {number} gstRate - GST percentage (0, 5, 12, 18, 28)
 * @param {boolean} isIGST - Whether it's inter-state (IGST) or intra-state (CGST+SGST)
 * @returns {object} - GST breakdown
 */
export const calculateGST = (baseAmount, gstRate, isIGST = false) => {
    const base = parseFloat(baseAmount) || 0;
    const rate = parseFloat(gstRate) || 0;

    const totalGST = (base * rate) / 100;

    if (isIGST) {
        return {
            cgst: 0,
            sgst: 0,
            igst: totalGST,
            totalGST: totalGST,
            totalAmount: base + totalGST,
            gstType: "IGST"
        };
    } else {
        const halfGST = totalGST / 2;
        return {
            cgst: halfGST,
            sgst: halfGST,
            igst: 0,
            totalGST: totalGST,
            totalAmount: base + totalGST,
            gstType: "CGST+SGST"
        };
    }
};

/**
 * Determines if transaction is inter-state (IGST) or intra-state (CGST+SGST)
 * @param {string} clientState - Client's state
 * @param {string} companyState - Company's state
 * @returns {boolean} - true if inter-state (IGST), false if intra-state (CGST+SGST)
 */
export const isInterState = (clientState, companyState) => {
    if (!clientState || !companyState) return false;
    return clientState !== companyState;
};
