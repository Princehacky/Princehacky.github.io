(() => {
  'use strict';

  const core = window.UpdateSchedulerCore;
  if (!core) {
    console.error('UpdateSchedulerCore is required.');
    return;
  }

  const elements = {
    loginSection: document.getElementById('login-section'),
    adminSection: document.getElementById('admin-section'),
    loginForm: document.getElementById('login-form'),
    loginMessage: document.getElementById('login-message'),
    logoutButton: document.getElementById('logout-button'),
    schedulerForm: document.getElementById('scheduler-form'),
    formMessage: document.getElementById('form-message'),
    statusMessage: document.getElementById('scheduler-status-message'),
    updatesContainer: document.getElementById('updates-list'),
    emptyState: document.getElementById('updates-empty'),
    loadingState: document.getElementById('updates-loading'),
    errorState: document.getElementById('updates-error'),
    calendarView: document.getElementById('calendar-view'),
    listView: document.getElementById('list-view'),
    searchInput: document.getElementById('search-updates'),
    statusFilter: document.getElementById('status-filter'),
    typeFilter: document.getElementById('type-filter'),
    viewSwitchButtons: document.querySelectorAll('[data-view]'),
    totalCounts: document.getElementById('status-counts'),
    refreshButton: document.getElementById('refresh-updates'),
    resetFormButton: document.getElementById('reset-form'),
    newUpdateButton: document.getElementById('new-update-button')
  };

  const state = {
    allUpdates: [],
    filteredUpdates: [],
    activeView: 'list',
    editingId: null,
    loading: false,
    actionInProgress: false
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderTypeOptions();
    setDateInputMinimums();
    setupEvents();
    checkAdminSession();
  });

  function setupEvents() {
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', onLoginSubmit);
    }

    if (elements.logoutButton) {
      elements.logoutButton.addEventListener('click', onLogout);
    }

    if (elements.schedulerForm) {
      elements.schedulerForm.addEventListener('submit', onSchedulerSubmit);
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', applyFilters);
    }

    if (elements.statusFilter) {
      elements.statusFilter.addEventListener('change', applyFilters);
    }

    if (elements.typeFilter) {
      elements.typeFilter.addEventListener('change', applyFilters);
    }

    elements.viewSwitchButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setView(button.getAttribute('data-view'));
      });
    });

    if (elements.refreshButton) {
      elements.refreshButton.addEventListener('click', () => fetchAndRenderUpdates());
    }

    if (elements.resetFormButton) {
      elements.resetFormButton.addEventListener('click', resetSchedulerForm);
    }

    if (elements.newUpdateButton) {
      elements.newUpdateButton.addEventListener('click', resetSchedulerForm);
    }
  }

  function renderTypeOptions() {
    const target = elements.typeFilter;
    const formType = document.getElementById('update-type');

    if (!target || !formType) {
      return;
    }

    core.UPDATE_TYPES.forEach((type) => {
      const filterOption = document.createElement('option');
      filterOption.value = type;
      filterOption.textContent = type;
      target.appendChild(filterOption);

      const formOption = document.createElement('option');
      formOption.value = type;
      formOption.textContent = type;
      formType.appendChild(formOption);
    });

    const timezoneSelect = document.getElementById('timezone');
    if (timezoneSelect) {
      core.TIMEZONES.forEach((zone) => {
        const option = document.createElement('option');
        option.value = zone.value;
        option.textContent = zone.label;
        if (zone.value === core.DEFAULT_TIMEZONE) option.selected = true;
        timezoneSelect.appendChild(option);
      });
    }
  }

  function setDateInputMinimums() {
    const now = core.parseDateInTimezone(new Date().toISOString(), core.DEFAULT_TIMEZONE);
    const dateInput = document.getElementById('scheduled-date');
    if (dateInput && now?.date) {
      dateInput.min = now.date;
    }
  }

  async function checkAdminSession() {
    if (!window.supabaseClient) {
      showLogin();
      setLoginMessage('Supabase is not loaded.');
      return;
    }

    try {
      const result = await window.supabaseClient.auth.getSession();
      if (result.error) throw result.error;

      if (!result.data.session) {
        showLogin();
        return;
      }

      const isAdmin = await verifyAdmin(result.data.session.user.id);
      if (!isAdmin) {
        await window.supabaseClient.auth.signOut();
        showLogin();
        setLoginMessage('This account is not an admin.');
        return;
      }

      showAdmin();
      await fetchAndRenderUpdates();
    } catch (error) {
      showLogin();
      setLoginMessage(error.message || 'Unable to verify session.');
    }
  }

  async function verifyAdmin(userId) {
    const result = await window.supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (result.error) {
      console.error('Admin verification failed:', result.error);
      return false;
    }

    return Boolean(result.data);
  }

  async function onLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value || '';

    setLoginMessage('Signing in...');

    try {
      const result = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;

      const user = result.data.user;
      if (!user) throw new Error('Login failed.');

      const isAdmin = await verifyAdmin(user.id);
      if (!isAdmin) {
        await window.supabaseClient.auth.signOut();
        throw new Error('This account is not an admin.');
      }

      setLoginMessage('');
      showAdmin();
      await fetchAndRenderUpdates();
    } catch (error) {
      setLoginMessage(error.message || 'Login failed.');
    }
  }

  async function onLogout() {
    if (!window.supabaseClient) return;

    elements.logoutButton.disabled = true;
    try {
      await window.supabaseClient.auth.signOut();
      showLogin();
    } finally {
      elements.logoutButton.disabled = false;
    }
  }

  async function fetchAndRenderUpdates() {
    if (state.loading) return;

    state.loading = true;
    setUiState('loading');

    try {
      const updates = await core.loadUpdates();
      state.allUpdates = core.sortByNewestScheduledOrPublished(Array.isArray(updates) ? updates : []);
      applyFilters();
      setUiState('success');
      setStatusMessage('Updates loaded successfully.', 'success');
    } catch (error) {
      console.error('Failed to load updates:', error);
      setUiState('error', error.message || 'Could not load updates.');
      setStatusMessage(error.message || 'Database error while loading updates.', 'error');
      state.allUpdates = [];
      state.filteredUpdates = [];
      renderStatusCounts();
      renderCurrentView();
    } finally {
      state.loading = false;
    }
  }

  function applyFilters() {
    state.filteredUpdates = core.filterUpdates(state.allUpdates, {
      status: elements.statusFilter?.value || 'all',
      type: elements.typeFilter?.value || 'all',
      query: elements.searchInput?.value || ''
    });

    renderStatusCounts();
    renderCurrentView();
  }

  function renderStatusCounts() {
    if (!elements.totalCounts) return;

    const counts = core.UPDATE_STATUSES.reduce((acc, status) => {
      acc[status] = state.allUpdates.filter((item) => item.status === status).length;
      return acc;
    }, {});

    elements.totalCounts.innerHTML = `
      <span class="status-chip status-chip-draft">Draft: ${counts.draft || 0}</span>
      <span class="status-chip status-chip-scheduled">Scheduled: ${counts.scheduled || 0}</span>
      <span class="status-chip status-chip-published">Published: ${counts.published || 0}</span>
      <span class="status-chip status-chip-cancelled">Cancelled: ${counts.cancelled || 0}</span>
      <span class="status-chip status-chip-failed">Failed: ${counts.failed || 0}</span>
    `;
  }

  function renderCurrentView() {
    const hasItems = state.filteredUpdates.length > 0;
    if (elements.emptyState) elements.emptyState.hidden = hasItems;

    if (state.activeView === 'calendar') {
      if (elements.listView) elements.listView.hidden = true;
      if (elements.calendarView) elements.calendarView.hidden = false;
      renderCalendarView(state.filteredUpdates);
      return;
    }

    if (elements.listView) elements.listView.hidden = false;
    if (elements.calendarView) elements.calendarView.hidden = true;
    renderListView(state.filteredUpdates);
  }

  function renderListView(updates) {
    if (!elements.updatesContainer) return;

    if (!updates.length) {
      elements.updatesContainer.innerHTML = '';
      return;
    }

    const statusNames = {
      scheduled: 'Upcoming updates',
      draft: 'Draft updates',
      published: 'Published updates',
      cancelled: 'Cancelled updates',
      failed: 'Failed updates'
    };

    const selectedStatus = elements.statusFilter?.value || 'all';
    const grouped = core.UPDATE_STATUSES
      .filter((status) => selectedStatus === 'all' || status === selectedStatus)
      .map((status) => ({
        status,
        heading: statusNames[status] || status,
        items: updates.filter((item) => item.status === status)
      }));

    elements.updatesContainer.innerHTML = grouped.map((group) => `
      <section class="status-group" aria-labelledby="status-${core.escapeHTML(group.status)}-title">
        <h3 id="status-${core.escapeHTML(group.status)}-title">${core.escapeHTML(group.heading)}</h3>
        ${group.items.length ? group.items.map(renderUpdateCard).join('') : '<p>No updates in this status.</p>'}
      </section>
    `).join('');

    elements.updatesContainer.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', () => onUpdateAction(button));
    });
  }

  function renderUpdateCard(update) {
      const countdown = update.status === 'scheduled' ? core.formatCountdown(update.scheduled_at) : '';
      const comingSoon = update.status === 'scheduled' && countdown ? '<p class="coming-soon">Coming soon</p>' : '';
      const countdownText = countdown ? `<p class="countdown-text">${core.escapeHTML(countdown)}</p>` : '';

      return `
        <article class="card update-card" data-update-id="${core.escapeHTML(update.id)}">
          <header class="update-card-header">
            <h3>${core.escapeHTML(update.title || 'Untitled update')}</h3>
            <span class="status-chip status-chip-${core.escapeHTML(update.status || 'draft')}">${core.escapeHTML(update.status || 'draft')}</span>
          </header>
          <p class="update-meta">${core.escapeHTML(update.type || 'Custom')} · ${core.escapeHTML(core.formatDateTimeInTimezone(update.scheduled_at, update.timezone || core.DEFAULT_TIMEZONE))}</p>
          <p>${core.escapeHTML(update.description || '')}</p>
          ${comingSoon}
          ${countdownText}
          <div class="action-row">
            <button type="button" class="btn btn-small" data-action="edit" data-id="${core.escapeHTML(update.id)}">Edit</button>
            <button type="button" class="btn btn-small btn-secondary" data-action="cancel" data-id="${core.escapeHTML(update.id)}">Cancel</button>
            <button type="button" class="btn btn-small" data-action="publish" data-id="${core.escapeHTML(update.id)}">Publish Now</button>
            <button type="button" class="btn btn-small btn-secondary" data-action="reschedule" data-id="${core.escapeHTML(update.id)}">Reschedule</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete" data-id="${core.escapeHTML(update.id)}">Delete</button>
          </div>
        </article>
      `;
  }

  function renderCalendarView(updates) {
    if (!elements.calendarView) return;

    if (!updates.length) {
      elements.calendarView.innerHTML = '';
      return;
    }

    const grouped = new Map();

    updates
      .filter((update) => update.status === 'scheduled' || update.status === 'published')
      .forEach((update) => {
        const localDate = core.parseDateInTimezone(update.scheduled_at || update.published_at, update.timezone || core.DEFAULT_TIMEZONE);
        const key = localDate?.date || 'Unknown date';

        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(update);
      });

    const keys = Array.from(grouped.keys()).sort();
    if (!keys.length) {
      elements.calendarView.innerHTML = '<p>No scheduled or published updates to display in calendar view.</p>';
      return;
    }

    elements.calendarView.innerHTML = keys.map((key) => {
      const items = grouped.get(key) || [];
      return `
        <article class="calendar-day card">
          <h3>${core.escapeHTML(key)}</h3>
          <ul class="calendar-items">
            ${items.map((update) => {
              const local = core.parseDateInTimezone(update.scheduled_at || update.published_at, update.timezone || core.DEFAULT_TIMEZONE);
              return `
                <li>
                  <span>${core.escapeHTML(local?.time || '--:--')}</span>
                  <strong>${core.escapeHTML(update.title || 'Untitled update')}</strong>
                  <em>${core.escapeHTML(update.status || 'draft')}</em>
                </li>
              `;
            }).join('')}
          </ul>
        </article>
      `;
    }).join('');
  }

  async function onUpdateAction(button) {
    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    if (!id || state.actionInProgress) return;

    const update = state.allUpdates.find((item) => String(item.id) === String(id));
    if (!update) return;

    state.actionInProgress = true;
    button.disabled = true;

    try {
      if (action === 'edit') {
        loadUpdateToForm(update);
        setStatusMessage('Loaded update into form for editing.', 'success');
        return;
      }

      if (action === 'cancel') {
        if (!window.confirm('Cancel this update?')) return;
        await core.cancelUpdate(id, 'Cancelled by admin from scheduler UI');
        setStatusMessage('Update cancelled.', 'success');
      }

      if (action === 'publish') {
        if (!window.confirm('Publish this update now?')) return;
        await core.publishUpdate(id);
        setStatusMessage('Update published.', 'success');
      }

      if (action === 'reschedule') {
        const nextDate = window.prompt('Enter new scheduled date (YYYY-MM-DD):');
        const nextTime = window.prompt('Enter new scheduled time (HH:MM):');
        const timezone = document.getElementById('timezone')?.value || core.DEFAULT_TIMEZONE;

        const iso = core.composeIsoFromDateTime(nextDate, nextTime, timezone);
        if (!iso) {
          setStatusMessage('Reschedule failed: invalid date/time.', 'error');
          return;
        }

        await core.rescheduleUpdate(id, {
          scheduled_at: iso,
          timezone,
          status: 'scheduled'
        });

        setStatusMessage('Update rescheduled.', 'success');
      }

      if (action === 'delete') {
        if (!window.confirm('Delete this update? This cannot be undone.')) return;
        await core.deleteUpdate(id);
        setStatusMessage('Update deleted.', 'success');
      }

      await fetchAndRenderUpdates();
    } catch (error) {
      setStatusMessage(error.message || 'Action failed.', 'error');
    } finally {
      state.actionInProgress = false;
      button.disabled = false;
    }
  }

  function loadUpdateToForm(update) {
    state.editingId = update.id;

    const local = core.parseDateInTimezone(update.scheduled_at, update.timezone || core.DEFAULT_TIMEZONE);
    const localExpires = core.parseDateInTimezone(update.expires_at, update.timezone || core.DEFAULT_TIMEZONE);

    setInputValue('update-title', update.title);
    setInputValue('short-description', update.description);
    setInputValue('full-content', update.content);
    setInputValue('update-type', update.type);
    setInputValue('image-url', update.image_url);
    setInputValue('project-link', update.project_url);
    setInputValue('button-text', update.button_text);
    setInputValue('button-url', update.button_url);
    setInputValue('scheduled-date', local?.date || '');
    setInputValue('scheduled-time', local?.time || '');
    setInputValue('timezone', update.timezone || core.DEFAULT_TIMEZONE);
    setInputValue('expiration-date', localExpires?.date || '');
    setInputValue('expiration-time', localExpires?.time || '00:00');
    setInputValue('status', update.status || 'draft');

    const auto = document.getElementById('publish-automatically');
    if (auto) auto.checked = Boolean(update.publish_automatically);

    const submitButton = elements.schedulerForm?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = 'Save Update';

    setFormMessage(`Editing update #${update.id}`, 'success');
  }

  function clearValidationErrors() {
    document.querySelectorAll('.field-error').forEach((el) => {
      el.textContent = '';
    });
  }

  function setValidationError(fieldId, message) {
    const el = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (el) el.textContent = message;
  }

  async function onSchedulerSubmit(event) {
    event.preventDefault();
    clearValidationErrors();

    const payload = collectFormData();
    const validation = core.validateUpdatePayload(payload, new Date());

    if (!validation.valid) {
      Object.keys(validation.errors).forEach((key) => {
        setValidationError(key.replace('_', '-'), validation.errors[key]);
      });
      setFormMessage('Please fix the validation errors before saving.', 'error');
      return;
    }

    const button = elements.schedulerForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = state.editingId ? 'Saving Changes...' : 'Creating Update...';

    try {
      if (state.editingId) {
        await core.editUpdate(state.editingId, validation.normalized);
        setFormMessage('Update edited successfully.', 'success');
      } else {
        await core.createUpdate(validation.normalized);
        setFormMessage('Update created successfully.', 'success');
      }

      resetSchedulerForm();
      await fetchAndRenderUpdates();
    } catch (error) {
      const message = error.message || 'Database error while saving update.';
      setFormMessage(message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = state.editingId ? 'Save Update' : 'Create Update';
    }
  }

  function collectFormData() {
    return {
      title: document.getElementById('update-title')?.value || '',
      description: document.getElementById('short-description')?.value || '',
      content: document.getElementById('full-content')?.value || '',
      type: document.getElementById('update-type')?.value || '',
      image_url: document.getElementById('image-url')?.value || '',
      project_url: document.getElementById('project-link')?.value || '',
      button_text: document.getElementById('button-text')?.value || '',
      button_url: document.getElementById('button-url')?.value || '',
      scheduled_date: document.getElementById('scheduled-date')?.value || '',
      scheduled_time: document.getElementById('scheduled-time')?.value || '',
      timezone: document.getElementById('timezone')?.value || core.DEFAULT_TIMEZONE,
      publish_automatically: Boolean(document.getElementById('publish-automatically')?.checked),
      expires_date: document.getElementById('expiration-date')?.value || '',
      expires_time: document.getElementById('expiration-time')?.value || '00:00',
      status: document.getElementById('status')?.value || 'draft'
    };
  }

  function resetSchedulerForm() {
    state.editingId = null;
    elements.schedulerForm?.reset();
    setInputValue('timezone', core.DEFAULT_TIMEZONE);
    setInputValue('status', 'draft');
    const submitButton = elements.schedulerForm?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = 'Create Update';
    clearValidationErrors();
    setFormMessage('');
  }

  function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value || '';
  }

  function setView(viewName) {
    state.activeView = viewName === 'calendar' ? 'calendar' : 'list';
    elements.viewSwitchButtons.forEach((button) => {
      const isActive = button.getAttribute('data-view') === state.activeView;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    renderCurrentView();
  }

  function setUiState(mode, errorMessage = '') {
    if (elements.loadingState) elements.loadingState.hidden = mode !== 'loading';
    if (elements.errorState) {
      elements.errorState.hidden = mode !== 'error';
      elements.errorState.textContent = errorMessage;
    }
    if (elements.listView) elements.listView.hidden = mode === 'loading' || mode === 'error' || state.activeView !== 'list';
    if (elements.calendarView) elements.calendarView.hidden = mode === 'loading' || mode === 'error' || state.activeView !== 'calendar';
  }

  function setFormMessage(text = '', type = '') {
    if (!elements.formMessage) return;
    elements.formMessage.textContent = text;
    elements.formMessage.className = `message ${type || ''}`.trim();
  }

  function setStatusMessage(text = '', type = '') {
    if (!elements.statusMessage) return;
    elements.statusMessage.textContent = text;
    elements.statusMessage.className = `message ${type || ''}`.trim();
  }

  function setLoginMessage(text = '') {
    if (!elements.loginMessage) return;
    elements.loginMessage.textContent = text;
  }

  function showLogin() {
    if (elements.loginSection) elements.loginSection.hidden = false;
    if (elements.adminSection) elements.adminSection.hidden = true;
  }

  function showAdmin() {
    if (elements.loginSection) elements.loginSection.hidden = true;
    if (elements.adminSection) elements.adminSection.hidden = false;
  }
})();
