// Settings Management
function getSettings() {
  const settings = localStorage.getItem('anki_settings');
  return settings ? JSON.parse(settings) : null;
}

function saveSettings(settings) {
  localStorage.setItem('anki_settings', JSON.stringify(settings));
}

function clearSettings() {
  localStorage.removeItem('anki_settings');
}

// Load settings on page load and populate form
function loadSettingsIntoForm() {
  const settings = getSettings();
  if (settings) {
    document.getElementById('openai-key').value = settings.openaiApiKey || '';
    document.getElementById('nanobanana-key').value = settings.nanoBananaApiKey || '';
    document.getElementById('aws-access-key').value = settings.awsAccessKeyId || '';
    document.getElementById('aws-secret-key').value = settings.awsSecretAccessKey || '';
    document.getElementById('aws-region').value = settings.awsRegion || 'us-east-1';
    document.getElementById('custom-prompt').value = settings.customSystemPrompt || '';
  }
}

// Settings form handling
const saveSettingsBtn = document.getElementById('save-settings-btn');
const clearSettingsBtn = document.getElementById('clear-settings-btn');
const settingsMessage = document.getElementById('settings-message');

saveSettingsBtn.addEventListener('click', () => {
  const customPrompt = document.getElementById('custom-prompt').value.trim();
  const settings = {
    openaiApiKey: document.getElementById('openai-key').value.trim(),
    nanoBananaApiKey: document.getElementById('nanobanana-key').value.trim(),
    awsAccessKeyId: document.getElementById('aws-access-key').value.trim(),
    awsSecretAccessKey: document.getElementById('aws-secret-key').value.trim(),
    awsRegion: document.getElementById('aws-region').value.trim() || 'us-east-1',
  };
  
  // Only include customSystemPrompt if it's not empty
  if (customPrompt) {
    settings.customSystemPrompt = customPrompt;
  }
  
  saveSettings(settings);
  
  settingsMessage.innerHTML = '<div style="color: var(--success); margin-top: 1rem;">✓ Settings saved successfully!</div>';
  setTimeout(() => {
    settingsMessage.innerHTML = '';
  }, 3000);
});

clearSettingsBtn.addEventListener('click', () => {
  clearSettings();
  document.getElementById('openai-key').value = '';
  document.getElementById('nanobanana-key').value = '';
  document.getElementById('aws-access-key').value = '';
  document.getElementById('aws-secret-key').value = '';
  document.getElementById('aws-region').value = 'us-east-1';
  document.getElementById('custom-prompt').value = '';
  
  settingsMessage.innerHTML = '<div style="color: var(--success); margin-top: 1rem;">✓ Settings cleared</div>';
  setTimeout(() => {
    settingsMessage.innerHTML = '';
  }, 3000);
});

// Load settings on page load
loadSettingsIntoForm();

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Update active tab button
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update active tab content
    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
    
    // Load data when switching to browse tab
    if (targetTab === 'browse') {
      loadCards();
    }
  });
});

// Single Input
const singleProcessBtn = document.getElementById('process-btn');
const singleResult = document.getElementById('single-result');
const singleLoading = document.getElementById('single-loading');

singleProcessBtn.addEventListener('click', async () => {
  const input = document.getElementById('japanese-input').value.trim();
  
  if (!input) {
    alert('Please enter some Japanese text');
    return;
  }
  
  singleLoading.classList.remove('hidden');
  singleResult.classList.add('hidden');
  singleProcessBtn.disabled = true;
  
  try {
    const settings = getSettings();
    const credentials = settings ? {
      openaiApiKey: settings.openaiApiKey,
      nanoBananaApiKey: settings.nanoBananaApiKey,
      customSystemPrompt: settings.customSystemPrompt,
      awsCredentials: {
        accessKeyId: settings.awsAccessKeyId,
        secretAccessKey: settings.awsSecretAccessKey,
        region: settings.awsRegion,
      },
    } : null;
    
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, credentials }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Processing failed');
    }
    
    const result = await response.json();
    displaySingleResult(result);
    
    // Clear input
    document.getElementById('japanese-input').value = '';
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    singleLoading.classList.add('hidden');
    singleProcessBtn.disabled = false;
  }
});

function displaySingleResult(result) {
  const hasCasual = result.has_polite_and_casual;
  
  const html = `
    <div class="result-card">
      <div class="result-section">
        <div class="result-label">Polite Form</div>
        <div class="japanese-text">${result.polite_jp}</div>
        <div class="english-text">${result.translation_polite}</div>
      </div>
      
      ${hasCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Form</div>
          <div class="japanese-text">${result.casual_jp}</div>
          <div class="english-text">${result.translation_casual}</div>
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Image</div>
        <img src="/media/${getFilename(result.media.imagePolite)}" alt="Polite form" class="result-image">
      </div>
      
      ${hasCasual && result.media.imageCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Image</div>
          <img src="/media/${getFilename(result.media.imageCasual)}" alt="Casual form" class="result-image">
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Audio</div>
        <audio controls class="audio-player">
          <source src="/media/${getFilename(result.media.audioPolite)}" type="audio/mpeg">
        </audio>
      </div>
      
      ${hasCasual && result.media.audioCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Audio</div>
          <audio controls class="audio-player">
            <source src="/media/${getFilename(result.media.audioCasual)}" type="audio/mpeg">
          </audio>
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Notes</div>
        <p>${result.notes}</p>
      </div>
    </div>
  `;
  
  singleResult.innerHTML = html;
  singleResult.classList.remove('hidden');
}

// Bulk Upload
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const bulkResult = document.getElementById('bulk-result');
const bulkLoading = document.getElementById('bulk-loading');

fileInput.addEventListener('change', (e) => {
  uploadBtn.disabled = !e.target.files.length;
});

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file');
    return;
  }
  
  bulkLoading.classList.remove('hidden');
  bulkResult.classList.add('hidden');
  uploadBtn.disabled = true;
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add credentials to form data if available
  const settings = getSettings();
  if (settings) {
    const credentials = {
      openaiApiKey: settings.openaiApiKey,
      nanoBananaApiKey: settings.nanoBananaApiKey,
      customSystemPrompt: settings.customSystemPrompt,
      awsCredentials: {
        accessKeyId: settings.awsAccessKeyId,
        secretAccessKey: settings.awsSecretAccessKey,
        region: settings.awsRegion,
      },
    };
    formData.append('credentials', JSON.stringify(credentials));
  }
  
  try {
    const response = await fetch('/api/bulk-upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    const result = await response.json();
    displayBulkResult(result);
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    bulkLoading.classList.add('hidden');
    uploadBtn.disabled = false;
    fileInput.value = '';
  }
});

function displayBulkResult(result) {
  const html = `
    <div class="bulk-result">
      <h3>Upload Complete</h3>
      <div class="bulk-summary">
        <div class="summary-item">
          <span>Total inputs:</span>
          <strong>${result.total}</strong>
        </div>
        <div class="summary-item">
          <span style="color: var(--success);">Successfully processed:</span>
          <strong style="color: var(--success);">${result.processed}</strong>
        </div>
        <div class="summary-item">
          <span style="color: var(--danger);">Failed:</span>
          <strong style="color: var(--danger);">${result.failed}</strong>
        </div>
      </div>
      
      ${result.errors.length > 0 ? `
        <div class="error-list">
          <h4>Errors:</h4>
          ${result.errors.slice(0, 10).map(err => `
            <div class="error-item">
              <strong>${err.input}</strong>: ${err.error}
            </div>
          `).join('')}
          ${result.errors.length > 10 ? `<p>... and ${result.errors.length - 10} more errors</p>` : ''}
        </div>
      ` : ''}
    </div>
  `;
  
  bulkResult.innerHTML = html;
  bulkResult.classList.remove('hidden');
}

// Card Browser
const cardGrid = document.getElementById('card-grid');
const searchInput = document.getElementById('search-input');
let currentPage = 1;
let currentSearch = '';

async function loadCards(page = 1, search = '') {
  try {
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) {
      params.set('search', search);
    }
    
    const response = await fetch(`/api/cards?${params}`);
    const data = await response.json();
    
    displayCards(data.cards);
    displayPagination(data.pagination);
    updateStats(data.cards.length);
  } catch (error) {
    console.error('Error loading cards:', error);
  }
}

function displayCards(cards) {
  if (cards.length === 0) {
    cardGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-light);">No cards found</p>';
    return;
  }
  
  cardGrid.innerHTML = cards.map(card => `
    <div class="card-preview" onclick="showCardDetail('${card.id}')">
      <img src="/media/${getFilename(card.media.imagePolite)}" alt="Card" class="card-preview-image" onerror="this.src='/placeholder.png'">
      <div class="card-preview-body">
        <div class="card-preview-text">${card.polite_jp}</div>
        <div class="card-preview-translation">${card.translation_polite}</div>
      </div>
    </div>
  `).join('');
}

function displayPagination(pagination) {
  const paginationEl = document.getElementById('pagination');
  
  if (pagination.totalPages <= 1) {
    paginationEl.classList.add('hidden');
    return;
  }
  
  paginationEl.classList.remove('hidden');
  
  const buttons = [];
  
  // Previous button
  buttons.push(`
    <button onclick="changePage(${pagination.page - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>
      Previous
    </button>
  `);
  
  // Page numbers
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 ||
      i === pagination.totalPages ||
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      buttons.push(`
        <button onclick="changePage(${i})" class="${i === pagination.page ? 'active' : ''}">
          ${i}
        </button>
      `);
    } else if (
      i === pagination.page - 3 ||
      i === pagination.page + 3
    ) {
      buttons.push('<span>...</span>');
    }
  }
  
  // Next button
  buttons.push(`
    <button onclick="changePage(${pagination.page + 1})" ${!pagination.hasNext ? 'disabled' : ''}>
      Next
    </button>
  `);
  
  paginationEl.innerHTML = buttons.join('');
}

async function updateStats(count) {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    document.getElementById('browse-stats').innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Cards:</span>
        <span class="stat-value">${stats.total}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Showing:</span>
        <span class="stat-value">${count}</span>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function changePage(page) {
  currentPage = page;
  loadCards(page, currentSearch);
}

searchInput.addEventListener('input', debounce((e) => {
  currentSearch = e.target.value;
  currentPage = 1;
  loadCards(1, currentSearch);
}, 500));

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Card Detail Modal
const modal = document.getElementById('card-modal');
const modalBody = document.getElementById('modal-body');

async function showCardDetail(cardId) {
  try {
    const response = await fetch(`/api/cards/${cardId}`);
    const card = await response.json();
    
    const hasCasual = card.has_polite_and_casual;
    
    modalBody.innerHTML = `
      <h2>Card Details</h2>
      
      <div class="result-section">
        <div class="result-label">Polite Form</div>
        <div class="japanese-text">${card.polite_jp}</div>
        <div class="english-text">${card.translation_polite}</div>
      </div>
      
      ${hasCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Form</div>
          <div class="japanese-text">${card.casual_jp}</div>
          <div class="english-text">${card.translation_casual}</div>
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Image</div>
        <img src="/media/${getFilename(card.media.imagePolite)}" alt="Polite form" class="result-image">
      </div>
      
      ${hasCasual && card.media.imageCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Image</div>
          <img src="/media/${getFilename(card.media.imageCasual)}" alt="Casual form" class="result-image">
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Audio</div>
        <audio controls class="audio-player">
          <source src="/media/${getFilename(card.media.audioPolite)}" type="audio/mpeg">
        </audio>
      </div>
      
      ${hasCasual && card.media.audioCasual ? `
        <div class="result-section">
          <div class="result-label">Casual Audio</div>
          <audio controls class="audio-player">
            <source src="/media/${getFilename(card.media.audioCasual)}" type="audio/mpeg">
          </audio>
        </div>
      ` : ''}
      
      <div class="result-section">
        <div class="result-label">Notes</div>
        <p>${card.notes}</p>
      </div>
    `;
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading card:', error);
  }
}

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Helper function
function getFilename(path) {
  if (!path) return '';
  return path.split('/').pop();
}

// Load cards on page load if on browse tab
if (document.getElementById('browse').classList.contains('active')) {
  loadCards();
}

