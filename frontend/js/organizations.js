/**
 * Organizations functionality for separate pages (Clinics, NGOs, Shelters)
 */

import { getJSON } from "./api.js";
import { escapeHTML, createElement, showLoading, showError, showEmpty } from "./utils.js";

let allOrganizations = [];
let allCities = [];
let userLocation = null;
let useLocationSorting = false;

/**
// Load organizations by type
// @param {string} type - CLINIC, NGO, or SHELTER
// */
export async function loadOrganizationsByType(type) {
  const containerIdMap = {
    'CLINIC': 'clinicsList',
    'NGO': 'ngosList',
    'SHELTER': 'sheltersList',
    'PET_HOSTEL': 'hostelsList',
    'PET_SHOP': 'organizations-container'
  };
  const containerId = containerIdMap[type] || 'organizations-container';
  const container = document.getElementById(containerId);
  if (!container) return;

  showLoading(container);

  try {
    const cityFilter = document.getElementById("cityFilter")?.value || "";
    
    let url = `/api/clinics?type=${type}`;
    if (cityFilter) {
      url += `&city=${encodeURIComponent(cityFilter)}`;
    }
    
    const data = await getJSON(url);
    
    if (!Array.isArray(data) || data.length === 0) {
      showEmpty(container, `No ${type.toLowerCase()}s found.`);
      allOrganizations = [];
      return;
    }

    allOrganizations = data;
    
    // Try to get user location for distance sorting
    if (navigator.geolocation && !userLocation) {
      requestUserLocation();
    }
    
    renderOrganizations(allOrganizations, container);
    
    // Update cities list
    updateCitiesList();
  } catch (error) {
    console.error(`Failed to load ${type.toLowerCase()}s:`, error);
    showError(container, `Failed to load ${type.toLowerCase()}s: ${error.message}`);
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
      return Promise.resolve();
    }
  } catch (error) {
    console.error("Failed to load cities:", error);
    return Promise.resolve(); // Continue even if cities fail to load
  }
  return Promise.resolve();
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
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Request user's location
 */
function requestUserLocation() {
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      console.log("User location obtained:", userLocation);
      
      
      // Update button state if it exists
      const btn = document.getElementById('locationSortBtn');
      if (btn && useLocationSorting) {
        btn.textContent = '📍 Sorted by Distance';
        btn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        btn.disabled = false;
      }

      // Re-render organizations with distance sorting if enabled
      if (useLocationSorting) {
        const container = document.getElementById('clinicsList') || 
                         document.getElementById('ngosList') || 
                         document.getElementById('sheltersList') ||
                         document.getElementById('hostelsList') ||
                         document.getElementById('organizations-container');
        if (container) {
          renderOrganizations(allOrganizations, container);
        }
      }
    },
    (error) => {
      console.log("Error getting user location:", error.message);
      
      const btn = document.getElementById('locationSortBtn');
      if (btn && useLocationSorting) {
        btn.textContent = '📍 Sort by Distance';
        btn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        btn.disabled = false;
        useLocationSorting = false;
        alert('Unable to get your location. Please enable location access in your browser settings.');
        
        // Re-render without sorting
        const container = document.getElementById('clinicsList') || 
                         document.getElementById('ngosList') || 
                         document.getElementById('sheltersList') ||
                         document.getElementById('hostelsList') ||
                         document.getElementById('organizations-container');
        if (container) {
          renderOrganizations(allOrganizations, container);
        }
      }

      // Show a message to user if they deny location
      if (error.code === error.PERMISSION_DENIED) {
        console.log("User denied location access");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Render organizations to the container
 */
function renderOrganizations(organizations, container) {
  container.innerHTML = "";

  if (organizations.length === 0) {
    showEmpty(container, "No organizations match your filters.");
    return;
  }

  // Calculate distances and sort if location is available and sorting is enabled
  let organizationsWithDistance = organizations.map(org => {
    let distance = null;
    if (useLocationSorting && userLocation && org.latitude && org.longitude) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        org.latitude,
        org.longitude
      );
    }
    return { ...org, distance };
  });

  // Sort by distance if location sorting is enabled
  if (useLocationSorting && userLocation) {
    organizationsWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }

  // Find nearest organization (first one with distance after sorting)
  const nearestOrg = organizationsWithDistance.length > 0 && organizationsWithDistance[0].distance !== null 
    ? organizationsWithDistance[0] 
    : null;

  organizationsWithDistance.forEach((org, index) => {
    const isNearest = useLocationSorting && nearestOrg && index === 0 && org.distance !== null;
    const card = createOrganizationCard(org, isNearest);
    container.appendChild(card);
  });
}

/**
 * Create a card element for an organization
 * @param {Object} org - Organization object
 * @param {boolean} isNearest - Whether this is the nearest organization
 */
function createOrganizationCard(org, isNearest = false) {
  const card = createElement("div", "card");
  
  // Add highlight class if nearest
  if (isNearest) {
    card.classList.add("nearest-organization");
    card.style.border = "3px solid #4CAF50";
    card.style.boxShadow = "0 8px 25px rgba(76, 175, 80, 0.4)";
    card.style.transform = "scale(1.02)";
  }
  
  const typeLabel = org.type || "CLINIC";
  const typeDisplay = typeLabel.charAt(0) + typeLabel.slice(1).toLowerCase();
  
  // Backward compatibility
  const address = org.address || (org.area ? `${org.area}, ${org.city || org.area}` : "-");
  const city = org.city || org.area || "-";
  const openHours = org.openHours || org.open || null;
  const closeHours = org.closeHours || org.close || null;
  
  let hoursHtml = "";
  if (openHours && closeHours) {
    hoursHtml = `<p><strong>🕐 Hours:</strong> ${escapeHTML(openHours)} – ${escapeHTML(closeHours)}</p>`;
  }
  
  // Distance display
  let distanceHtml = "";
  if (org.distance !== null && org.distance !== undefined) {
    const distanceKm = org.distance.toFixed(1);
    const distanceText = distanceKm < 1 
      ? `${(org.distance * 1000).toFixed(0)} m away`
      : `${distanceKm} km away`;
    distanceHtml = `<p style="color: ${isNearest ? '#4CAF50' : '#d63384'}; font-weight: 600;">
      <strong>${isNearest ? '⭐ ' : ''}📍 Distance:</strong> ${distanceText}${isNearest ? ' (Nearest)' : ''}
    </p>`;
  }
  
  let locationHtml = "";
  if (org.latitude && org.longitude) {
    const mapUrl = `https://www.google.com/maps?q=${org.latitude},${org.longitude}`;
    locationHtml = `<p><strong>🗺️ Location:</strong> <a href="${mapUrl}" target="_blank" rel="noopener noreferrer">View on Map</a></p>`;
  }
  
  const typeEmoji = typeLabel === 'CLINIC' ? '🏥' : 
                    typeLabel === 'NGO' ? '🤝' : 
                    typeLabel === 'SHELTER' ? '🏡' : 
                    typeLabel === 'PET_HOSTEL' ? '🏨' : 
                    typeLabel === 'PET_SHOP' ? '🛒' : '🏠';
  
  card.innerHTML = `
    <div class="card-content">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <h3 class="card-title">${typeEmoji} ${escapeHTML(org.name || "Unknown Organization")}</h3>
        <span class="status-badge" style="background-color: ${getTypeColor(typeLabel)}; color: white; padding: 6px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
          ${escapeHTML(typeDisplay)}
        </span>
      </div>
      <div class="card-details">
        ${distanceHtml}
        <p><strong>📍 Address:</strong> ${escapeHTML(address)}</p>
        <p><strong>🏙️ City:</strong> ${escapeHTML(city)}</p>
        ${hoursHtml}
        <p><strong>📞 Phone:</strong> <a href="tel:${escapeHTML(org.phone || "")}">${escapeHTML(org.phone || "-")}</a></p>
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
    case "PET_SHOP": return "#FF9800";
    case "PET_HOSTEL": return "#9C27B0";
    default: return "#757575";
  }
}

/**
 * Filter organizations by search query (client-side)
 */
export function filterOrganizations(query, type) {
  const containerIdMap = {
    'CLINIC': 'clinicsList',
    'NGO': 'ngosList',
    'SHELTER': 'sheltersList',
    'PET_HOSTEL': 'hostelsList',
    'PET_SHOP': 'organizations-container'
  };
  const containerId = containerIdMap[type] || 'organizations-container';
  const container = document.getElementById(containerId);
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

// Helper function to get current type
function getCurrentType() {
  if (document.getElementById("clinicsList")) return 'CLINIC';
  if (document.getElementById("ngosList")) return 'NGO';
  if (document.getElementById("sheltersList")) return 'SHELTER';
  if (document.getElementById("hostelsList")) return 'PET_HOSTEL';
  return null;
}

// Initialize on page load
function initializePage() {
  const searchInput = document.getElementById("searchInput") || 
                     document.getElementById("clinicsSearch") || 
                     document.getElementById("ngosSearch") || 
                     document.getElementById("sheltersSearch") ||
                     document.getElementById("hostelsSearch");
  const cityFilter = document.getElementById("cityFilter");
  const type = getCurrentType();
  
  if (searchInput && type) {
    searchInput.addEventListener("input", (e) => filterOrganizations(e.target.value, type));
  }

  // Location Sort Button
  const locationSortBtn = document.getElementById('locationSortBtn');
  if (locationSortBtn && type) {
    locationSortBtn.addEventListener('click', () => {
      useLocationSorting = !useLocationSorting;
      
      if (useLocationSorting) {
        if (!userLocation) {
          requestUserLocation();
          locationSortBtn.textContent = '📍 Getting Location...';
          locationSortBtn.disabled = true;
          // Timeout handled in requestUserLocation via potential error or success callback
          // But we can add a safety timeout here too if needed, though requestUserLocation has a timeout of 10s
        } else {
          locationSortBtn.textContent = '📍 Sorted by Distance';
          locationSortBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
          
          // Trigger render
          const containerIdMap = {
            'CLINIC': 'clinicsList',
            'NGO': 'ngosList',
            'SHELTER': 'sheltersList',
            'PET_HOSTEL': 'hostelsList',
            'PET_SHOP': 'organizations-container'
          };
          const container = document.getElementById(containerIdMap[type]);
          if (container) renderOrganizations(allOrganizations, container);
        }
      } else {
        locationSortBtn.textContent = '📍 Sort by Distance';
        locationSortBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
        
        // Trigger render
        const containerIdMap = {
          'CLINIC': 'clinicsList',
          'NGO': 'ngosList',
          'SHELTER': 'sheltersList',
          'PET_HOSTEL': 'hostelsList',
          'PET_SHOP': 'organizations-container'
        };
        const container = document.getElementById(containerIdMap[type]);
        if (container) renderOrganizations(allOrganizations, container);
      }
    });
  }
  
  if (cityFilter && type) {
    cityFilter.addEventListener("change", () => {
      loadOrganizationsByType(type);
    });
  }
  
  // Load cities and organizations
  loadAllForCities().then(() => {
    if (type) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        loadOrganizationsByType(type);
      }, 100);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  initializePage();
}

