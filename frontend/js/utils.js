/**
 * Utility functions for DOM manipulation and common helpers
 */

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHTML(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Create a DOM element with optional class and innerHTML
 * @param {string} tag - HTML tag name
 * @param {string} className - Optional CSS class
 * @param {string} innerHTML - Optional inner HTML
 * @returns {HTMLElement} Created element
 */
function createElement(tag, className = "", innerHTML = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = "info") {
  // Remove existing toast if any
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = createElement("div", `toast toast-${type}`);
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show loading spinner in a container
 * @param {HTMLElement} container - Container to show spinner in
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

/**
 * Show error message in a container
 * @param {HTMLElement} container - Container to show error in
 * @param {string} message - Error message
 */
function showError(container, message) {
  container.innerHTML = `
    <div class="error-message">
      <p>⚠️ ${escapeHTML(message)}</p>
    </div>
  `;
}

/**
 * Show empty state message
 * @param {HTMLElement} container - Container to show message in
 * @param {string} message - Message to display
 */
function showEmpty(container, message = "No data available.") {
  container.innerHTML = `
    <div class="empty-state">
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}

export {
  escapeHTML,
  createElement,
  showToast,
  showLoading,
  showError,
  showEmpty,
  formatDate,
};










