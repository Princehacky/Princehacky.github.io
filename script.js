/* ==============================
   script.js — Prince U. Shah Portfolio
   ============================== */

/* ── 1. Mobile Nav Toggle ── */
const navToggle = document.querySelector(".nav-toggle");
const mainNav   = document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});

/* ── 2. Close nav when a link is clicked (mobile UX) ── */
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
  });
});

/* ── 3. Theme Toggle ── */
const themeToggleBtn = document.getElementById("theme-toggle");

// Remember the user's preference across page loads
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.remove("dark-mode");
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", currentTheme);
});

/* ── 4. Visitor Counter ── */
let count = Number(localStorage.getItem("visitor-count")) || 0;
count += 1;
localStorage.setItem("visitor-count", count);
document.getElementById("visitor-count").textContent = count;

/* ── 5. Contact Form ── */
const form     = document.getElementById("contact-form");
const feedback = document.getElementById("form-feedback");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name    = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !message) {
    feedback.textContent = "⚠️ Please fill in your name and message.";
    feedback.className   = "error";
    return;
  }

  feedback.textContent = `✅ Message received. Thank you, ${name}!`;
  feedback.className   = "success";
  form.reset();

  // Clear feedback after 4 seconds
  setTimeout(() => {
    feedback.textContent = "";
    feedback.className   = "";
  }, 4000);
});

/* ── 6. Scroll-reveal animation ── */
const sections = document.querySelectorAll(".section");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.15 }
);

sections.forEach(sec => observer.observe(sec));

/* ── 7. Active nav-link highlight on scroll ── */
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(sec => {
    const sectionTop = sec.offsetTop - 80;
    if (window.scrollY >= sectionTop) {
      current = sec.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});
