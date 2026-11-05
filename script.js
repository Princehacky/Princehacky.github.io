(() => {
  'use strict';

  const body = document.body;
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const pageLinks = document.querySelectorAll('a[href^="#"]');
  const themeToggle = document.getElementById('theme-toggle');
  const visitorCount = document.getElementById('visitor-count');
  const form = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setTheme = (theme) => {
    const dark = theme !== 'light';
    body.classList.toggle('dark-mode', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(body.classList.contains('dark-mode') ? 'light' : 'dark');
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

  pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const section = document.querySelector(targetId);
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      history.replaceState(null, '', targetId);
    });
  });

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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        });
        const activeLink = sectionMap.get(entry.target);
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.05 });

    sectionMap.forEach((_, section) => observer.observe(section));
  }

  if (!prefersReducedMotion && revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        currentObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('revealed'));
  }

  /* Small, personal developer terminal. */
  const addTerminal = () => {
    if (!document.getElementById('home') || document.getElementById('prince-terminal')) return;


    const section = document.createElement('section');
    section.id = 'prince-terminal';
    section.className = 'section';
    section.setAttribute('aria-labelledby', 'terminal-title');
    section.innerHTML = `
      <div class="container">
        <h2 id="terminal-title">A Little Developer Corner</h2>
        <p class="section-intro">Try a few commands. This is a small feature I built for the site.</p>
        <div class="terminal">
          <div class="terminal-bar">PrinceHacky Terminal</div>
          <div id="terminal-output" class="terminal-output" role="log" aria-live="polite"></div>
          <div class="terminal-input-row">
            <span class="terminal-prompt" aria-hidden="true">prince@portfolio:~$</span>
            <input id="terminal-input" type="text" autocomplete="off" spellcheck="false" aria-label="Terminal command" placeholder="Type help and press Enter">
          </div>
        </div>
      </div>
    `;

    const projectsSection = document.getElementById('projects');
    if (projectsSection) projectsSection.parentNode.insertBefore(section, projectsSection);
    else document.querySelector('main')?.appendChild(section);

    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-input');
    const history = [];
    let historyIndex = 0;

    const print = (text, className = '') => {
      const line = document.createElement('p');
      line.className = 'terminal-line' + (className ? ` ${className}` : '');
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    const commands = {
      help: () => print('about  skills  projects  github  contact  clear'),
      about: () => print('I am Prince, a student learning to build things with code.'),
      skills: () => print('HTML  CSS  beginner JavaScript  Scratch'),
      projects: () => print('Use the Projects section to explore what I have built.'),
      github: () => window.open('https://github.com/Princehacky', '_blank', 'noopener,noreferrer'),
      contact: () => document.getElementById('contact')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' }),
      clear: () => { output.textContent = ''; }
    };

    print('Type "help" to see the commands.', 'terminal-help');

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const command = input.value.trim().toLowerCase();
        if (!command) return;
        print(`> ${command}`, 'terminal-command');
        history.push(command);
        historyIndex = history.length;

        if (commands[command]) commands[command]();
        else print(`I do not know "${command}". Try help.`, 'terminal-help');

        input.value = '';
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (historyIndex > 0) input.value = history[--historyIndex];
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex < history.length - 1) input.value = history[++historyIndex];
        else { historyIndex = history.length; input.value = ''; }
      }
    });
  };

  const addProjectFilters = () => {
    const cards = document.querySelectorAll('.cards .card');
    const projectSection = document.getElementById('project-links-title');
    if (!cards.length || !projectSection || document.getElementById('project-search')) return;

    const controls = document.createElement('div');
    controls.className = 'project-controls';
    controls.innerHTML = `
      <label for="project-search">Search projects</label>
      <input id="project-search" type="search" placeholder="Try cube, wiki, documents..." autocomplete="off">
      <div class="project-filters" role="group" aria-label="Project filters">
        <button type="button" class="btn btn-small active-filter" data-filter="all">All</button>
        <button type="button" class="btn btn-small" data-filter="web">Web</button>
        <button type="button" class="btn btn-small" data-filter="tool">Tools</button>
        <button type="button" class="btn btn-small" data-filter="learning">Learning</button>
      </div>
      <p id="project-results" class="section-intro" aria-live="polite"></p>
    `;


    projectSection.parentElement.insertBefore(controls, projectSection.parentElement.querySelector('.cards'));

    const classify = (card) => {
      const text = card.textContent.toLowerCase();
      if (text.includes('documents') || text.includes('wiki') || text.includes('pattern')) return 'learning';
      if (text.includes('cube')) return 'tool';
      return 'web';
    };

    cards.forEach((card) => card.dataset.projectType = classify(card));

    const search = document.getElementById('project-search');
    const result = document.getElementById('project-results');
    const filterButtons = controls.querySelectorAll('[data-filter]');

    const apply = () => {
      const query = search.value.trim().toLowerCase();
      const active = controls.querySelector('.active-filter')?.dataset.filter || 'all';
      let shown = 0;

      cards.forEach((card) => {
        const matchesText = !query || card.textContent.toLowerCase().includes(query);
        const matchesType = active === 'all' || card.dataset.projectType === active;
        const visible = matchesText && matchesType;
        card.classList.toggle('project-card-hidden', !visible);
        if (visible) shown += 1;
      });

      result.textContent = `${shown} project${shown === 1 ? '' : 's'} shown`;
    };

    search.addEventListener('input', apply);
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('active-filter'));
        button.classList.add('active-filter');
        apply();
      });
    });

    apply();
  };

  addTerminal();
  addProjectFilters();
})();
