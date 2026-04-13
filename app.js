/* =================================================
   DYNAMIC MASTERY ASSESSMENT — MAIN JAVASCRIPT
   app.js
   =================================================
   BACKEND INTEGRATION NOTES:
   - Replace mock data objects with real API calls
   - All API endpoint placeholders marked with // API:
   - Session/auth tokens should be stored in cookies 
     (NOT localStorage per PHP session best practices)
   - PHP backend team: connect /api/* routes to this file
   ================================================= */

'use strict';

/* ─────────────────────────────────────────
   0. THEME — Dark / Light Mode Toggle
───────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('dma-theme') || 'dark';
  applyTheme(saved);
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.theme-toggle, #themeToggle');
    if (btn) {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
  });
})();
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dma-theme', theme);
  document.querySelectorAll('#darkOpt').forEach(el => el.classList.toggle('active', theme === 'dark'));
  document.querySelectorAll('#lightOpt').forEach(el => el.classList.toggle('active', theme === 'light'));
}

/* ─────────────────────────────────────────
   1. NAVBAR — scroll + RIGHT-SIDE mobile drawer
───────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  // RIGHT SLIDE DRAWER
  const overlay = document.getElementById('mobileNavOverlay');
  const drawer = document.getElementById('mobileNavDrawer');
  const closeBtn = document.getElementById('mndClose');

  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  function openDrawer() {
    overlay?.classList.add('open');
    drawer?.classList.add('open');
    hamburger?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('.mnd-link').forEach(link => link.addEventListener('click', closeDrawer));
})();


/* ─────────────────────────────────────────
   1. NAVBAR — scroll effect & mobile menu
───────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (!navbar) return;

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile hamburger
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Active nav link based on scroll
  const sections = document.querySelectorAll('section[id]');
  if (sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks?.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s => observer.observe(s));
  }
})();

/* ─────────────────────────────────────────
   2. HERO STAT COUNTER ANIMATION
───────────────────────────────────────── */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num[data-target]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        let start = 0;
        const duration = 1500;
        const step = (timestamp) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
})();

/* ─────────────────────────────────────────
   3. SIDEBAR TOGGLE (Dashboard/Quiz)
───────────────────────────────────────── */
(function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!toggle || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    if (overlay) { overlay.style.display = 'block'; }
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    if (overlay) { overlay.style.display = 'none'; }
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Close on nav link click (mobile UX)
  sidebar.querySelectorAll('.sn-item').forEach(item => {
    item.addEventListener('click', () => { if (window.innerWidth <= 900) closeSidebar(); });
  });
})();

/* ─────────────────────────────────────────
   4. DASHBOARD — Date, Calendar, Animations
───────────────────────────────────────── */
(function initDashboard() {
  // Set current date
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-NG', opts);
  }

  // Greeting based on time
  const greetEl = document.querySelector('.dash-welcome');
  if (greetEl) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const nameSpan = document.getElementById('userName');
    if (nameSpan) {
      greetEl.innerHTML = `${greeting}, <span id="userName">${nameSpan.textContent}</span>! 👋`;
    }
  }

  // Build study calendar
  buildCalendar();

  // Animate mastery bars
  animateMasteryBars();

  /* ── BACKEND INTEGRATION POINT ──
     Replace the functions below with API calls to populate real data:
     
     API: GET /api/stats/user
     → overallAccuracy, totalAnswered, masteredTopics, weakTopics
     
     API: GET /api/mastery/user
     → Array of { subject, score, topics: [{ name, status }] }
     
     API: GET /api/recommendations/user
     → Array of { type, subject, topic, reason, mastery, rule }
     
     API: GET /api/sessions/user?limit=5
     → Recent practice sessions
     
     API: GET /api/user/profile
     → name, examType, streak
     
     Example fetch pattern:
     
     async function loadDashboardData() {
       try {
         const res = await fetch('/api/stats/user', {
           headers: { 'Content-Type': 'application/json' }
         });
         const data = await res.json();
         document.getElementById('totalAnswered').textContent = data.total_answered;
         document.getElementById('overallAccuracy').textContent = data.accuracy + '%';
         document.getElementById('masteredTopics').textContent = data.mastered_topics;
         document.getElementById('weakTopics').textContent = data.weak_topics;
       } catch (err) {
         console.error('Dashboard data load failed:', err);
       }
     }
     loadDashboardData();
  */
})();

function buildCalendar() {
  const calEl = document.getElementById('studyCalendar');
  if (!calEl) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = document.getElementById('monthLabel');
  if (monthLabel) {
    monthLabel.textContent = now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // MOCK: random studied days — replace with API data
  // API: GET /api/sessions/calendar?month=YYYY-MM → Array of studied day numbers
  const studiedDays = new Set([1,2,3,5,6,8,9,10,12,14,15,16,19,20,22,25,26,27]);

  calEl.innerHTML = '';

  // Day labels
  ['S','M','T','W','T','F','S'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day cal-day-label';
    el.textContent = d;
    el.style.cssText = 'opacity:0.4; font-size:10px; font-weight:700;';
    calEl.appendChild(el);
  });

  // Empty cells before month start
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calEl.appendChild(el);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.textContent = d;
    let cls = 'cal-day';
    if (d === today) cls += ' today';
    else if (d < today && studiedDays.has(d)) cls += ' studied';
    el.className = cls;
    calEl.appendChild(el);
  }
}

function animateMasteryBars() {
  const fills = document.querySelectorAll('.ml-fill, .mbar-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'width 1s ease';
        observer.unobserve(entry.target);
      }
    });
  });
  fills.forEach(f => observer.observe(f));
}

/* ─────────────────────────────────────────
   5. AUTH FORMS — Validation
───────────────────────────────────────── */
(function initForms() {

  // ── REGISTER FORM ──
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    const pwInput = document.getElementById('password');
    if (pwInput) {
      pwInput.addEventListener('input', updatePasswordStrength);
    }

    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      let valid = true;

      const firstName = document.getElementById('firstName')?.value.trim();
      const lastName = document.getElementById('lastName')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;
      const confirm = document.getElementById('confirmPassword')?.value;
      const terms = document.getElementById('agreeTerms')?.checked;

      if (!firstName) { showError('firstName', 'First name is required'); valid = false; }
      if (!lastName) { showError('lastName', 'Last name is required'); valid = false; }
      if (!email || !isValidEmail(email)) { showError('email', 'Enter a valid email address'); valid = false; }
      if (!password || password.length < 8) { showError('password', 'Password must be at least 8 characters'); valid = false; }
      if (password !== confirm) { showError('confirm', 'Passwords do not match'); valid = false; }
      if (!terms) { showError('terms', 'You must agree to the terms'); valid = false; }

      if (!valid) return;

      /* ── BACKEND INTEGRATION ──
         Replace the alert below with actual form submission:
         
         const formData = new FormData(regForm);
         
         fetch('/api/register', {
           method: 'POST',
           body: formData
         })
         .then(res => res.json())
         .then(data => {
           if (data.success) {
             window.location.href = 'dashboard.html';
           } else {
             // Show server error
             showServerError(data.message);
           }
         })
         .catch(() => showServerError('Network error. Try again.'));
      */

      // DEMO: Simulate success
      showLoadingBtn('registerBtn');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    });
  }

  // ── LOGIN FORM ──
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      let valid = true;

      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (!email || !isValidEmail(email)) { showError('email', 'Enter a valid email'); valid = false; }
      if (!password) { showError('password', 'Password is required'); valid = false; }

      if (!valid) return;

      /* ── BACKEND INTEGRATION ──
         fetch('/api/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, password,
             remember: document.getElementById('rememberMe')?.checked })
         })
         .then(res => res.json())
         .then(data => {
           if (data.success) {
             window.location.href = 'dashboard.html';
           } else {
             const serverErr = document.getElementById('serverError');
             if (serverErr) {
               serverErr.textContent = data.message || 'Invalid email or password.';
               serverErr.classList.remove('hidden');
             }
           }
         });
      */

      // DEMO: Simulate login
      showLoadingBtn('loginBtn');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    });
  }
})();

function showError(fieldId, msg) {
  const errEl = document.getElementById('err-' + fieldId);
  const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
  if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
  if (input) input.classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
  const serverErr = document.getElementById('serverError');
  if (serverErr) serverErr.classList.add('hidden');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function updatePasswordStrength() {
  const pw = document.getElementById('password')?.value || '';
  const fill = document.getElementById('psFill');
  const label = document.getElementById('psLabel');
  if (!fill || !label) return;

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { pct: '10%', color: '#ef4444', text: 'Too weak' },
    { pct: '25%', color: '#f97316', text: 'Weak' },
    { pct: '50%', color: '#f59e0b', text: 'Fair' },
    { pct: '75%', color: '#84cc16', text: 'Good' },
    { pct: '100%', color: '#10b981', text: 'Strong' },
  ];
  const l = levels[score] || levels[0];
  fill.style.width = l.pct;
  fill.style.background = l.color;
  label.textContent = pw.length ? l.text : '';
  label.style.color = l.color;
}

function showLoadingBtn(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.querySelector('.btn-text')?.classList.add('hidden');
  btn.querySelector('.btn-spinner')?.classList.remove('hidden');
  btn.disabled = true;
}

/* ─────────────────────────────────────────
   6. PASSWORD TOGGLE (global)
───────────────────────────────────────── */
window.togglePwd = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
};

/* ─────────────────────────────────────────
   7. QUIZ ENGINE
───────────────────────────────────────── */

// Quiz state
const quizState = {
  session: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: null,
  timer: null,
  streak: 0,
  numQuestions: 10,
  subject: '',
  topic: '',
  mode: 'adaptive'
};

// ── SETUP FUNCTIONS ──

window.loadTopics = function() {
  const subjectSelect = document.getElementById('subjectSelect');
  const topicGroup = document.getElementById('topicGroup');
  const topicSelect = document.getElementById('topicSelect');

  if (!subjectSelect || !topicGroup || !topicSelect) return;

  const subject = subjectSelect.value;
  if (!subject) { topicGroup.style.display = 'none'; return; }

  topicGroup.style.display = 'block';
  quizState.subject = subject;

  /* ── BACKEND INTEGRATION ──
     API: GET /api/subjects/{subject}/topics
     Replace mock data with:
     
     fetch(`/api/subjects/${subject}/topics`)
       .then(r => r.json())
       .then(topics => {
         topicSelect.innerHTML = '<option value="">All Topics</option>';
         topics.forEach(t => {
           const opt = document.createElement('option');
           opt.value = t.id;
           opt.textContent = t.name + (t.mastery ? ` (${t.mastery}%)` : '');
           topicSelect.appendChild(opt);
         });
       });
  */

  // MOCK topics per subject
  const mockTopics = {
    mathematics: ['Algebra','Quadratic Equations','Geometry','Trigonometry','Calculus','Statistics','Vectors','Sequences & Series'],
    english: ['Comprehension','Grammar','Essay Writing','Oral Forms','Summary','Lexis & Structure'],
    biology: ['Cell Biology','Cell Division','Genetics','Ecology','Evolution','Human Physiology','Photosynthesis','Biological Molecules'],
    chemistry: ['Atomic Structure','Chemical Bonding','Organic Chemistry','Electrochemistry','Acids & Bases','Periodic Table','Stoichiometry'],
    physics: ['Forces & Mechanics','Waves','Electricity','Optics','Thermodynamics','Modern Physics','Vectors in Physics']
  };

  const topics = mockTopics[subject] || [];
  topicSelect.innerHTML = '<option value="">All Topics</option>';
  topics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.toLowerCase().replace(/\s+/g, '_');
    opt.textContent = t;
    topicSelect.appendChild(opt);
  });
};

window.setNumQ = function(btn) {
  document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  quizState.numQuestions = parseInt(btn.dataset.num);
};

window.startAdaptiveQuiz = function() {
  quizState.mode = 'adaptive';
  quizState.subject = 'adaptive';
  quizState.topic = '';
  fetchAndStartQuiz();
};

window.startCustomQuiz = function() {
  const subject = document.getElementById('subjectSelect')?.value;
  if (!subject) { alert('Please select a subject first.'); return; }
  quizState.mode = 'custom';
  quizState.subject = subject;
  quizState.topic = document.getElementById('topicSelect')?.value || '';
  fetchAndStartQuiz();
};


/* ─────────────────────────────────────────
   8. SMOOTH SCROLL
───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─────────────────────────────────────────
   9. INTERSECTION OBSERVER — ANIMATIONS
───────────────────────────────────────── */
(function initAnimations() {
  const animEls = document.querySelectorAll('.subject-card, .feature-card, .rule-card, .step, .ov-card, .dash-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.5s ease forwards';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Add base style for animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .subject-card, .feature-card, .rule-card, .step, .ov-card, .dash-card {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  animEls.forEach((el, i) => {
    el.style.animationDelay = (i * 0.07) + 's';
    observer.observe(el);
  });
})();

console.log('%c⚡ DMA Frontend Loaded', 'color:#4f8ef7;font-size:14px;font-weight:bold;');
console.log('%cBackend team: See comments in app.js for API integration points', 'color:#8b9abf;font-size:12px;');
