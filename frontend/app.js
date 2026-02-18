// Adjust if you changed ports/origin
const API_BASE = "http://localhost:8080";

const form = document.getElementById("sosForm");
const list = document.getElementById("list");
const refreshBtn = document.getElementById("refreshBtn");
const clinicsBox = document.getElementById("clinics");
const loadClinicsBtn = document.getElementById("loadClinicsBtn");

// ---------- Helpers ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

function fullImageUrl(path) {
  if (!path) return "";
  // normalize & guard against accidental double slashes
  const clean = path.replace(/\\/g, "/");
  return clean.startsWith("/uploads/") ? `${API_BASE}${clean}` : `${API_BASE}/uploads/${clean}`;
}

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

// ---------- SOS Submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  try {
    const res = await fetch(`${API_BASE}/api/sos`, { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();
      alert(`POST failed: ${res.status} ${text}`);
      return;
    }
    form.reset();
    await loadReports();
    alert("SOS created!");
  } catch (err) {
    alert("Network/JS error: " + err.message);
  }
});

// ---------- Load Reports ----------
refreshBtn.addEventListener("click", loadReports);

async function loadReports() {
  list.textContent = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/api/sos`);
    if (!res.ok) {
      list.textContent = `GET failed: ${res.status}`;
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      list.textContent = "No reports yet.";
      return;
    }
    // newest first
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = "";
    for (const r of data) {
      // 🔧 normalize imagePath in case DB has backslashes
      if (r.imagePath) r.imagePath = r.imagePath.replace(/\\/g, "/");
      const imgUrl = fullImageUrl(r.imagePath);

      const card = el("div", "card-sm");
      card.innerHTML = `
        ${imgUrl ? `<img src="${imgUrl}" alt="sos" onerror="this.style.display='none'">` : ""}
        <div>
          <p><b>Name:</b> ${escapeHtml(r.name ?? "")}</p>
          <p><b>Phone:</b> ${escapeHtml(r.phone ?? "")}</p>
          <p><b>Description:</b> ${escapeHtml(r.description ?? "")}</p>
          <p><b>Time:</b> ${r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</p>
          ${r.imagePath ? `<p><small>imagePath: <code>${escapeHtml(r.imagePath)}</code></small></p>` : ""}
        </div>
      `;
      list.appendChild(card);
    }
  } catch (err) {
    list.textContent = "Network/JS error: " + err.message;
  }
}

// ---------- Load Clinics ----------
loadClinicsBtn.addEventListener("click", loadClinics);

async function loadClinics() {
  clinicsBox.textContent = "Loading organizations...";
  try {
    const res = await fetch(`${API_BASE}/api/clinics`);
    if (!res.ok) {
      clinicsBox.textContent = `GET organizations failed: ${res.status}`;
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      clinicsBox.textContent = "No organizations found.";
      return;
    }
    clinicsBox.innerHTML = "";
    for (const org of data) {
      const d = el("div", "clinic");
      const typeLabel = org.type ? org.type.charAt(0) + org.type.slice(1).toLowerCase() : "Organization";
      let hoursHtml = "";
      if (org.openHours && org.closeHours) {
        hoursHtml = `<div>Hours: ${escapeHtml(org.openHours)} – ${escapeHtml(org.closeHours)}</div>`;
      }
      d.innerHTML = `
        <div><b>${escapeHtml(org.name || "")}</b> <span style="color: #666; font-size: 0.9em;">(${escapeHtml(typeLabel)})</span></div>
        <div>Address: ${escapeHtml(org.address || "-")}</div>
        <div>City: ${escapeHtml(org.city || "-")}</div>
        ${hoursHtml}
        <div>Phone: ${escapeHtml(org.phone || "-")}</div>
      `;
      clinicsBox.appendChild(d);
    }
  } catch (err) {
    clinicsBox.textContent = "Network/JS error: " + err.message;
  }
}

// auto-load on open
loadReports();
