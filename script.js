(() => {
  const body = document.body;
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const themeToggle = document.getElementById('theme-toggle');
  const visitorCount = document.getElementById('visitor-count');
  const form = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  const setTheme = (theme) => {
    const dark = theme !== 'light';
    body.classList.toggle('dark-mode', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    setTheme(savedTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = body.classList.contains('dark-mode') ? 'light' : 'dark';
      setTheme(next);
    });
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (visitorCount) {
    const count = (Number(localStorage.getItem('visitor-count')) || 0) + 1;
    localStorage.setItem('visitor-count', String(count));
    visitorCount.textContent = String(count);
  }

  if (form && formFeedback) {
    form.addEventListener('submit', () => {
      formFeedback.textContent = 'Sending message...';
    });
  }

  const sectionMap = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href')?.replace('#', '');
    if (!id) return;
    const section = document.getElementById(id);
    if (section) sectionMap.set(section, link);
  });

  if (sectionMap.size > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => link.classList.remove('active'));
          const activeLink = sectionMap.get(entry.target);
          if (activeLink) activeLink.classList.add('active');
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.05 }
    );

    sectionMap.forEach((_, section) => observer.observe(section));
  }
})();
