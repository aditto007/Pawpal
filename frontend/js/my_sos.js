import { getJSON, putJSON, getImageUrl } from "./api.js";
import { requireAuth, getAuthUser } from "./auth.js";
import { updateNavigation } from "./nav.js";
import { createElement, escapeHTML, showLoading, showEmpty, showError, formatDate, showToast } from "./utils.js";

const isAllowed = requireAuth();
if (!isAllowed) {
  throw new Error("Authentication required");
}

updateNavigation();

const listContainer = document.getElementById("mySosList");
const subtitle = document.getElementById("mySosSubtitle");
const currentUser = getAuthUser();

if (currentUser && subtitle) {
  subtitle.textContent = `Reports submitted by ${currentUser.name || "you"}`;
}

async function loadMyReports() {
  if (!listContainer) return;
  showLoading(listContainer);

  try {
    const reports = await getJSON("/api/sos/mine");
    if (!Array.isArray(reports) || reports.length === 0) {
      showEmpty(listContainer, "You haven't created any SOS reports yet.");
      return;
    }
    renderReports(reports);
  } catch (error) {
    console.error("Failed to load personal SOS reports:", error);
    showError(listContainer, error.message || "Failed to load your SOS reports.");
  }
}

function renderReports(reports) {
  listContainer.innerHTML = "";
  reports.forEach((report) => {
    listContainer.appendChild(createMySosCard(report));
  });
}

function createMySosCard(report) {
  const card = createElement("div", "card");

  const imagePath = report.imagePath ? report.imagePath.replace(/\\/g, "/") : null;
  const imageUrl = imagePath ? getImageUrl(imagePath) : null;

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

  // Category badge (if available)
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
  content.appendChild(categoryBadge);

  const title = createElement("h3", "card-title");
  title.textContent = report.name || currentUser?.name || "Me";
  content.appendChild(title);

  const details = createElement("div", "card-details");

  const locationText = [report.address, report.city].filter(Boolean).join(", ");
  if (locationText) {
    const loc = createElement("p", "card-line card-location");
    loc.innerHTML = `<span class="icon">📍</span><span class="text">${escapeHTML(locationText)}</span>`;
    details.appendChild(loc);
  }

  const phoneLine = createElement("p", "card-line");
  phoneLine.innerHTML = `<span class="icon">📞</span><span class="text"><strong>Phone:</strong> ${escapeHTML(report.phone || currentUser?.phone || "-")}</span>`;
  details.appendChild(phoneLine);

  const desc = createElement("p", "card-line");
  desc.innerHTML = `<span class="icon">📝</span><span class="text"><strong>Description:</strong> <span class="card-desc">${escapeHTML(report.description || "-")}</span></span>`;
  details.appendChild(desc);

  content.appendChild(details);

  const helpersCount = Array.isArray(report.helpers) ? report.helpers.length : 0;
  const footer = createElement("div", "card-footer");
  footer.innerHTML = `
    <span class="status-badge status-${report.status || "active"}">${escapeHTML((report.status || "active").toUpperCase())}</span>
    <span>🕒 ${formatDate(report.createdAt)}</span>
    ${helpersCount > 0 ? `<span style="color: var(--success); font-weight: 700;">👥 ${helpersCount} helper${helpersCount > 1 ? "s" : ""}</span>` : ""}
  `;
  content.appendChild(footer);

  const actions = createElement("div", "card-actions");

  const statusSelect = createElement("select", "form-input");
  statusSelect.innerHTML = `
    <option value="active" ${report.status === "active" ? "selected" : ""}>Active</option>
    <option value="in-progress" ${report.status === "in-progress" ? "selected" : ""}>In Progress</option>
    <option value="resolved" ${report.status === "resolved" ? "selected" : ""}>Resolved</option>
  `;

  const updateBtn = createElement("button", "btn btn-primary");
  updateBtn.textContent = "Update Status";
  updateBtn.addEventListener("click", () => handleStatusUpdate(report.id, statusSelect.value, updateBtn));

  actions.appendChild(statusSelect);
  actions.appendChild(updateBtn);
  content.appendChild(actions);

  card.appendChild(content);
  return card;
}

async function handleStatusUpdate(reportId, status, button) {
  const previous = button.textContent;
  button.disabled = true;
  button.textContent = "Updating...";

  try {
    await putJSON(`/api/sos/${reportId}/status`, { status });
    showToast("Status updated", "success");
    await loadMyReports();
  } catch (error) {
    console.error("Failed to update status:", error);
    showToast(error.message || "Failed to update status", "error");
    button.disabled = false;
    button.textContent = previous;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadMyReports);
} else {
  loadMyReports();
}

