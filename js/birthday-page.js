(() => {
  const lifecycle = window.PrinceBirthdayLifecycle;
  if (!lifecycle) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const byId = (id) => document.getElementById(id);
  const toArray = (nodeList) => Array.from(nodeList || []);

  const hideGroup = (selector, hidden) => {
    toArray(document.querySelectorAll(selector)).forEach((el) => {
      el.hidden = hidden;
    });
  };

  const setText = (id, value) => {
    const node = byId(id);
    if (node) node.textContent = value;
  };

  const createCard = (wish, local = false) => {
    const article = document.createElement('article');
    article.className = 'card wish-card reveal-on-scroll';

    const heading = document.createElement('h3');
    heading.textContent = wish.name;

    const message = document.createElement('p');
    message.textContent = wish.message;

    const meta = document.createElement('p');
    meta.className = 'wish-meta';
    meta.textContent = local ? 'Saved on this device only' : (wish.source || 'Public');

    article.appendChild(heading);
    article.appendChild(message);
    article.appendChild(meta);
    return article;
  };

  const loadLocalWishes = () => {
    try {
      const raw = localStorage.getItem('princehacky-birthday-wishes-2026-local');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLocalWishes = (items) => {
    localStorage.setItem('princehacky-birthday-wishes-2026-local', JSON.stringify(items));
  };

  const renderWishes = (approved, local) => {
    const wrap = byId('birthday-wishes-list');
    if (!wrap) return;
    wrap.innerHTML = '';

    approved.forEach((wish) => wrap.appendChild(createCard(wish, false)));
    local.forEach((wish) => wrap.appendChild(createCard(wish, true)));

    if (approved.length === 0 && local.length === 0) {
      const note = document.createElement('p');
      note.className = 'section-intro';
      note.textContent = 'No wishes yet. Be the first to leave one.';
      wrap.appendChild(note);
    }
  };

  const renderListSection = (targetId, items) => {
    const list = byId(targetId);
    if (!list) return;
    list.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  };

  const renderLinkedCards = (targetId, items) => {
    const list = byId(targetId);
    if (!list) return;
    list.innerHTML = '';

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card reveal-on-scroll';

      const h3 = document.createElement('h3');
      h3.textContent = item.title || item.name || 'Item';

      const p = document.createElement('p');
      p.textContent = item.description || item.summary || '';

      const action = document.createElement('div');
      action.className = 'card-actions';

      if (item.link || item.href) {
        const a = document.createElement('a');
        a.className = 'btn btn-small';
        a.href = item.link || item.href;
        a.textContent = item.linkLabel || 'Open';
        action.appendChild(a);
      }

      card.appendChild(h3);
      card.appendChild(p);
      if (action.children.length > 0) card.appendChild(action);
      list.appendChild(card);
    });
  };

  const throwConfetti = () => {
    const wrap = byId('confetti-layer');
    if (!wrap) return;
    wrap.innerHTML = '';

    const burstCount = prefersReducedMotion ? 8 : 24;
    for (let i = 0; i < burstCount; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 260}ms`;
      piece.style.background = ['#2f7de1', '#37d67a', '#f4ca64'][i % 3];
      wrap.appendChild(piece);
    }

    window.setTimeout(() => {
      wrap.innerHTML = '';
    }, prefersReducedMotion ? 1000 : 2300);
  };

  const wireSurprise = () => {
    const button = byId('birthday-surprise-btn');
    const hiddenMessage = byId('birthday-surprise-message');
    if (!button || !hiddenMessage) return;

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      button.setAttribute('aria-expanded', String(next));
      hiddenMessage.hidden = !next;
      if (next) throwConfetti();
    });
  };

  const wireWishesForm = (approvedWishes) => {
    const form = byId('birthday-wish-form');
    const feedback = byId('birthday-wish-feedback');
    if (!form || !feedback) return;

    const nameInput = byId('wish-name');
    const messageInput = byId('wish-message');

    const updateFeedback = (msg, isError = false) => {
      feedback.textContent = msg;
      feedback.classList.toggle('error-text', isError);
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = (nameInput?.value || '').trim();
      const message = (messageInput?.value || '').trim();

      if (!name || !message) {
        updateFeedback('Please enter both your name and birthday wish.', true);
        return;
      }

      if (name.length > 50 || message.length > 280) {
        updateFeedback('Please keep your name under 50 chars and message under 280 chars.', true);
        return;
      }

      const localWishes = loadLocalWishes();
      localWishes.unshift({ name, message, source: 'Local' });
      saveLocalWishes(localWishes.slice(0, 25));

      renderWishes(approvedWishes, loadLocalWishes());
      form.reset();
      updateFeedback('Saved on your device. Public publishing requires manual approval and secure backend handling.');
    });
  };

  const applyPhase = (context) => {
    setText('birthday-status', context.statusText);
    setText('launch-time-display', context.formattedLaunch);
    setText('expiry-time-display', context.formattedExpiry);

    hideGroup('[data-coming-only]', !context.isComingSoon);
    hideGroup('[data-live-only]', !context.isLive);
    hideGroup('[data-archive-only]', !context.isArchive);

    const countdownLabel = byId('birthday-countdown-label');
    const countdownValue = byId('birthday-countdown-value');

    if (countdownLabel) countdownLabel.textContent = context.countdownLabel;

    if (countdownValue) {
      if (!Number.isFinite(context.countdownTargetMs)) {
        countdownValue.textContent = context.isArchive ? 'Archive mode active' : 'Not active';
      } else {
        const tick = () => {
          const diff = context.countdownTargetMs - Date.now();
          countdownValue.textContent = lifecycle.formatCountdown(diff);
        };
        tick();
        window.setInterval(tick, 1000);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const sourceNode = byId('birthday-time-source');

    try {
      const context = await lifecycle.getContext();
      const config = context.config || {};
      const profile = config.profile || {};
      const content = config.content || {};

      setText('birthday-page-title', profile.birthdayTitle || 'PrinceHacky Birthday 2026');
      setText('birthday-greeting', content.heroGreeting || 'Welcome to my birthday page.');
      setText('birthday-age', String(context.eventConfig?.age ?? 13));
      setText('birthday-date', context.eventConfig?.launchDate || '2026-10-09');
      setText('birthday-personal-greeting', content.personalGreeting || 'Thanks for visiting.');

      renderLinkedCards('year-review-cards', Array.isArray(content.yearInReview) ? content.yearInReview : []);
      renderLinkedCards('birthday-project-cards', Array.isArray(content.featuredProjects) ? content.featuredProjects : []);
      renderListSection('what-i-learned-list', Array.isArray(content.whatILearned) ? content.whatILearned : []);
      renderListSection('next-year-goals-list', Array.isArray(content.nextYearGoals) ? content.nextYearGoals : []);

      const approvedWishes = Array.isArray(content.approvedWishes) ? content.approvedWishes : [];
      renderWishes(approvedWishes, loadLocalWishes());
      wireWishesForm(approvedWishes);

      applyPhase(context);
      wireSurprise();

      if (sourceNode) {
        sourceNode.textContent = context.nowSource === 'server-header'
          ? 'Using server time header for event status.'
          : 'Server time header unavailable, currently using local clock fallback.';
      }

      if (context.phase === 'setup-needed') {
        hideGroup('[data-live-only]', true);
        hideGroup('[data-coming-only]', false);
        setText('birthday-status', 'Setup needed');
        setText('birthday-countdown-value', 'Update config first');
      }
    } catch (error) {
      setText('birthday-status', 'Unavailable');
      setText('birthday-countdown-value', 'Could not load birthday config');
      if (sourceNode) sourceNode.textContent = 'Birthday data could not be loaded.';
    }
  });
})();
