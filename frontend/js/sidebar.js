/**
 * Left Sidebar Navigation Component
 */

import { isAuthenticated, getAuthUser, clearAuth } from "./auth.js";

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-content">
      <div class="sidebar-header">
        <a href="index.html" class="sidebar-logo">
          <span class="sidebar-logo-icon">🐾</span>
          <span class="sidebar-logo-text">PawPal</span>
        </a>
      </div>
      <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
        <span class="toggle-icon">◀</span>
      </button>
      <nav class="sidebar-nav" id="sidebarNav">
        <a href="index.html" class="sidebar-link" data-page="home" data-tooltip="Home">
          <span class="link-icon icon-home">🏠</span>
          <span class="link-text">Home</span>
        </a>

        <!-- SOS section (only visible when logged in) -->
        <div id="sosNavGroup" data-auth="required">
          <a href="sos.html" class="sidebar-link" data-page="sos" data-tooltip="SOS Reports">
            <span class="link-icon icon-sos">🆘</span>
            <span class="link-text">SOS Reports</span>
          </a>
          <a href="sos_new.html" class="sidebar-link" data-page="new-sos" data-tooltip="New SOS">
            <span class="link-icon icon-plus">✨</span>
            <span class="link-text">New SOS</span>
          </a>
          <a href="my_sos.html" class="sidebar-link" data-page="my-sos" data-tooltip="My SOS">
            <span class="link-icon icon-clipboard">📋</span>
            <span class="link-text">My SOS</span>
          </a>
          <div class="sidebar-divider"></div>
        </div>

        <a href="clinics.html" class="sidebar-link" data-page="clinics" data-tooltip="Clinics">
          <span class="link-icon icon-clinic">🏥</span>
          <span class="link-text">Clinics</span>
        </a>
        <a href="ngos.html" class="sidebar-link" data-page="ngos" data-tooltip="NGOs">
          <span class="link-icon icon-ngo">🤝</span>
          <span class="link-text">NGOs</span>
        </a>
        <a href="shelters.html" class="sidebar-link" data-page="shelters" data-tooltip="Shelters">
          <span class="link-icon icon-shelter">🏡</span>
          <span class="link-text">Shelters</span>
        </a>
        <a href="pet_hostels.html" class="sidebar-link" data-page="pet-hostels" data-tooltip="Pet Hostels">
          <span class="link-icon icon-hostel">🏨</span>
          <span class="link-text">Pet Hostels</span>
        </a>
        <div class="sidebar-divider"></div>
        <a href="pets.html" class="sidebar-link" data-page="pets" data-tooltip="Pet Info Hub">
          <span class="link-icon icon-books">📖</span>
          <span class="link-text">Pet Info Hub</span>
        </a>
        <a href="pet_care.html" class="sidebar-link" data-page="pet-care" data-tooltip="Pet Care Guide">
          <span class="link-icon icon-care">💚</span>
          <span class="link-text">Pet Care Guide</span>
        </a>
        <a href="pet_supplies.html" class="sidebar-link" data-page="pet-supplies" data-tooltip="Pet Supplies">
          <span class="link-icon icon-supplies">🛒</span>
          <span class="link-text">Pet Supplies</span>
        </a>
        <div class="sidebar-auth" id="sidebarAuth">
          <!-- Auth links will be inserted here -->
        </div>
      </nav>
    </div>
  `;
  return sidebar;
}

export function initSidebar() {
  const existingSidebar = document.querySelector('.sidebar');
  if (existingSidebar) return;
  
  const sidebar = createSidebar();
  document.body.insertBefore(sidebar, document.body.firstChild);
  
  // Set active link based on current page
  updateActiveLink();
  
  // Collapsible sidebar functionality
  const toggle = document.getElementById('sidebarToggle');
  const sidebarEl = document.querySelector('.sidebar');
  const body = document.body;
  
  // Check localStorage for saved state
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (isCollapsed) {
    sidebarEl.classList.add('collapsed');
    body.classList.add('sidebar-collapsed');
  }
  
  if (toggle && sidebarEl) {
    toggle.addEventListener('click', () => {
      sidebarEl.classList.toggle('collapsed');
      body.classList.toggle('sidebar-collapsed');
      
      // Save state to localStorage
      const collapsed = sidebarEl.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
    });
  }
  
  // Update auth section
  updateAuthSection();
  updateProtectedNavVisibility();
}

function updateActiveLink() {
  const currentPage = getCurrentPage();
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  
  const pageMap = {
    'index.html': 'home',
    'sos.html': 'sos',
    'sos_new.html': 'new-sos',
    'my_sos.html': 'my-sos',
    'clinics.html': 'clinics',
    'ngos.html': 'ngos',
    'shelters.html': 'shelters',
    'pet_hostels.html': 'pet-hostels',
    'pets.html': 'pets',
    'pet_detail.html': 'pets',
    'pet_care.html': 'pet-care',
    'pet_supplies.html': 'pet-supplies',
    'login.html': 'login',
    'signup.html': 'signup'
  };
  
  return pageMap[page] || 'home';
}

function updateAuthSection() {
  const authSection = document.getElementById('sidebarAuth');
  if (!authSection) return;
  
  if (isAuthenticated()) {
    const user = getAuthUser();
    authSection.innerHTML = `
      <div class="sidebar-user">
        <span class="user-icon">👤</span>
        <span class="user-name">${user?.name || 'User'}</span>
      </div>
      <a href="#" class="sidebar-link" id="logoutLink" data-tooltip="Logout" data-page="logout">
        <span class="link-icon icon-logout">👋</span>
        <span class="link-text">Logout</span>
      </a>
    `;
    
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Use the same keys as the rest of the app (pawpal_token / pawpal_user)
        clearAuth();
        window.location.href = 'index.html';
      });
    }
  } else {
    authSection.innerHTML = `
      <a href="login.html" class="sidebar-link" data-page="login" data-tooltip="Login">
        <span class="link-icon icon-key">🔑</span>
        <span class="link-text">Login</span>
      </a>
      <a href="signup.html" class="sidebar-link" data-page="signup" data-tooltip="Sign Up">
        <span class="link-icon icon-user-plus">✍️</span>
        <span class="link-text">Sign Up</span>
      </a>
    `;
  }

  // After auth UI renders, ensure protected nav is in the correct state
  updateProtectedNavVisibility();
}

function updateProtectedNavVisibility() {
  const sosGroup = document.getElementById('sosNavGroup');
  if (!sosGroup) return;

  // Hide SOS section when not logged in
  sosGroup.style.display = isAuthenticated() ? "" : "none";
}

