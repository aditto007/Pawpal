import { getJSON } from './api.js';

// Get pet ID from URL
const urlParams = new URLSearchParams(window.location.search);
const petId = parseInt(urlParams.get('id'));

let allPets = [];
let currentPet = null;

// Load all pets data
async function loadPetData() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const contentEl = document.getElementById('pet-detail-content');

  try {
    allPets = await getJSON('/data/pets.json');
    currentPet = allPets.find(pet => pet.id === petId);

    if (!currentPet) {
      throw new Error('Pet not found');
    }

    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    contentEl.style.display = 'block';

    renderPetDetail();

  } catch (error) {
    console.error('Error loading pet data:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    contentEl.style.display = 'none';
  }
}

// Render pet detail page
function renderPetDetail() {
  // Header
  document.getElementById('pet-emoji').textContent = currentPet.emoji || '🐾';
  document.getElementById('pet-name').textContent = currentPet.name;
  document.getElementById('pet-species').textContent = currentPet.species;

  // Breeds
  const breedsContainer = document.getElementById('breeds-container');
  if (currentPet.breeds && currentPet.breeds.length > 0) {
    breedsContainer.innerHTML = currentPet.breeds.map(breed => `
      <div class="breed-card">
        <h4 class="breed-name">${breed.name}</h4>
        <p class="breed-info"><strong>Care Requirements:</strong> ${breed.careRequirements}</p>
        <p class="breed-info"><strong>Diet:</strong> ${breed.diet}</p>
      </div>
    `).join('');
  } else {
    breedsContainer.innerHTML = '<p style="color: #6c757d;">Breed information coming soon!</p>';
  }

  // Diets
  const dietsContainer = document.getElementById('diets-container');
  if (currentPet.recommendedDiets && currentPet.recommendedDiets.length > 0) {
    dietsContainer.innerHTML = currentPet.recommendedDiets.map(diet => `
      <div class="diet-item">${diet}</div>
    `).join('');
  } else {
    dietsContainer.innerHTML = '<p style="color: #6c757d;">Diet information coming soon!</p>';
  }

  // Diseases
  const diseasesContainer = document.getElementById('diseases-container');
  if (currentPet.commonDiseases && currentPet.commonDiseases.length > 0) {
    diseasesContainer.innerHTML = currentPet.commonDiseases.map(disease => `
      <div class="disease-card">
        <h4 class="disease-name">${disease.name}</h4>
        <div>
          <strong style="color: #dc3545;">Symptoms:</strong>
          <ul class="symptoms-list">
            ${disease.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
          </ul>
        </div>
        <div>
          <strong style="color: #28a745;">Remedy:</strong>
          <p class="remedy-text">${disease.remedy}</p>
        </div>
      </div>
    `).join('');
  } else {
    diseasesContainer.innerHTML = '<p style="color: #6c757d;">Disease information coming soon!</p>';
  }

  // Medicine Recommendations
  const medicineContainer = document.getElementById('medicine-container');
  if (currentPet.medicineRecommendations && currentPet.medicineRecommendations.length > 0) {
    medicineContainer.innerHTML = currentPet.medicineRecommendations.map(medicine => `
      <div class="medicine-item">${medicine}</div>
    `).join('');
  } else {
    medicineContainer.innerHTML = '<p style="color: #6c757d;">Medicine recommendations coming soon!</p>';
  }
}

// Symptom checker function
window.checkSymptoms = function() {
  const input = document.getElementById('symptom-input').value.toLowerCase().trim();
  const resultBox = document.getElementById('symptom-result');

  if (!input) {
    resultBox.className = 'result-box show no-match';
    resultBox.innerHTML = '<strong>Please enter symptoms to check.</strong>';
    return;
  }

  if (!currentPet || !currentPet.commonDiseases) {
    resultBox.className = 'result-box show no-match';
    resultBox.innerHTML = '<strong>Disease data not available for this pet.</strong>';
    return;
  }

  // Extract symptoms from input (split by commas, "and", "or", etc.)
  const inputSymptoms = input
    .split(/[,\s]+(?:and|or|,)\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // If only one word, treat it as a single symptom
  const symptomCount = inputSymptoms.length > 1 ? inputSymptoms.length : 1;
  const inputWords = input.split(/\s+/).filter(w => w.length > 2); // Filter out short words

  const matches = [];

  currentPet.commonDiseases.forEach(disease => {
    const diseaseSymptoms = disease.symptoms.map(s => s.toLowerCase());
    const diseaseName = disease.name.toLowerCase();
    
    // Count how many symptoms match
    let matchedSymptoms = [];
    let matchScore = 0;
    
    diseaseSymptoms.forEach(symptom => {
      // Check if any input word or phrase matches this symptom
      const matchesSymptom = inputWords.some(word => 
        symptom.includes(word) || word.includes(symptom.split(' ')[0])
      ) || inputSymptoms.some(inputSymptom => 
        symptom.includes(inputSymptom) || inputSymptom.includes(symptom.split(' ')[0])
      );
      
      if (matchesSymptom) {
        matchedSymptoms.push(symptom);
        matchScore++;
      }
    });

    // Calculate confidence based on:
    // 1. Number of matched symptoms
    // 2. Ratio of matched symptoms to total symptoms
    // 3. Total number of symptoms provided
    const totalSymptoms = diseaseSymptoms.length;
    const matchRatio = matchScore / totalSymptoms;
    const confidence = (matchScore * 30) + (matchRatio * 40) + (Math.min(symptomCount, 3) * 10);
    
    // Only include if at least one symptom matches
    if (matchScore > 0) {
      matches.push({
        disease: disease,
        matchScore: matchScore,
        matchedSymptoms: matchedSymptoms,
        totalSymptoms: totalSymptoms,
        confidence: confidence,
        matchRatio: matchRatio
      });
    }
  });

  // Sort by confidence score
  matches.sort((a, b) => b.confidence - a.confidence);

  if (matches.length > 0) {
    const topMatch = matches[0];
    const isHighConfidence = topMatch.matchScore >= 2 && topMatch.matchRatio >= 0.4;
    const isLowConfidence = topMatch.matchScore === 1 && symptomCount === 1;
    
    // For single symptom matches, show a more cautious message
    if (isLowConfidence) {
      resultBox.className = 'result-box show no-match';
      resultBox.innerHTML = `
        <div style="text-align: center;">
          <p style="font-size: 1.1rem; margin-bottom: 15px; color: #6c757d;">
            <strong>⚠️ Insufficient Information</strong>
          </p>
          <p style="margin-bottom: 15px;">
            You've entered <strong>"${input}"</strong> which could be related to several conditions, but a single symptom isn't enough for an accurate assessment.
          </p>
          <p style="margin-bottom: 15px; color: #856404;">
            <strong>💡 Tip:</strong> Please enter <strong>multiple symptoms</strong> your pet is experiencing (e.g., "vomiting, lethargy, loss of appetite") for a more accurate check.
          </p>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> If your pet is showing concerning symptoms, especially if they persist or worsen, please consult a veterinarian for proper diagnosis.
            </p>
          </div>
        </div>
      `;
    } else if (isHighConfidence) {
      // High confidence match
      resultBox.className = 'result-box show match';
      resultBox.innerHTML = `
        <div style="margin-bottom: 15px;">
          <strong style="color: #856404;">🔍 Possible Match (${topMatch.matchScore} of ${topMatch.totalSymptoms} symptoms match):</strong>
          <h4 style="margin: 10px 0; color: #856404;">${topMatch.disease.name}</h4>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0;"><strong>Matched Symptoms:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            ${topMatch.matchedSymptoms.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div style="background: #e7f5e7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0;"><strong>All Symptoms:</strong> ${topMatch.disease.symptoms.join(', ')}</p>
          <p style="margin: 0;"><strong>Remedy:</strong> ${topMatch.disease.remedy}</p>
        </div>
        ${matches.length > 1 ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0 0 8px 0; font-size: 0.9rem;"><strong>Other possible matches:</strong></p>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.9rem;">
              ${matches.slice(1, 3).map(m => `<li>${m.disease.name} (${m.matchScore} symptoms match)</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; color: #856404; font-size: 0.9rem;">
            <strong>⚠️ Important:</strong> This is a basic symptom checker and not a substitute for professional veterinary diagnosis. Always consult a veterinarian for proper diagnosis and treatment.
          </p>
        </div>
      `;
    } else {
      // Medium confidence
      resultBox.className = 'result-box show match';
      resultBox.innerHTML = `
        <div style="margin-bottom: 15px;">
          <strong style="color: #856404;">🔍 Possible Match (${topMatch.matchScore} symptom${topMatch.matchScore > 1 ? 's' : ''} match):</strong>
          <h4 style="margin: 10px 0; color: #856404;">${topMatch.disease.name}</h4>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0;"><strong>Matched Symptoms:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            ${topMatch.matchedSymptoms.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; color: #856404;">
            <strong>💡 Note:</strong> This disease typically has ${topMatch.totalSymptoms} symptoms. You've matched ${topMatch.matchScore}. 
            Please enter <strong>more symptoms</strong> for a more accurate assessment.
          </p>
        </div>
        <div style="background: #e7f5e7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0;"><strong>All Symptoms:</strong> ${topMatch.disease.symptoms.join(', ')}</p>
          <p style="margin: 0;"><strong>Remedy:</strong> ${topMatch.disease.remedy}</p>
        </div>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; color: #856404; font-size: 0.9rem;">
            <strong>⚠️ Important:</strong> This is a basic symptom checker. Always consult a veterinarian for proper diagnosis and treatment.
          </p>
        </div>
      `;
    }
  } else {
    resultBox.className = 'result-box show no-match';
    resultBox.innerHTML = `
      <div style="text-align: center;">
        <p style="font-size: 1.1rem; margin-bottom: 15px;">
          <strong>No matches found</strong>
        </p>
        <p style="margin-bottom: 15px; color: #6c757d;">
          The symptoms you entered don't match common diseases for ${currentPet.name} in our database.
        </p>
        <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; color: #0c5460;">
            <strong>💡 Tip:</strong> Try entering multiple symptoms separated by commas (e.g., "vomiting, lethargy, loss of appetite").
          </p>
        </div>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> If your pet is showing concerning symptoms, please consult a veterinarian immediately.
          </p>
        </div>
      </div>
    `;
  }
};

// Allow Enter key to trigger symptom check
document.addEventListener('DOMContentLoaded', () => {
  const symptomInput = document.getElementById('symptom-input');
  if (symptomInput) {
    symptomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkSymptoms();
      }
    });
  }
});

// Load pet data when page loads
loadPetData();

