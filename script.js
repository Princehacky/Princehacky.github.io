// Mobile Menu
const navToggle =
document.querySelector(".nav-toggle");

const mainNav =
document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
mainNav.classList.toggle("open");
});

// Contact Form
const form =
document.getElementById("contact-form");

const feedback =
document.getElementById("form-feedback");

form.addEventListener("submit", (e) => {

e.preventDefault();

const name =
document.getElementById("name").value.trim();

const message =
document.getElementById("message").value.trim();

if (!name || !message) {

feedback.textContent =
"Please fill all fields";

feedback.style.color = "red";

return;

}

feedback.textContent =
"Message received. Thank you " + name;

feedback.style.color = "lightgreen";

form.reset();

});

// Visitor Counter
let count =
localStorage.getItem("visitor-count");

if (!count) {

count = 1;

} else {

count = Number(count) + 1;

}

localStorage.setItem(
"visitor-count",
count
);

const counter =
document.getElementById("visitor-count");

counter.textContent = count;

// Theme Toggle
const toggleBtn =
document.getElementById("theme-toggle");

toggleBtn.addEventListener("click", () => {

document.body.classList.toggle("dark-mode");

});