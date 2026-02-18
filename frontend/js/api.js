/**
 * API helper functions for Pawpal
 * Base URL and common fetch utilities
 */

import { getAuthToken } from "./auth.js";

const API_BASE = "http://localhost:8080";

/**
 * Get headers with authentication token if available
 * @returns {Object} Headers object
 */
function getHeaders(includeAuth = true) {
  const headers = {};
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Fetch JSON from an endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/sos')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
async function getJSON(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}: ${text}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch (e) {
      // Use text as is
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * POST JSON data to an endpoint
 * @param {string} endpoint - API endpoint
 * @param {Object} data - JSON data to send
 * @returns {Promise<any>} Parsed JSON response
 */
async function postJSON(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}: ${text}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch (e) {
      // Use text as is
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * POST form data (multipart/form-data) to an endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/sos')
 * @param {FormData} formData - FormData object
 * @returns {Promise<any>} Parsed JSON response
 */
async function postForm(endpoint, formData) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      // Don't set Content-Type for FormData - browser will set it with boundary
    },
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}: ${text}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch (e) {
      // Use text as is
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * PUT JSON data to an endpoint
 * @param {string} endpoint - API endpoint
 * @param {Object} data - JSON data to send
 * @returns {Promise<any>} Parsed JSON response
 */
async function putJSON(endpoint, data) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}: ${text}`;
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch (e) {
      // Use text as is
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * Get full image URL from image path
 * @param {string} imagePath - Image path from backend
 * @returns {string} Full URL to the image
 */
function getImageUrl(imagePath) {
  if (!imagePath) return "";
  const clean = imagePath.replace(/\\/g, "/");
  return clean.startsWith("/uploads/") 
    ? `${API_BASE}${clean}` 
    : `${API_BASE}/uploads/${clean}`;
}

export { API_BASE, getJSON, postJSON, postForm, putJSON, getImageUrl };









