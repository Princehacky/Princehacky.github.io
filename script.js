// ══════════════════════════════════════════════════════════════════════════════
// Prince U. Shah Portfolio — script.js
// Contains: theme toggle, visitor counter, scroll animations,
//           skill bar animation, mobile nav, active nav highlight, contact form
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. DARK / LIGHT MODE TOGGLE ───────────────────────────────────────────────
// Dark mode is the default. The chosen theme is saved in localStorage so it
// is remembered when the visitor comes back.

const themeToggle = document.getElementById('theme-toggle');
const htmlEl      = document.documentElement;   // <html> element holds data-theme

// Load saved theme from localStorage, or fall back to "dark"
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);
updateToggleIcon(savedTheme);

// Click: flip between dark and light
themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateToggleIcon(next);
});

// Update the button emoji to match the current theme
function updateToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}


// ── 2. VISITOR COUNTER ────────────────────────────────────────────────────────
// A simple counter stored in localStorage. It goes up by 1 each page load.

const counterEl = document.getElementById('visitor-count');

// Read the current count (default to 0 if first visit)
let visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
visitCount += 1;
localStorage.setItem('visitCount', visitCount);

// Display the count with a small count-up animation
animateCount(counterEl, 0, visitCount, 800);

// Counts a number up from `from` to `to` over `duration` milliseconds
function animateCount(el, from, to, duration) {
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(progress * (to - from) + from);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


// ── 3. SCROLL FADE-IN ANIMATION ───────────────────────────────────────────────
// Elements with class "fade-in" start hidden (see CSS) and become visible
// when they scroll into the viewport. Uses IntersectionObserver for performance.

const fadeEls = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Once visible no need to keep observing
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));


// ── 4. SKILL BAR ANIMATION ────────────────────────────────────────────────────
// Each .skill-bar element has a data-width attribute (e.g. data-width="65").
// When the Skills section scrolls into view the bars animate to that width.

const skillBars    = document.querySelectorAll('.skill-bar');
const skillSection = document.getElementById('skills');

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Animate each bar to its target width
      skillBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-width') + '%';
        bar.style.width = targetWidth;
      });
      // Stop observing after first trigger
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

if (skillSection) skillObserver.observe(skillSection);


// ── 5. MOBILE NAVIGATION TOGGLE ───────────────────────────────────────────────
// The hamburger button shows/hides the nav on small screens.

const navToggle = document.querySelector('.nav-toggle');
const mainNav   = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

// Close mobile nav when any link is clicked
const navLinks = document.querySelectorAll('nav .nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (mainNav) {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});


// ── 6. ACTIVE NAV LINK HIGHLIGHT ON SCROLL ────────────────────────────────────
// As the visitor scrolls, the matching nav link gets an "active" class.

const sections = document.querySelectorAll('section[id]');

function highlightNavOnScroll() {
  const scrollY = window.scrollY;

  sections.forEach(section => {
    const sectionTop    = section.offsetTop - 100;  // header height offset
    const sectionHeight = section.offsetHeight;
    const sectionId     = section.getAttribute('id');

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${sectionId}`
        );
      });
    }
  });
}

window.addEventListener('scroll', highlightNavOnScroll, { passive: true });
highlightNavOnScroll();  // run once on load so first section is highlighted


// ── 7. CONTACT FORM HANDLER ────────────────────────────────────────────────────
// No backend — just shows a thank-you message when the form is submitted.

const contactForm = document.getElementById('contact-form');
const feedback    = document.getElementById('form-feedback');

if (contactForm && feedback) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();

    // Make sure both fields are filled in
    if (!name || !message) {
      feedback.textContent = '⚠️ Please fill in your name and message.';
      feedback.className   = 'error';
      return;
    }

    // Show success message and clear the form
    feedback.textContent = `✅ Thanks, ${name}! Your message has been received.`;
    feedback.className   = 'success';
    contactForm.reset();
  });
}
