/**
 * Image modal functionality
 * Global functions for opening/closing image modal
 */

/**
 * Open image modal with the specified image URL
 * @param {string} imageUrl - URL of the image to display
 */
function openImageModal(imageUrl) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  
  if (modal && modalImg) {
    modal.style.display = "block";
    modalImg.src = imageUrl;
  }
}

/**
 * Close the image modal
 */
function closeImageModal() {
  const modal = document.getElementById("imageModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// Close modal when clicking outside the image
window.addEventListener("click", (event) => {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeImageModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeImageModal();
  }
});

