export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

/**
 * Helper to get full URL for an asset/file path
 * @param {string} path - The relative path from the server
 * @returns {string} - The full URL
 */
export const getAssetUrl = (path) => {
    if (!path) return null;
    // Handle paths that might already be absolute (though unlikely in this app)
    if (path.startsWith('http')) return path;

    // Normalize backslashes from Windows paths to forward slashes for URLs
    const normalizedPath = path.replace(/\\/g, "/");
    return `${BASE_URL}/${normalizedPath}`;
};
