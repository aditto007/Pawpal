/**
 * Navigation module - updates nav links based on auth state
 */

import { isAuthenticated, getAuthUser, clearAuth } from "./auth.js";

/**
 * Update navigation to show login/logout based on auth state
 */
function updateNavigation() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;

  // Remove existing auth links
  const existingAuthLinks = navLinks.querySelectorAll(".nav-auth-link, .nav-logout-btn");
  existingAuthLinks.forEach(link => link.remove());

  if (isAuthenticated()) {
    const user = getAuthUser();
    const userInfo = document.createElement("span");
    userInfo.className = "nav-auth-link";
    userInfo.style.cssText = "color: var(--muted); padding: 8px 16px; margin-right: 8px;";
    userInfo.textContent = `Hello, ${user?.name || "User"}`;

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "nav-link nav-logout-btn";
    logoutBtn.textContent = "Logout";
    logoutBtn.style.cssText = "background: none; border: none; cursor: pointer;";
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = "index.html";
    });

    navLinks.appendChild(userInfo);
    navLinks.appendChild(logoutBtn);
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.className = "nav-link nav-auth-link";
    loginLink.textContent = "Login";

    const signupLink = document.createElement("a");
    signupLink.href = "signup.html";
    signupLink.className = "nav-link nav-auth-link";
    signupLink.textContent = "Sign Up";

    navLinks.appendChild(loginLink);
    navLinks.appendChild(signupLink);
  }
}

export { updateNavigation };


