/**
 * Cute Header Component with PawPal branding
 */

export function createHeader() {
  const header = document.createElement('header');
  header.className = 'cute-header';
  header.innerHTML = `
    <div class="header-content">
      <div class="header-logo">
        <span class="logo-emoji">🐾</span>
        <h1 class="logo-text">PawPal</h1>
        <span class="logo-emoji">🐾</span>
      </div>
      <div class="header-animals">
        <span class="animal-emoji animal-1">🐕</span>
        <span class="animal-emoji animal-2">🐈</span>
        <span class="animal-emoji animal-3">🐰</span>
        <span class="animal-emoji animal-4">🐹</span>
        <span class="animal-emoji animal-5">🐦</span>
        <span class="animal-emoji animal-6">🐢</span>
        <span class="animal-emoji animal-7">🐠</span>
        <span class="animal-emoji animal-8">🦜</span>
      </div>
    </div>
  `;
  return header;
}

export function initHeader() {
  const existingHeader = document.querySelector('.cute-header');
  if (existingHeader) return;
  
  const header = createHeader();
  // Insert at the very beginning, before any other content
  if (document.body.firstChild) {
    document.body.insertBefore(header, document.body.firstChild);
  } else {
    document.body.appendChild(header);
  }
}

