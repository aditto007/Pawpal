/**
 * SOS Reports functionality
 * Handles listing, filtering, and displaying SOS reports
 */

import { getJSON, postJSON, putJSON, getImageUrl } from "./api.js";
import { escapeHTML, createElement, showLoading, showError, showEmpty, formatDate, showToast } from "./utils.js";
import { isAuthenticated, getAuthUser } from "./auth.js";

let allReports = [];
let currentCategory = "ALL";

/**
 * Load all SOS reports from the API
 * @returns {Promise<void>}
 */
async function loadSOSReports() {
  const container = document.getElementById("sosList");
  if (!container) return;

  showLoading(container);

  try {
    const data = await getJSON("/api/sos");
    
    if (!Array.isArray(data) || data.length === 0) {
      showEmpty(container, "No SOS reports yet.");
      allReports = [];
      updateCategoryCounts(allReports);
      return;
    }

    // Sort by newest first
    allReports = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    updateCategoryCounts(allReports);
    applyFilters();
  } catch (error) {
    console.error("Failed to load SOS reports:", error);
    showError(container, `Failed to load reports: ${error.message}`);
  }
}

/**
 * Update category count badges
 * @param {Array} reports - Array of all reports
 */
function updateCategoryCounts(reports) {
  const counts = {
    ALL: reports.length,
    ADOPTION: 0,
    LOST: 0,
    INJURED: 0,
    SICK: 0,
    OTHER: 0
  };

  reports.forEach((report) => {
    const cat = (report.category || "OTHER").toUpperCase();
    if (Object.prototype.hasOwnProperty.call(counts, cat)) {
      counts[cat] += 1;
    } else {
      counts.OTHER += 1;
    }
  });

  const map = {
    ALL: "count-all",
    ADOPTION: "count-adoption",
    LOST: "count-lost",
    INJURED: "count-injured",
    SICK: "count-sick",
    OTHER: "count-other",
  };

  Object.keys(map).forEach((key) => {
    const el = document.getElementById(map[key]);
    if (el) el.textContent = String(counts[key] ?? 0);
  });
}

/**
 * Apply current filters (category + search)
 */
function applyFilters() {
  const container = document.getElementById("sosList");
  if (!container) return;

  const searchQuery = document.getElementById("sosSearch")?.value?.trim().toLowerCase() || "";
  let filtered = allReports;

  // Filter by category
  if (currentCategory !== "ALL") {
    filtered = filtered.filter((report) => (report.category || "OTHER").toUpperCase() === currentCategory);
  }

  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter((report) =>
      (report.name && report.name.toLowerCase().includes(searchQuery)) ||
      (report.phone && report.phone.toLowerCase().includes(searchQuery)) ||
      (report.description && report.description.toLowerCase().includes(searchQuery)) ||
      (report.address && report.address.toLowerCase().includes(searchQuery)) ||
      (report.city && report.city.toLowerCase().includes(searchQuery))
    );
  }

  renderReports(filtered, container);
}

/**
 * Render SOS reports to the container
 * @param {Array} reports - Array of SOS report objects
 * @param {HTMLElement} container - Container element
 */
function renderReports(reports, container) {
  container.innerHTML = "";

  if (reports.length === 0) {
    showEmpty(container, "No reports match your search.");
    return;
  }

  reports.forEach((report) => {
    const card = createSOSCard(report);
    container.appendChild(card);
  });
}

/**
 * Create a card element for a SOS report
 * @param {Object} report - SOS report object
 * @returns {HTMLElement} Card element
 */
function createSOSCard(report) {
  const card = createElement("div", "card");
  
  // Normalize image path
  const imagePath = report.imagePath ? report.imagePath.replace(/\\/g, "/") : null;
  const imageUrl = imagePath ? getImageUrl(imagePath) : null;

  // Category badge
  const category = (report.category || "OTHER").toUpperCase();
  const categoryLabels = {
    ADOPTION: { emoji: "🐾", label: "Adoption" },
    LOST: { emoji: "🔍", label: "Lost" },
    INJURED: { emoji: "🏥", label: "Injured" },
    SICK: { emoji: "💊", label: "Sick" },
    OTHER: { emoji: "❓", label: "Other" },
  };
  const catInfo = categoryLabels[category] || categoryLabels.OTHER;
  const categoryBadge = createElement("div", "category-badge");
  categoryBadge.setAttribute("data-category", category);
  categoryBadge.innerHTML = `<span class="emoji">${catInfo.emoji}</span><span>${catInfo.label}</span>`;

  // Media area (image or placeholder) - fixed height for consistent cards
  const media = createElement("div", "card-media");
  if (imageUrl) {
    const img = createElement("img", "card-image");
    img.src = imageUrl;
    img.alt = "SOS Report Image";
    img.addEventListener("click", () => {
      if (window.openImageModal) window.openImageModal(imageUrl);
    });
    img.addEventListener("error", function () {
      // fallback to placeholder if image fails
      media.innerHTML = "";
      const ph = createElement("div", "card-media-placeholder");
      ph.innerHTML = `<div class="emoji">📷</div><div class="hint">No photo</div>`;
      media.appendChild(ph);
    });
    media.appendChild(img);
  } else {
    const ph = createElement("div", "card-media-placeholder");
    ph.innerHTML = `<div class="emoji">🐾</div><div class="hint">No photo provided</div>`;
    media.appendChild(ph);
  }
  card.appendChild(media);

  const content = createElement("div", "card-content");
  
  const currentUser = isAuthenticated() ? getAuthUser() : null;
  const isOwner = currentUser && report.createdBy && report.createdBy.id === currentUser.id;
  const helpersCount = report.helpers ? (Array.isArray(report.helpers) ? report.helpers.length : 0) : 0;

  // Location display
  let locationText = "";
  if (report.city || report.address) {
    const parts = [];
    if (report.address) parts.push(report.address);
    if (report.city) parts.push(report.city);
    locationText = parts.join(", ");
  }

  content.appendChild(categoryBadge);

  const title = createElement("h3", "card-title");
  title.textContent = report.name || "Unknown";
  content.appendChild(title);

  const details = createElement("div", "card-details");

  if (locationText) {
    const loc = createElement("p", "card-line card-location");
    loc.innerHTML = `<span class="icon">📍</span><span class="text">${escapeHTML(locationText)}</span>`;
    details.appendChild(loc);
  }

  const phoneLine = createElement("p", "card-line");
  phoneLine.innerHTML = `<span class="icon">📞</span><span class="text"><strong>Phone:</strong> ${escapeHTML(report.phone || "-")}</span>`;
  details.appendChild(phoneLine);

  const desc = createElement("p", "card-line");
  desc.innerHTML = `<span class="icon">📝</span><span class="text"><strong>Description:</strong> <span class="card-desc">${escapeHTML(report.description || "-")}</span></span>`;
  details.appendChild(desc);

  content.appendChild(details);

  const footer = createElement("div", "card-footer");
  footer.innerHTML = `
    <span class="status-badge status-${report.status || "active"}">${escapeHTML((report.status || "active").toUpperCase())}</span>
    <span>🕒 ${formatDate(report.createdAt)}</span>
    ${helpersCount > 0 ? `<span style="color: var(--success); font-weight: 700;">👥 ${helpersCount} helper${helpersCount > 1 ? "s" : ""}</span>` : ""}
  `;
  content.appendChild(footer);
  
  // Add action buttons for authenticated users
  if (isAuthenticated() && currentUser) {
    const actions = createElement("div", "card-actions");
    
    // "I can help" button (only if not owner)
    if (!isOwner) {
      const helpBtn = createElement("button", "btn btn-secondary");
      helpBtn.textContent = "I can help";
      helpBtn.addEventListener("click", () => handleCanHelp(report.id, helpBtn));
      actions.appendChild(helpBtn);
    }
    
    // Status update controls (only for owner)
    if (isOwner) {
      const statusSelect = createElement("select", "form-input");
      statusSelect.innerHTML = `
        <option value="active" ${report.status === "active" ? "selected" : ""}>Active</option>
        <option value="in-progress" ${report.status === "in-progress" ? "selected" : ""}>In Progress</option>
        <option value="resolved" ${report.status === "resolved" ? "selected" : ""}>Resolved</option>
      `;
      
      const updateStatusBtn = createElement("button", "btn btn-primary");
      updateStatusBtn.textContent = "Update Status";
      updateStatusBtn.addEventListener("click", () => handleStatusUpdate(report.id, statusSelect.value, updateStatusBtn));
      
      actions.appendChild(statusSelect);
      actions.appendChild(updateStatusBtn);
    }
    
    content.appendChild(actions);
  }
  
  card.appendChild(content);

  return card;
}

/**
 * Handle "I can help" button click
 * @param {number} reportId - SOS report ID
 * @param {HTMLElement} button - Button element
 */
async function handleCanHelp(reportId, button) {
  if (!isAuthenticated()) {
    showToast("Please login to help", "error");
    window.location.href = "login.html";
    return;
  }
  
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Helping...";
  
  try {
    await postJSON(`/api/sos/${reportId}/help`, {});
    showToast("Thank you for offering to help!", "success");
    // Reload reports to update helper count
    await loadSOSReports();
  } catch (error) {
    console.error("Failed to mark as helper:", error);
    showToast(error.message || "Failed to mark as helper", "error");
    button.disabled = false;
    button.textContent = originalText;
  }
}

/**
 * Handle status update
 * @param {number} reportId - SOS report ID
 * @param {string} status - New status
 * @param {HTMLElement} button - Button element
 */
async function handleStatusUpdate(reportId, status, button) {
  if (!isAuthenticated()) {
    showToast("Please login to update status", "error");
    window.location.href = "login.html";
    return;
  }
  
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Updating...";
  
  try {
    await putJSON(`/api/sos/${reportId}/status`, { status });
    showToast("Status updated successfully!", "success");
    // Reload reports to show updated status
    await loadSOSReports();
  } catch (error) {
    console.error("Failed to update status:", error);
    showToast(error.message || "Failed to update status", "error");
    button.disabled = false;
    button.textContent = originalText;
  }
}

/**
 * Filter reports by search query
 * @param {string} query - Search query (searches name and phone)
 */
function filterReports(query) {
  applyFilters();
}

/**
 * Get count of all SOS reports
 * @returns {Promise<number>} Total count
 */
async function getSOSCount() {
  try {
    const data = await getJSON("/api/sos");
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error("Failed to get SOS count:", error);
    return 0;
  }
}

// Initialize on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeSOSPage();
  });
} else {
  initializeSOSPage();
}

function initializeSOSPage() {
  const searchInput = document.getElementById("sosSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => applyFilters());
  }

  // Setup category filter buttons
  const categoryFilters = document.querySelectorAll(".category-filter");
  if (categoryFilters && categoryFilters.length) {
    categoryFilters.forEach((button) => {
      button.addEventListener("click", () => {
        categoryFilters.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        currentCategory = button.dataset.category || "ALL";
        applyFilters();
      });
    });
  }
  
  // Load reports if on SOS page
  if (document.getElementById("sosList")) {
    loadSOSReports();
  }
}

// Export for use in other modules
export { loadSOSReports, getSOSCount, filterReports };

