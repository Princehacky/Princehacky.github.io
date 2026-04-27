// ── Mobile navigation toggle ──────────────────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const mainNav   = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
}

// ── Highlight active nav link on scroll ───────────────────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('nav .nav-link');

function highlightNavOnScroll() {
  const scrollY = window.scrollY;

  sections.forEach(section => {
    const sectionTop    = section.offsetTop - 90;   // header height offset
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
highlightNavOnScroll(); // run once on load

// ── Close mobile nav when a link is clicked ────────────────────────────────────
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (mainNav) mainNav.classList.remove('open');
  });
});

// ── Contact form validation & feedback ────────────────────────────────────────
const contactForm = document.getElementById('contact-form');
const feedback    = document.getElementById('form-feedback');

if (contactForm && feedback) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Basic validation
    if (!name || !email || !message) {
      feedback.textContent = '⚠️ Please fill in all fields before sending.';
      feedback.className   = 'error';
      return;
    }

    // Simple email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      feedback.textContent = '⚠️ Please enter a valid email address.';
      feedback.className   = 'error';
      return;
    }

    // Success (no backend — just UI feedback)
    feedback.textContent = `✅ Thanks, ${name}! Your message has been received.`;
    feedback.className   = 'success';
    contactForm.reset();
  });
}
