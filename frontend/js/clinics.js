/**
 * Organizations functionality
 * Handles loading and displaying organizations (clinics, NGOs, shelters)
 */

import { getJSON } from "./api.js";
import { escapeHTML, createElement, showLoading, showError, showEmpty } from "./utils.js";

let allOrganizations = [];
let allCities = [];

/**
 * Load all organizations from the API
 * @returns {Promise<void>}
 */
async function loadOrganizations() {
  const container = document.getElementById("clinicsList");
  if (!container) return;

  showLoading(container);

  try {
    const typeFilter = document.getElementById("typeFilter")?.value || "";
    const cityFilter = document.getElementById("cityFilter")?.value || "";
    
    let url = "/api/clinics";
    const params = new URLSearchParams();
    if (typeFilter) params.append("type", typeFilter);
    if (cityFilter) params.append("city", cityFilter);
    if (params.toString()) url += "?" + params.toString();
    
    const data = await getJSON(url);
    
    if (!Array.isArray(data) || data.length === 0) {
      showEmpty(container, "No organizations found.");
      allOrganizations = [];
      return;
    }

    allOrganizations = data;
    renderOrganizations(allOrganizations, container);
    
    // Update cities list if needed
    updateCitiesList();
  } catch (error) {
    console.error("Failed to load organizations:", error);
    showError(container, `Failed to load organizations: ${error.message}`);
  }
}

/**
 * Load all organizations to populate city filter
 */
async function loadAllForCities() {
  try {
    const data = await getJSON("/api/clinics");
    if (Array.isArray(data)) {
      const cities = [...new Set(data.map(org => org.city).filter(Boolean))].sort();
      allCities = cities;
      updateCitiesDropdown();
    }
  } catch (error) {
    console.error("Failed to load cities:", error);
  }
}

/**
 * Update cities dropdown
 */
function updateCitiesDropdown() {
  const cityFilter = document.getElementById("cityFilter");
  if (!cityFilter) return;
  
  const currentValue = cityFilter.value;
  cityFilter.innerHTML = '<option value="">All Cities</option>';
  
  allCities.forEach(city => {
    const option = createElement("option");
    option.value = city;
    option.textContent = city;
    if (city === currentValue) option.selected = true;
    cityFilter.appendChild(option);
  });
}

/**
 * Update cities list from current organizations
 */
function updateCitiesList() {
  const cities = [...new Set(allOrganizations.map(org => org.city).filter(Boolean))].sort();
  const newCities = cities.filter(c => !allCities.includes(c));
  if (newCities.length > 0) {
    allCities = [...allCities, ...newCities].sort();
    updateCitiesDropdown();
  }
}

/**
 * Render organizations to the container
 * @param {Array} organizations - Array of organization objects
 * @param {HTMLElement} container - Container element
 */
function renderOrganizations(organizations, container) {
  container.innerHTML = "";

  if (organizations.length === 0) {
    showEmpty(container, "No organizations match your filters.");
    return;
  }

  organizations.forEach((org) => {
    const card = createOrganizationCard(org);
    container.appendChild(card);
  });
}

/**
 * Create a card element for an organization
 * @param {Object} org - Organization object
 * @returns {HTMLElement} Card element
 */
function createOrganizationCard(org) {
  const card = createElement("div", "card");
  
  // Handle both old and new data formats
  const typeLabel = org.type || "CLINIC";
  const typeDisplay = typeLabel.charAt(0) + typeLabel.slice(1).toLowerCase();
  
  // Backward compatibility: handle old format (area, open, close) vs new format (address, city, openHours, closeHours)
  const address = org.address || (org.area ? `${org.area}, ${org.city || org.area}` : "-");
  const city = org.city || org.area || "-";
  const openHours = org.openHours || org.open || null;
  const closeHours = org.closeHours || org.close || null;
  
  let hoursHtml = "";
  if (openHours && closeHours) {
    hoursHtml = `<p><strong>Hours:</strong> ${escapeHTML(openHours)} – ${escapeHTML(closeHours)}</p>`;
  }
  
  let locationHtml = "";
  if (org.latitude && org.longitude) {
    const mapUrl = `https://www.google.com/maps?q=${org.latitude},${org.longitude}`;
    locationHtml = `<p><strong>Location:</strong> <a href="${mapUrl}" target="_blank" rel="noopener noreferrer">View on Map</a></p>`;
  }
  
  card.innerHTML = `
    <div class="card-content">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <h3 class="card-title">${escapeHTML(org.name || "Unknown Organization")}</h3>
        <span class="status-badge" style="background-color: ${getTypeColor(typeLabel)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">
          ${escapeHTML(typeDisplay)}
        </span>
      </div>
      <div class="card-details">
        <p><strong>Address:</strong> ${escapeHTML(address)}</p>
        <p><strong>City:</strong> ${escapeHTML(city)}</p>
        ${hoursHtml}
        <p><strong>Phone:</strong> <a href="tel:${escapeHTML(org.phone || "")}">${escapeHTML(org.phone || "-")}</a></p>
        ${locationHtml}
      </div>
    </div>
  `;

  return card;
}

/**
 * Get color for organization type
 */
function getTypeColor(type) {
  switch (type) {
    case "CLINIC": return "#4CAF50";
    case "NGO": return "#2196F3";
    case "SHELTER": return "#FF9800";
    default: return "#757575";
  }
}

/**
 * Filter organizations by search query (client-side filtering)
 * @param {string} query - Search query (searches name and address)
 */
function filterOrganizations(query) {
  const container = document.getElementById("clinicsList");
  if (!container) return;
  
  if (!query.trim()) {
    renderOrganizations(allOrganizations, container);
    return;
  }

  const lowerQuery = query.toLowerCase();
  const filtered = allOrganizations.filter(
    (org) =>
      (org.name && org.name.toLowerCase().includes(lowerQuery)) ||
      (org.address && org.address.toLowerCase().includes(lowerQuery)) ||
      (org.city && org.city.toLowerCase().includes(lowerQuery))
  );

  renderOrganizations(filtered, container);
}

/**
 * Apply filters and reload from API
 */
function applyFilters() {
  loadOrganizations();
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("clinicsSearch");
    const typeFilter = document.getElementById("typeFilter");
    const cityFilter = document.getElementById("cityFilter");
    
    if (searchInput) {
      searchInput.addEventListener("input", (e) => filterOrganizations(e.target.value));
    }
    
    if (typeFilter) {
      typeFilter.addEventListener("change", applyFilters);
    }
    
    if (cityFilter) {
      cityFilter.addEventListener("change", applyFilters);
    }
    
    // Load organizations if on clinics page
    if (document.getElementById("clinicsList")) {
      loadAllForCities();
      loadOrganizations();
    }
  });
} else {
  const searchInput = document.getElementById("clinicsSearch");
  const typeFilter = document.getElementById("typeFilter");
  const cityFilter = document.getElementById("cityFilter");
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => filterOrganizations(e.target.value));
  }
  
  if (typeFilter) {
    typeFilter.addEventListener("change", applyFilters);
  }
  
  if (cityFilter) {
    cityFilter.addEventListener("change", applyFilters);
  }
  
  if (document.getElementById("clinicsList")) {
    loadAllForCities();
    loadOrganizations();
  }
}

// Export for use in other modules (keeping old names for backward compatibility)
export { loadOrganizations as loadClinics, filterOrganizations as filterClinics };










