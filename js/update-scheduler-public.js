(() => {
  'use strict';

  const core = window.UpdateSchedulerCore;
  if (!core) {
    console.error('UpdateSchedulerCore is required.');
    return;
  }

  const updatesList = document.getElementById('public-updates-list');
  const loadingState = document.getElementById('public-updates-loading');
  const emptyState = document.getElementById('public-updates-empty');
  const errorState = document.getElementById('public-updates-error');

  document.addEventListener('DOMContentLoaded', () => {
    if (updatesList) {
      loadPublicUpdates();
    }
  });

  async function loadPublicUpdates() {
    setPublicState('loading');

    try {
      const updates = await core.loadUpdates();
      const published = core
        .sortByNewestScheduledOrPublished(Array.isArray(updates) ? updates : [])
        .filter((item) => item.status === 'published');

      renderPublicUpdates(published);
      setPublicState(published.length ? 'success' : 'empty');
    } catch (error) {
      console.error('Failed to load public updates:', error);
      setPublicState('error', error.message || 'Unable to load updates right now.');
    }
  }

  function renderPublicUpdates(updates) {
    if (!updatesList) return;

    updatesList.innerHTML = updates.map((update) => {
      const image = update.image_url
        ? `<img src="${core.escapeHTML(update.image_url)}" alt="${core.escapeHTML(update.title || 'Update image')}" loading="lazy" decoding="async">`
        : '';

      const actionButton = update.button_text && update.button_url
        ? `<a class="btn btn-small" href="${core.escapeHTML(update.button_url)}" target="_blank" rel="noopener noreferrer">${core.escapeHTML(update.button_text)}</a>`
        : '';

      return `
        <article class="card public-update-card">
          ${image}
          <div class="public-update-content">
            <h2>${core.escapeHTML(update.title || 'Untitled update')}</h2>
            <p class="update-meta">${core.escapeHTML(update.type || 'Custom')} · ${core.escapeHTML(core.formatDateTimeInTimezone(update.published_at || update.scheduled_at, update.timezone || core.DEFAULT_TIMEZONE))}</p>
            <p>${core.escapeHTML(update.description || '')}</p>
            <div class="full-update-content">${core.escapeHTML(update.content || '')}</div>
            ${actionButton}
          </div>
        </article>
      `;
    }).join('');
  }

  function setPublicState(mode, message = '') {
    if (loadingState) loadingState.hidden = mode !== 'loading';
    if (emptyState) emptyState.hidden = mode !== 'empty';
    if (errorState) {
      errorState.hidden = mode !== 'error';
      errorState.textContent = message;
    }
  }

  async function renderLatestUpdatesSection(target) {
    const container = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!container) return;

    container.innerHTML = '<p class="message">Loading latest updates...</p>';

    try {
      const updates = await core.loadUpdates();
      const latest = core
        .sortByNewestScheduledOrPublished(Array.isArray(updates) ? updates : [])
        .filter((item) => item.status === 'published')
        .slice(0, 3);

      if (!latest.length) {
        container.innerHTML = '<p class="message">No published updates yet.</p><a class="btn btn-small" href="/updates/">View All Updates</a>';
        return;
      }

      container.innerHTML = `
        <div class="latest-updates-grid">
          ${latest.map((update) => `
            <article class="card">
              <h3>${core.escapeHTML(update.title || 'Untitled update')}</h3>
              <p class="update-meta">${core.escapeHTML(core.formatDateTimeInTimezone(update.published_at || update.scheduled_at, update.timezone || core.DEFAULT_TIMEZONE))}</p>
              <p>${core.escapeHTML(update.description || '')}</p>
            </article>
          `).join('')}
        </div>
        <div class="latest-updates-actions">
          <a class="btn" href="/updates/">View All Updates</a>
        </div>
      `;
    } catch (error) {
      container.innerHTML = `<p class="message error">${core.escapeHTML(error.message || 'Could not load latest updates.')}</p>`;
    }
  }

  window.renderLatestUpdatesSection = renderLatestUpdatesSection;
})();
