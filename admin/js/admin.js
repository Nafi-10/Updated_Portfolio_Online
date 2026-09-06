/* ==========================================================================
   ADMIN DASHBOARD CORE LOGIC (admin.js)
   ========================================================================== */

let currentPortfolioData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Handle Login Form on index.html
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    // If already logged in, redirect to dashboard
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
      window.location.href = 'dashboard.html';
      return;
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('username').value.trim();
      const pass = document.getElementById('password').value.trim();
      const errorEl = document.getElementById('login-error');

      if (user === 'admin' && pass === 'kji2025') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'dashboard.html';
      } else {
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'Invalid credentials. Username: admin, Password: kji2025';
        }
      }
    });
    return;
  }

  // 2. Auth Check for Dashboard Page
  if (window.location.pathname.includes('dashboard.html')) {
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = 'index.html';
      return;
    }

    // Load Data
    currentPortfolioData = await loadAdminData();

    // Init Navigation Sidebar & Panels
    initAdminSidebar();
    renderActivePanel('home');
  }
});

/* --------------------------------------------------------------------------
   Data Management & Persistence
   -------------------------------------------------------------------------- */
async function loadAdminData() {
  const local = localStorage.getItem('portfolioData');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) { console.error('Error parsing localStorage:', e); }
  }

  // Fallback fetch
  try {
    const res = await fetch('../data/portfolio-data.json');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Could not fetch JSON file, using default structure');
  }

  return getDefaultStructure();
}

async function saveAdminData() {
  if (!currentPortfolioData) return;

  // Save to localStorage
  localStorage.setItem('portfolioData', JSON.stringify(currentPortfolioData));

  // Try API POST to disk if server is running
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentPortfolioData)
    });
  } catch (e) {
    // Static hosting environment fallback
  }

  showToast('✅ All portfolio changes saved successfully!');
}

function exportJSON() {
  if (!currentPortfolioData) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentPortfolioData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "portfolio-data.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 Downloaded updated portfolio-data.json!');
}

function showToast(msg) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function logoutAdmin() {
  sessionStorage.removeItem('adminLoggedIn');
  window.location.href = 'index.html';
}

/* --------------------------------------------------------------------------
   Sidebar & Panel Router
   -------------------------------------------------------------------------- */
function initAdminSidebar() {
  const links = document.querySelectorAll('.sidebar-link[data-panel]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const targetPanel = link.getAttribute('data-panel');
      renderActivePanel(targetPanel);
    });
  });

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutAdmin);
}

function renderActivePanel(panelName) {
  const container = document.getElementById('admin-panel-container');
  if (!container || !currentPortfolioData) return;

  const titleHeader = document.getElementById('admin-header-title');
  if (titleHeader) titleHeader.textContent = `Editing Section: ${panelName.toUpperCase()}`;

  switch (panelName) {
    case 'home':
      container.innerHTML = renderHomePanel();
      break;
    case 'personal':
      container.innerHTML = renderPersonalPanel();
      bindPersonalEvents();
      break;
    case 'skills':
      container.innerHTML = renderSkillsPanel();
      bindSkillsEvents();
      break;
    case 'experience':
      container.innerHTML = renderExperiencePanel();
      bindExperienceEvents();
      break;
    case 'education':
      container.innerHTML = renderEducationPanel();
      bindEducationEvents();
      break;
    case 'articles':
      container.innerHTML = renderArticlesPanel();
      bindArticlesEvents();
      break;
    case 'contact':
      container.innerHTML = renderContactPanel();
      bindContactEvents();
      break;
    case 'media':
      container.innerHTML = renderMediaPanel();
      bindMediaEvents();
      break;
    case 'settings':
      container.innerHTML = renderSettingsPanel();
      bindSettingsEvents();
      break;
    default:
      container.innerHTML = renderHomePanel();
  }
}

/* --------------------------------------------------------------------------
   Panel Renderers & Event Handlers
   -------------------------------------------------------------------------- */

// 1. HOME PANEL
function renderHomePanel() {
  const d = currentPortfolioData;
  return `
    <div class="panel-section active">
      <h2 class="panel-title">Dashboard Overview</h2>
      <p class="panel-desc">Manage all portfolio sections from a single admin interface.</p>

      <div class="stat-cards-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-code"></i></div>
          <div>
            <div class="stat-val">${(d.technicalSkills || []).length + (d.toolSkills || []).length}</div>
            <div class="stat-lbl">Total Skills</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-briefcase"></i></div>
          <div>
            <div class="stat-val">${(d.experiences || []).length}</div>
            <div class="stat-lbl">Experiences</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-graduation-cap"></i></div>
          <div>
            <div class="stat-val">${(d.education || []).length}</div>
            <div class="stat-lbl">Education Entries</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><i class="fa-solid fa-newspaper"></i></div>
          <div>
            <div class="stat-val">${(d.articles || []).length}</div>
            <div class="stat-lbl">Published Articles</div>
          </div>
        </div>
      </div>

      <div style="background: var(--bg-sidebar); padding: 25px; border-radius: 16px; border: 1px solid var(--border-color); display: flex; gap: 15px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div>
          <h3 style="color:#fff; margin-bottom: 5px;">Quick Admin Actions</h3>
          <p style="color: var(--text-muted); font-size:0.9rem;">View live site or download JSON backup.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <a href="../index.html" target="_blank" class="admin-btn admin-btn-secondary"><i class="fa-solid fa-external-link"></i> Preview Portfolio</a>
          <button onclick="exportJSON()" class="admin-btn admin-btn-primary"><i class="fa-solid fa-download"></i> Export portfolio-data.json</button>
        </div>
      </div>
    </div>
  `;
}

// 2. PERSONAL INFO PANEL
function renderPersonalPanel() {
  const p = currentPortfolioData.personal || {};
  const photoSrc = p.profilePhoto || '../assets/img/profile.jpg';
  const customFields = p.customFields || [];

  return `
    <div class="panel-section active">
      <h2 class="panel-title">Personal Information & Profile Photo</h2>
      <p class="panel-desc">Update primary biographical details, profile image, and contact handles.</p>

      <!-- Profile Photo Card -->
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); border-radius: 20px; padding: 25px; margin-bottom: 30px; display: flex; align-items: center; gap: 25px; flex-wrap: wrap;">
        <div style="position: relative; width: 110px; height: 110px;">
          <img id="admin-p-photo-preview" src="${photoSrc}" alt="Profile Preview" style="width: 100%; height: 100%; border-radius: 20px; object-fit: cover; border: 2px solid var(--primary); background-color: #1e293b;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'" />
          <label for="admin-photo-file-input" style="position: absolute; bottom: -8px; right: -8px; width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #0f172a; box-shadow: 0 4px 12px var(--primary-glow);" title="Upload photo via + button">
            <i class="fa-solid fa-plus"></i>
          </label>
          <input type="file" id="admin-photo-file-input" accept="image/*" style="display: none;" onchange="handleAdminPhotoFileSelect(event)" />
        </div>
        <div style="flex: 1; min-width: 250px;">
          <h4 style="color: #fff; margin-bottom: 6px; font-family: var(--font-heading);">Profile Photo</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Click the <b>+</b> button to upload a photo file from your device, or paste a photo URL below.</p>
          <input type="text" id="p-photo-url" class="admin-input" value="${p.profilePhoto || ''}" placeholder="https://images.unsplash.com/photo-..." oninput="updateAdminPhotoPreview(this.value)" />
        </div>
      </div>

      <form id="form-personal">
        <div class="item-row-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="admin-form-group">
            <label class="admin-label">Full Name</label>
            <input type="text" id="p-name" class="admin-input" value="${p.name || ''}" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Email Address</label>
            <input type="email" id="p-email" class="admin-input" value="${p.email || ''}" required />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Phone Number</label>
            <input type="text" id="p-phone" class="admin-input" value="${p.phone || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Location / Address</label>
            <input type="text" id="p-address" class="admin-input" value="${p.address || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">LinkedIn URL</label>
            <input type="text" id="p-linkedin" class="admin-input" value="${p.linkedin || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">GitHub URL</label>
            <input type="text" id="p-github" class="admin-input" value="${p.github || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Facebook URL</label>
            <input type="text" id="p-facebook" class="admin-input" value="${p.facebook || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Instagram URL</label>
            <input type="text" id="p-instagram" class="admin-input" value="${p.instagram || ''}" />
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-label">Hero Tagline</label>
          <input type="text" id="p-tagline" class="admin-input" value="${p.tagline || ''}" />
        </div>

        <div class="admin-form-group">
          <label class="admin-label">About Me Paragraph</label>
          <textarea id="p-about" class="admin-textarea" rows="5">${p.about || ''}</textarea>
        </div>

        <!-- Custom Personal Fields Section with + Icon Button -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; margin: 25px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="color: #fff; font-family: var(--font-heading); font-size: 0.95rem; margin-bottom: 4px;">
                <i class="fa-solid fa-folder-plus" style="color: var(--primary); margin-right: 8px;"></i> Custom Personal Fields
              </h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Add custom biographical or social fields for future updates.</p>
            </div>
            <button type="button" onclick="addCustomPersonalField()" class="admin-btn admin-btn-secondary" style="padding: 8px 14px;">
              <i class="fa-solid fa-plus"></i> Add Field
            </button>
          </div>

          <div id="custom-personal-fields-list">
            ${customFields.map((cf, idx) => `
              <div class="item-row-card custom-p-field-card" style="margin-bottom: 12px; padding: 12px 16px;">
                <div class="item-row-grid" style="grid-template-columns: 1fr 2fr;">
                  <input type="text" class="admin-input p-custom-label" value="${cf.label || ''}" placeholder="Field Name (e.g. Twitter / X)" />
                  <input type="text" class="admin-input p-custom-value" value="${cf.value || ''}" placeholder="Field Value / Link" />
                </div>
                <div class="item-actions">
                  <button type="button" onclick="removeCustomPersonalField(${idx})" class="admin-btn admin-btn-danger" style="padding: 6px 10px;" title="Delete Field">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Personal Info</button>
      </form>
    </div>
  `;
}

function bindPersonalEvents() {
  window.updateAdminPhotoPreview = (url) => {
    const preview = document.getElementById('admin-p-photo-preview');
    if (preview) preview.src = url || '../assets/img/profile.jpg';
  };

  window.handleAdminPhotoFileSelect = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const photoInput = document.getElementById('p-photo-url');
      if (photoInput) photoInput.value = dataUrl;
      const preview = document.getElementById('admin-p-photo-preview');
      if (preview) preview.src = dataUrl;
      showToast('Photo uploaded into preview!');
    };
    reader.readAsDataURL(file);
  };

  window.addCustomPersonalField = () => {
    if (!currentPortfolioData.personal.customFields) currentPortfolioData.personal.customFields = [];
    currentPortfolioData.personal.customFields.push({ label: '', value: '' });
    renderActivePanel('personal');
  };

  window.removeCustomPersonalField = (idx) => {
    if (currentPortfolioData.personal.customFields) {
      currentPortfolioData.personal.customFields.splice(idx, 1);
      renderActivePanel('personal');
    }
  };

  const form = document.getElementById('form-personal');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const photoVal = document.getElementById('p-photo-url')?.value.trim() || currentPortfolioData.personal?.profilePhoto || 'assets/img/profile.jpg';
      
      const customFieldCards = document.querySelectorAll('#custom-personal-fields-list .custom-p-field-card');
      const updatedCustomFields = [];
      customFieldCards.forEach(card => {
        const label = card.querySelector('.p-custom-label').value.trim();
        const value = card.querySelector('.p-custom-value').value.trim();
        if (label || value) {
          updatedCustomFields.push({ label, value });
        }
      });

      currentPortfolioData.personal = {
        name: document.getElementById('p-name').value,
        email: document.getElementById('p-email').value,
        phone: document.getElementById('p-phone').value,
        address: document.getElementById('p-address').value,
        linkedin: document.getElementById('p-linkedin').value,
        github: document.getElementById('p-github').value,
        facebook: document.getElementById('p-facebook')?.value || '',
        instagram: document.getElementById('p-instagram')?.value || '',
        tagline: document.getElementById('p-tagline').value,
        about: document.getElementById('p-about').value,
        cvUrl: currentPortfolioData.personal?.cvUrl || '#',
        profilePhoto: photoVal,
        customFields: updatedCustomFields
      };
      saveAdminData();
    });
  }
}

// 3. SKILLS PANEL
function renderSkillsPanel() {
  const tech = currentPortfolioData.technicalSkills || [];
  const tools = currentPortfolioData.toolSkills || [];
  const interests = currentPortfolioData.interests || [];

  return `
    <div class="panel-section active">
      <h2 class="panel-title">Skills & Interests Manager</h2>
      <p class="panel-desc">Add, edit or remove technical skills, tools and interest tags.</p>

      <h3 style="color: var(--primary); margin-bottom: 15px;">💻 Technical Skills</h3>
      <div id="tech-skills-list">
        ${tech.map((s, idx) => `
          <div class="item-row-card">
            <div class="item-row-grid">
              <input type="text" class="admin-input tech-name" value="${s.name}" placeholder="Skill Name" />
              <input type="number" min="0" max="100" class="admin-input tech-perc" value="${s.percentage}" placeholder="Percentage" />
              <input type="color" class="admin-input tech-color" value="${s.color || '#00d4ff'}" style="height: 45px; padding: 4px;" />
            </div>
            <div class="item-actions">
              <button onclick="removeTechSkill(${idx})" class="admin-btn admin-btn-danger"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="addTechSkill()" class="admin-btn admin-btn-secondary" style="margin-bottom: 30px;"><i class="fa-solid fa-plus"></i> Add Technical Skill</button>

      <h3 style="color: var(--secondary); margin-bottom: 15px;">🛠️ Tool Skills</h3>
      <div id="tool-skills-list">
        ${tools.map((s, idx) => `
          <div class="item-row-card">
            <div class="item-row-grid">
              <input type="text" class="admin-input tool-name" value="${s.name}" placeholder="Tool Name" />
              <input type="number" min="0" max="100" class="admin-input tool-perc" value="${s.percentage}" placeholder="Percentage" />
              <input type="color" class="admin-input tool-color" value="${s.color || '#7c3aed'}" style="height: 45px; padding: 4px;" />
            </div>
            <div class="item-actions">
              <button onclick="removeToolSkill(${idx})" class="admin-btn admin-btn-danger"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="addToolSkill()" class="admin-btn admin-btn-secondary" style="margin-bottom: 30px;"><i class="fa-solid fa-plus"></i> Add Tool Skill</button>

      <h3 style="color: #fff; margin-bottom: 15px;">🔍 Interests Tags (Comma Separated)</h3>
      <div class="admin-form-group" style="margin-bottom: 25px;">
        <input type="text" id="interests-input" class="admin-input" value="${interests.join(', ')}" />
      </div>

      <button onclick="saveSkillsData()" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save All Skills</button>
    </div>
  `;
}

function bindSkillsEvents() {
  window.removeTechSkill = (idx) => {
    currentPortfolioData.technicalSkills.splice(idx, 1);
    renderActivePanel('skills');
  };
  window.addTechSkill = () => {
    currentPortfolioData.technicalSkills.push({ name: 'New Skill', percentage: 80, color: '#00d4ff' });
    renderActivePanel('skills');
  };
  window.removeToolSkill = (idx) => {
    currentPortfolioData.toolSkills.splice(idx, 1);
    renderActivePanel('skills');
  };
  window.addToolSkill = () => {
    currentPortfolioData.toolSkills.push({ name: 'New Tool', percentage: 80, color: '#7c3aed' });
    renderActivePanel('skills');
  };
  window.saveSkillsData = () => {
    // Gather Tech Skills
    const techCards = document.querySelectorAll('#tech-skills-list .item-row-card');
    const newTech = [];
    techCards.forEach(card => {
      newTech.push({
        name: card.querySelector('.tech-name').value,
        percentage: parseInt(card.querySelector('.tech-perc').value) || 0,
        color: card.querySelector('.tech-color').value
      });
    });

    // Gather Tool Skills
    const toolCards = document.querySelectorAll('#tool-skills-list .item-row-card');
    const newTools = [];
    toolCards.forEach(card => {
      newTools.push({
        name: card.querySelector('.tool-name').value,
        percentage: parseInt(card.querySelector('.tool-perc').value) || 0,
        color: card.querySelector('.tool-color').value
      });
    });

    // Gather Interests
    const interestsVal = document.getElementById('interests-input').value;
    const newInterests = interestsVal.split(',').map(s => s.trim()).filter(Boolean);

    currentPortfolioData.technicalSkills = newTech;
    currentPortfolioData.toolSkills = newTools;
    currentPortfolioData.interests = newInterests;

    saveAdminData();
  };
}

// 4. EXPERIENCE PANEL
function renderExperiencePanel() {
  const exp = currentPortfolioData.experiences || [];
  return `
    <div class="panel-section active">
      <h2 class="panel-title">Experience & Journey Manager</h2>
      <p class="panel-desc">Manage career experiences, student activities, and roles.</p>

      <div id="experience-list">
        ${exp.map((item, idx) => `
          <div class="item-row-card">
            <div class="item-row-grid">
              <div class="admin-form-group">
                <label class="admin-label">Role Title</label>
                <input type="text" class="admin-input exp-role" value="${item.role}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">Organization</label>
                <input type="text" class="admin-input exp-org" value="${item.organization}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">Duration</label>
                <input type="text" class="admin-input exp-dur" value="${item.duration}" />
              </div>
            </div>
            <div class="admin-form-group">
              <label class="admin-label">Description</label>
              <textarea class="admin-textarea exp-desc" rows="2">${item.description}</textarea>
            </div>
            <div class="item-actions">
              ${idx > 0 ? `<button onclick="moveExp(${idx}, -1)" class="admin-btn admin-btn-secondary"><i class="fa-solid fa-arrow-up"></i> Move Up</button>` : ''}
              ${idx < exp.length - 1 ? `<button onclick="moveExp(${idx}, 1)" class="admin-btn admin-btn-secondary"><i class="fa-solid fa-arrow-down"></i> Move Down</button>` : ''}
              <button onclick="removeExp(${idx})" class="admin-btn admin-btn-danger"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 15px; margin-top: 20px;">
        <button onclick="addExp()" class="admin-btn admin-btn-secondary"><i class="fa-solid fa-plus"></i> Add Experience Entry</button>
        <button onclick="saveExpData()" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save All Experiences</button>
      </div>
    </div>
  `;
}

function bindExperienceEvents() {
  window.removeExp = (idx) => {
    currentPortfolioData.experiences.splice(idx, 1);
    renderActivePanel('experience');
  };
  window.addExp = () => {
    currentPortfolioData.experiences.unshift({
      id: Date.now(),
      role: 'New Role Title',
      organization: 'Organization Name',
      duration: 'Year – Present',
      description: 'Role description...'
    });
    renderActivePanel('experience');
  };
  window.moveExp = (idx, direction) => {
    const target = idx + direction;
    if (target >= 0 && target < currentPortfolioData.experiences.length) {
      const temp = currentPortfolioData.experiences[idx];
      currentPortfolioData.experiences[idx] = currentPortfolioData.experiences[target];
      currentPortfolioData.experiences[target] = temp;
      renderActivePanel('experience');
    }
  };
  window.saveExpData = () => {
    const cards = document.querySelectorAll('#experience-list .item-row-card');
    const updated = [];
    cards.forEach((card, idx) => {
      updated.push({
        id: currentPortfolioData.experiences[idx]?.id || Date.now() + idx,
        role: card.querySelector('.exp-role').value,
        organization: card.querySelector('.exp-org').value,
        duration: card.querySelector('.exp-dur').value,
        description: card.querySelector('.exp-desc').value
      });
    });
    currentPortfolioData.experiences = updated;
    saveAdminData();
  };
}

// 5. EDUCATION PANEL
function renderEducationPanel() {
  const edu = currentPortfolioData.education || [];
  return `
    <div class="panel-section active">
      <h2 class="panel-title">Education Manager</h2>
      <p class="panel-desc">Manage academic qualification cards.</p>

      <div id="education-list">
        ${edu.map((item, idx) => `
          <div class="item-row-card">
            <div class="item-row-grid">
              <div class="admin-form-group">
                <label class="admin-label">Degree / Level</label>
                <input type="text" class="admin-input edu-deg" value="${item.degree}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">Major (Optional)</label>
                <input type="text" class="admin-input edu-maj" value="${item.major || ''}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">Institution</label>
                <input type="text" class="admin-input edu-inst" value="${item.institution}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">Year Range</label>
                <input type="text" class="admin-input edu-yr" value="${item.year}" />
              </div>
              <div class="admin-form-group">
                <label class="admin-label">GPA (Optional)</label>
                <input type="text" class="admin-input edu-gpa" value="${item.gpa || ''}" />
              </div>
            </div>
            <div class="item-actions">
              <button onclick="removeEdu(${idx})" class="admin-btn admin-btn-danger"><i class="fa-solid fa-trash"></i> Delete Entry</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 15px; margin-top: 20px;">
        <button onclick="addEdu()" class="admin-btn admin-btn-secondary"><i class="fa-solid fa-plus"></i> Add Education Entry</button>
        <button onclick="saveEduData()" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Education</button>
      </div>
    </div>
  `;
}

function bindEducationEvents() {
  window.removeEdu = (idx) => {
    currentPortfolioData.education.splice(idx, 1);
    renderActivePanel('education');
  };
  window.addEdu = () => {
    currentPortfolioData.education.push({
      id: Date.now(),
      degree: 'New Degree',
      major: 'Major Subject',
      institution: 'University / College Name',
      year: '2022 – Present',
      gpa: null
    });
    renderActivePanel('education');
  };
  window.saveEduData = () => {
    const cards = document.querySelectorAll('#education-list .item-row-card');
    const updated = [];
    cards.forEach((card, idx) => {
      updated.push({
        id: currentPortfolioData.education[idx]?.id || Date.now() + idx,
        degree: card.querySelector('.edu-deg').value,
        major: card.querySelector('.edu-maj').value || null,
        institution: card.querySelector('.edu-inst').value,
        year: card.querySelector('.edu-yr').value,
        gpa: card.querySelector('.edu-gpa').value || null
      });
    });
    currentPortfolioData.education = updated;
    saveAdminData();
  };
}

// 6. ARTICLES PANEL (FOLDER CONCEPT)
function renderArticlesPanel() {
  const articles = currentPortfolioData.articles || [];
  const categories = currentPortfolioData.articleCategories || ['AI', 'Cyber Security', 'IoT', 'Business Analysis', 'General'];

  return `
    <div class="panel-section active">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
        <div>
          <h2 class="panel-title" style="margin-bottom: 5px;"><i class="fa-solid fa-folder-closed" style="color: #fbbf24; margin-right: 10px;"></i> Article Folders Directory</h2>
          <p class="panel-desc">Every folder represents a separate article. Click on any folder to open and edit its content, or click the plus (<b>+</b>) card to create a new article folder.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="addNewCategoryFromModal()" class="admin-btn admin-btn-secondary">
            <i class="fa-solid fa-plus"></i> New Category
          </button>
          <button onclick="createNewArticleFolder()" class="admin-btn admin-btn-primary">
            <i class="fa-solid fa-folder-plus"></i> New Article Folder
          </button>
        </div>
      </div>

      <!-- Categories Bar -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 16px; padding: 15px 20px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-family: var(--font-heading); font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Article Categories:</span>
          ${categories.map((cat, idx) => `
            <span class="folder-cat-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; font-size: 0.8rem;">
              ${cat}
              <i class="fa-solid fa-xmark" onclick="event.stopPropagation(); removeCategory(${idx})" style="cursor: pointer; opacity: 0.8;" title="Delete Category"></i>
            </span>
          `).join('')}
        </div>
      </div>

      <div class="article-folder-grid">
        <!-- Plus Icon / New Article Folder Card -->
        <div class="folder-card add-folder-card" onclick="createNewArticleFolder()">
          <i class="fa-solid fa-folder-plus add-folder-icon"></i>
          <div class="add-folder-text">Add New Article</div>
          <div class="add-folder-sub">Click to open a blank folder</div>
        </div>

        <!-- Article Folders List -->
        ${articles.map((item, idx) => `
          <div class="folder-card" onclick="openArticleFolder(${idx})">
            <div class="folder-top">
              <i class="fa-solid fa-folder-open folder-icon"></i>
              <span class="folder-cat-badge">${item.category || 'General'}</span>
            </div>
            <div>
              <h3 class="folder-title">${item.title || 'Untitled Folder'}</h3>
              <p class="folder-excerpt">${item.excerpt || 'No description provided.'}</p>
            </div>
            <div>
              <div class="folder-meta">
                <span><i class="fa-regular fa-calendar"></i> ${item.date || 'No Date'}</span>
              </div>
              <div class="folder-footer-actions" onclick="event.stopPropagation()">
                <button onclick="openArticleFolder(${idx})" class="admin-btn admin-btn-primary" style="flex: 1; padding: 6px 12px; font-size: 0.8rem;">
                  <i class="fa-solid fa-folder-open"></i> Open Folder
                </button>
                <button onclick="removeArticleFolder(${idx})" class="admin-btn admin-btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" title="Delete Folder">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Article Folder Editor Modal -->
    <div id="admin-folder-modal" class="admin-modal-overlay">
      <div class="admin-modal-container">
        <div class="admin-modal-header">
          <div class="admin-modal-title" id="folder-modal-heading">
            <i class="fa-solid fa-folder-open" style="color: #fbbf24;"></i> <span id="folder-modal-name">Article Folder</span>
          </div>
          <button class="admin-modal-close" onclick="closeArticleFolderModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="article-folder-form" onsubmit="event.preventDefault(); saveActiveArticleFolder();">
          <input type="hidden" id="folder-article-index" value="-1" />
          
          <div class="form-grid-2">
            <div class="admin-form-group">
              <label class="admin-label">Article Title</label>
              <input type="text" id="folder-art-title" class="admin-input" required placeholder="Enter article title" />
            </div>
            <div class="admin-form-group">
              <label class="admin-label">Category</label>
              <div style="display: flex; gap: 8px;">
                <select id="folder-art-cat" class="admin-select" style="flex: 1;">
                  ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <button type="button" onclick="addNewCategoryFromModal()" class="admin-btn admin-btn-secondary" style="padding: 0 14px;" title="Create New Category">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="admin-form-group">
              <label class="admin-label">Publish Date</label>
              <input type="date" id="folder-art-date" class="admin-input" required />
            </div>
            <div class="admin-form-group">
              <label class="admin-label">Thumbnail Image URL</label>
              <input type="text" id="folder-art-thumb" class="admin-input" placeholder="https://images.unsplash.com/..." />
            </div>
          </div>

          <div class="admin-form-group">
            <label class="admin-label">Short Excerpt / Folder Description</label>
            <textarea id="folder-art-excerpt" class="admin-textarea" rows="2" placeholder="Brief summary of the article inside this folder..."></textarea>
          </div>

          <div class="admin-form-group">
            <label class="admin-label">Full Body Article Content (Markdown / HTML Supported)</label>
            <div class="article-format-toolbar" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('**', '**')"><strong>B</strong></button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('*', '*')"><em>I</em></button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('### ', '')">H3</button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('- ', '')">• List</button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('> ', '')">Quote</button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('[', '](https://example.com)')">Link</button>
              <button type="button" class="admin-btn admin-btn-secondary btn-sm" onclick="insertArticleFormat('<code>', '</code>')">Code</button>
            </div>
            <textarea id="folder-art-body" class="admin-textarea" rows="8" placeholder="Write full article body text here..."></textarea>
            <div style="margin-top:8px; font-size:0.82rem; color: var(--text-muted);">
              Use the buttons above to add Markdown or HTML structure. Example: <code>**bold**</code>, <code>*italic*</code>, <code>&lt;h3&gt;</code>, <code>[link](https://...)</code>.
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 25px; border-top: 1px solid var(--border-color); padding-top: 20px;">
            <button type="button" onclick="closeArticleFolderModal()" class="admin-btn admin-btn-secondary">
              <i class="fa-solid fa-xmark"></i> Cancel & Close
            </button>
            <div style="display: flex; gap: 12px;">
              <button type="button" id="folder-modal-delete-btn" onclick="deleteActiveFolderFromModal()" class="admin-btn admin-btn-danger" style="display: none;">
                <i class="fa-solid fa-trash"></i> Delete Folder
              </button>
              <button type="submit" class="admin-btn admin-btn-primary">
                <i class="fa-solid fa-floppy-disk"></i> Save Article Folder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function bindArticlesEvents() {
  window.addNewCategoryFromModal = () => {
    const newCat = prompt('Enter new article category name:');
    if (!newCat) return;
    const trimmed = newCat.trim();
    if (!trimmed) return;

    if (!currentPortfolioData.articleCategories) {
      currentPortfolioData.articleCategories = ['AI', 'Cyber Security', 'IoT', 'Business Analysis', 'General'];
    }

    if (!currentPortfolioData.articleCategories.includes(trimmed)) {
      currentPortfolioData.articleCategories.push(trimmed);
      saveAdminData();
      showToast(`✅ Created new category: "${trimmed}"`);

      // Update select element if modal is open
      const catSelect = document.getElementById('folder-art-cat');
      if (catSelect) {
        catSelect.innerHTML = currentPortfolioData.articleCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        catSelect.value = trimmed;
      }

      renderActivePanel('articles');
    } else {
      alert(`Category "${trimmed}" already exists.`);
    }
  };

  window.removeCategory = (idx) => {
    if (!currentPortfolioData.articleCategories) return;
    const catName = currentPortfolioData.articleCategories[idx];
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      currentPortfolioData.articleCategories.splice(idx, 1);
      saveAdminData();
      renderActivePanel('articles');
    }
  };

  window.openArticleFolder = (idx) => {
    const item = currentPortfolioData.articles[idx];
    if (!item) return;

    const categories = currentPortfolioData.articleCategories || ['AI', 'Cyber Security', 'IoT', 'Business Analysis', 'General'];
    if (item.category && !categories.includes(item.category)) {
      categories.push(item.category);
      currentPortfolioData.articleCategories = categories;
    }

    const selectEl = document.getElementById('folder-art-cat');
    if (selectEl) {
      selectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
      selectEl.value = item.category || categories[0];
    }

    document.getElementById('folder-article-index').value = idx;
    document.getElementById('folder-modal-name').textContent = item.title || 'Edit Article Folder';
    document.getElementById('folder-art-title').value = item.title || '';
    document.getElementById('folder-art-cat').value = item.category || (categories[0] || 'General');
    document.getElementById('folder-art-date').value = item.date || new Date().toISOString().split('T')[0];
    document.getElementById('folder-art-thumb').value = item.thumbnail || '';
    document.getElementById('folder-art-excerpt').value = item.excerpt || '';
    document.getElementById('folder-art-body').value = item.body || '';

    const deleteBtn = document.getElementById('folder-modal-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';

    const modal = document.getElementById('admin-folder-modal');
    if (modal) modal.classList.add('active');
  };

  window.createNewArticleFolder = () => {
    const categories = currentPortfolioData.articleCategories || ['AI', 'Cyber Security', 'IoT', 'Business Analysis', 'General'];
    const selectEl = document.getElementById('folder-art-cat');
    if (selectEl) {
      selectEl.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
      selectEl.value = categories[0] || 'AI';
    }

    document.getElementById('folder-article-index').value = '-1';
    document.getElementById('folder-modal-name').textContent = 'Create New Article Folder';
    document.getElementById('folder-art-title').value = '';
    document.getElementById('folder-art-cat').value = categories[0] || 'AI';
    document.getElementById('folder-art-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('folder-art-thumb').value = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    document.getElementById('folder-art-excerpt').value = '';
    document.getElementById('folder-art-body').value = '';

    const deleteBtn = document.getElementById('folder-modal-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';

    const modal = document.getElementById('admin-folder-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeArticleFolderModal = () => {
    const modal = document.getElementById('admin-folder-modal');
    if (modal) modal.classList.remove('active');
  };

  window.insertArticleFormat = (prefix, suffix = '') => {
    const textarea = document.getElementById('folder-art-body');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || 'text';
    const insertText = `${prefix}${selectedText}${suffix}`;

    textarea.setRangeText(insertText, start, end, 'end');
    textarea.focus();
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = start + prefix.length + selectedText.length;
  };

  window.removeArticleFolder = (idx) => {
    if (confirm('Are you sure you want to delete this article folder?')) {
      currentPortfolioData.articles.splice(idx, 1);
      saveAdminData();
      renderActivePanel('articles');
    }
  };

  window.deleteActiveFolderFromModal = () => {
    const idx = parseInt(document.getElementById('folder-article-index').value, 10);
    if (idx >= 0) {
      if (confirm('Are you sure you want to delete this article folder?')) {
        currentPortfolioData.articles.splice(idx, 1);
        saveAdminData();
        closeArticleFolderModal();
        renderActivePanel('articles');
      }
    }
  };

  window.saveActiveArticleFolder = () => {
    const idx = parseInt(document.getElementById('folder-article-index').value, 10);
    const title = document.getElementById('folder-art-title').value.trim();
    const category = document.getElementById('folder-art-cat').value;
    const date = document.getElementById('folder-art-date').value;
    const thumbnail = document.getElementById('folder-art-thumb').value.trim();
    const excerpt = document.getElementById('folder-art-excerpt').value.trim();
    const body = document.getElementById('folder-art-body').value.trim();

    if (!title) {
      alert('Please enter an article title');
      return;
    }

    const folderData = {
      id: idx >= 0 ? (currentPortfolioData.articles[idx]?.id || Date.now()) : Date.now(),
      title,
      category,
      date,
      thumbnail,
      excerpt,
      body
    };

    if (idx >= 0) {
      currentPortfolioData.articles[idx] = folderData;
    } else {
      currentPortfolioData.articles.unshift(folderData);
    }

    saveAdminData();
    closeArticleFolderModal();
    renderActivePanel('articles');
  };
}

// 7. CONTACT SETTINGS PANEL
function renderContactPanel() {
  const p = currentPortfolioData.personal || {};
  const s = currentPortfolioData.settings || {};
  const customContact = currentPortfolioData.contactFields || [];

  return `
    <div class="panel-section active">
      <h2 class="panel-title">Contact Settings</h2>
      <p class="panel-desc">Manage public contact info and contact form behavior.</p>

      <form id="form-contact-settings">
        <div class="item-row-grid">
          <div class="admin-form-group">
            <label class="admin-label">Public Email</label>
            <input type="email" id="c-email" class="admin-input" value="${p.email || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Public Phone</label>
            <input type="text" id="c-phone" class="admin-input" value="${p.phone || ''}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Physical Location</label>
            <input type="text" id="c-address" class="admin-input" value="${p.address || ''}" />
          </div>
        </div>

        <div class="admin-form-group" style="margin-top: 15px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #fff;">
            <input type="checkbox" id="c-show-form" ${s.showContactForm !== false ? 'checked' : ''} style="width: 18px; height: 18px;" />
            Enable Netlify Contact Form on Portfolio
          </label>
        </div>

        <!-- Custom Contact Fields Section with + Icon Button -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; margin: 25px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="color: #fff; font-family: var(--font-heading); font-size: 0.95rem; margin-bottom: 4px;">
                <i class="fa-solid fa-square-plus" style="color: var(--secondary); margin-right: 8px;"></i> Custom Contact Details
              </h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Add custom contact fields such as WhatsApp, Telegram, Skype, or Office Hours.</p>
            </div>
            <button type="button" onclick="addCustomContactField()" class="admin-btn admin-btn-secondary" style="padding: 8px 14px;">
              <i class="fa-solid fa-plus"></i> Add Detail
            </button>
          </div>

          <div id="custom-contact-fields-list">
            ${customContact.map((cf, idx) => `
              <div class="item-row-card custom-c-field-card" style="margin-bottom: 12px; padding: 12px 16px;">
                <div class="item-row-grid" style="grid-template-columns: 1fr 2fr;">
                  <input type="text" class="admin-input c-custom-label" value="${cf.label || ''}" placeholder="Contact Type (e.g. WhatsApp / Secondary Email)" />
                  <input type="text" class="admin-input c-custom-value" value="${cf.value || ''}" placeholder="Contact Detail / Link" />
                </div>
                <div class="item-actions">
                  <button type="button" onclick="removeCustomContactField(${idx})" class="admin-btn admin-btn-danger" style="padding: 6px 10px;" title="Delete Field">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="admin-btn admin-btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-floppy-disk"></i> Save Contact Settings</button>
      </form>
    </div>
  `;
}

function bindContactEvents() {
  window.addCustomContactField = () => {
    if (!currentPortfolioData.contactFields) currentPortfolioData.contactFields = [];
    currentPortfolioData.contactFields.push({ label: '', value: '' });
    renderActivePanel('contact');
  };

  window.removeCustomContactField = (idx) => {
    if (currentPortfolioData.contactFields) {
      currentPortfolioData.contactFields.splice(idx, 1);
      renderActivePanel('contact');
    }
  };

  const form = document.getElementById('form-contact-settings');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const customContactCards = document.querySelectorAll('#custom-contact-fields-list .custom-c-field-card');
      const updatedCustomContact = [];
      customContactCards.forEach(card => {
        const label = card.querySelector('.c-custom-label').value.trim();
        const value = card.querySelector('.c-custom-value').value.trim();
        if (label || value) {
          updatedCustomContact.push({ label, value });
        }
      });

      currentPortfolioData.personal.email = document.getElementById('c-email').value;
      currentPortfolioData.personal.phone = document.getElementById('c-phone').value;
      currentPortfolioData.personal.address = document.getElementById('c-address').value;

      if (!currentPortfolioData.settings) currentPortfolioData.settings = {};
      currentPortfolioData.settings.showContactForm = document.getElementById('c-show-form').checked;
      currentPortfolioData.contactFields = updatedCustomContact;

      saveAdminData();
    });
  }
}

// 8. MEDIA / PROFILE PHOTO PANEL
function renderMediaPanel() {
  const p = currentPortfolioData.personal || {};
  return `
    <div class="panel-section active">
      <h2 class="panel-title">Media & Profile Photo Manager</h2>
      <p class="panel-desc">Update primary profile photo and media URLs.</p>

      <div style="display: flex; gap: 30px; align-items: center; margin-bottom: 30px;">
        <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary); box-shadow: 0 0 15px var(--primary-glow);">
          <img src="../${p.profilePhoto || 'assets/img/profile.jpg'}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'" style="width:100%; height:100%; object-fit:cover;" />
        </div>
        <div style="flex-grow: 1;">
          <div class="admin-form-group">
            <label class="admin-label">Profile Photo Relative Path or URL</label>
            <input type="text" id="m-profile-photo" class="admin-input" value="${p.profilePhoto || 'assets/img/profile.jpg'}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">CV Download URL</label>
            <input type="text" id="m-cv-url" class="admin-input" value="${p.cvUrl || '#'}" />
          </div>
        </div>
      </div>

      <button onclick="saveMediaData()" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Media Settings</button>
    </div>
  `;
}

function bindMediaEvents() {
  window.saveMediaData = () => {
    currentPortfolioData.personal.profilePhoto = document.getElementById('m-profile-photo').value;
    currentPortfolioData.personal.cvUrl = document.getElementById('m-cv-url').value;
    saveAdminData();
  };
}

// 9. SITE SETTINGS PANEL
function renderSettingsPanel() {
  const s = currentPortfolioData.settings || {};
  const typed = currentPortfolioData.typedStrings || [];
  const certs = currentPortfolioData.certifications || [];
  const customSettings = currentPortfolioData.customSettings || [];

  return `
    <div class="panel-section active">
      <h2 class="panel-title">Global Site Settings</h2>
      <p class="panel-desc">Configure site title, metadata, animations, and rotating headlines.</p>

      <form id="form-site-settings">
        <div class="item-row-grid">
          <div class="admin-form-group">
            <label class="admin-label">Website Title</label>
            <input type="text" id="s-title" class="admin-input" value="${s.siteTitle || 'MD Kazi Jawadul Islam | Portfolio'}" />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Meta Description</label>
            <input type="text" id="s-meta" class="admin-input" value="${s.metaDescription || ''}" />
          </div>
        </div>

        <div class="admin-form-group">
          <label class="admin-label">Typed.js Rotating Hero Subtitles (One per line)</label>
          <textarea id="s-typed" class="admin-textarea" rows="6">${typed.join('\n')}</textarea>
        </div>

        <div class="admin-form-group">
          <label class="admin-label">Certifications Badges (Comma Separated)</label>
          <input type="text" id="s-certs" class="admin-input" value="${certs.join(', ')}" />
        </div>

        <div style="display: flex; gap: 30px; margin: 20px 0;">
          <label style="display: flex; align-items: center; gap: 10px; color: #fff; cursor: pointer;">
            <input type="checkbox" id="s-preloader" ${s.enablePreloader !== false ? 'checked' : ''} style="width: 18px; height: 18px;" />
            Enable Preloader Animation
          </label>
          <label style="display: flex; align-items: center; gap: 10px; color: #fff; cursor: pointer;">
            <input type="checkbox" id="s-particles" ${s.enableParticles !== false ? 'checked' : ''} style="width: 18px; height: 18px;" />
            Enable Hero Particles Background
          </label>
        </div>

        <!-- Custom Site Settings Section with + Icon Button -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; margin: 25px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="color: #fff; font-family: var(--font-heading); font-size: 0.95rem; margin-bottom: 4px;">
                <i class="fa-solid fa-sliders" style="color: var(--primary); margin-right: 8px;"></i> Custom Site Configuration Options
              </h4>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Add custom configuration keys or site metadata for future updates.</p>
            </div>
            <button type="button" onclick="addCustomSiteSetting()" class="admin-btn admin-btn-secondary" style="padding: 8px 14px;">
              <i class="fa-solid fa-plus"></i> Add Setting
            </button>
          </div>

          <div id="custom-site-settings-list">
            ${customSettings.map((cs, idx) => `
              <div class="item-row-card custom-s-field-card" style="margin-bottom: 12px; padding: 12px 16px;">
                <div class="item-row-grid" style="grid-template-columns: 1fr 2fr;">
                  <input type="text" class="admin-input s-custom-key" value="${cs.key || ''}" placeholder="Setting Key (e.g. Analytics ID / Favicon)" />
                  <input type="text" class="admin-input s-custom-val" value="${cs.value || ''}" placeholder="Setting Value" />
                </div>
                <div class="item-actions">
                  <button type="button" onclick="removeCustomSiteSetting(${idx})" class="admin-btn admin-btn-danger" style="padding: 6px 10px;" title="Delete Setting">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="admin-btn admin-btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Global Settings</button>
      </form>
    </div>
  `;
}

function bindSettingsEvents() {
  window.addCustomSiteSetting = () => {
    if (!currentPortfolioData.customSettings) currentPortfolioData.customSettings = [];
    currentPortfolioData.customSettings.push({ key: '', value: '' });
    renderActivePanel('settings');
  };

  window.removeCustomSiteSetting = (idx) => {
    if (currentPortfolioData.customSettings) {
      currentPortfolioData.customSettings.splice(idx, 1);
      renderActivePanel('settings');
    }
  };

  const form = document.getElementById('form-site-settings');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const customSettingCards = document.querySelectorAll('#custom-site-settings-list .custom-s-field-card');
      const updatedCustomSettings = [];
      customSettingCards.forEach(card => {
        const key = card.querySelector('.s-custom-key').value.trim();
        const value = card.querySelector('.s-custom-val').value.trim();
        if (key || value) {
          updatedCustomSettings.push({ key, value });
        }
      });

      if (!currentPortfolioData.settings) currentPortfolioData.settings = {};

      currentPortfolioData.settings.siteTitle = document.getElementById('s-title').value;
      currentPortfolioData.settings.metaDescription = document.getElementById('s-meta').value;
      currentPortfolioData.settings.enablePreloader = document.getElementById('s-preloader').checked;
      currentPortfolioData.settings.enableParticles = document.getElementById('s-particles').checked;

      const typedRaw = document.getElementById('s-typed').value;
      currentPortfolioData.typedStrings = typedRaw.split('\n').map(s => s.trim()).filter(Boolean);

      const certsRaw = document.getElementById('s-certs').value;
      currentPortfolioData.certifications = certsRaw.split(',').map(s => s.trim()).filter(Boolean);

      currentPortfolioData.customSettings = updatedCustomSettings;

      saveAdminData();
    });
  }
}

function getDefaultStructure() {
  return {
    personal: { name: "MD Kazi Jawadul Islam", customFields: [] },
    technicalSkills: [],
    toolSkills: [],
    experiences: [],
    education: [],
    articles: [],
    articleCategories: ['AI', 'Cyber Security', 'IoT', 'Business Analysis', 'General'],
    contactFields: [],
    customSettings: []
  };
}
