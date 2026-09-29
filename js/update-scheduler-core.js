(() => {
  'use strict';

  const DEFAULT_TIMEZONE = 'Asia/Kolkata';

  const TIMEZONES = [
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offsetMinutes: 330 },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offsetMinutes: 0 },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offsetMinutes: 240 },
    { value: 'Europe/London', label: 'British Time (UK)', offsetMinutes: 0 },
    { value: 'America/New_York', label: 'Eastern Time (US)', offsetMinutes: -240 }
  ];

  const UPDATE_TYPES = [
    'Site Announcement',
    'New Project',
    'Project Update',
    'Wiki Update',
    'Game Update',
    'Community Update',
    'Maintenance',
    'Custom'
  ];

  const UPDATE_STATUSES = ['draft', 'scheduled', 'published', 'cancelled', 'failed'];

  class DatabaseAdapterNotConfiguredError extends Error {
    constructor() {
      super('Database adapter is not configured. Connect scheduler database methods before using this action.');
      this.name = 'DatabaseAdapterNotConfiguredError';
    }
  }

  class UpdatesAdapter {
    async loadUpdates() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async createUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async editUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async deleteUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async cancelUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async publishUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }

    async rescheduleUpdate() {
      throw new DatabaseAdapterNotConfiguredError();
    }
  }

  class UpdateSchedulerRepository {
    constructor(adapter = new UpdatesAdapter()) {
      this.adapter = adapter;
    }

    setAdapter(adapter) {
      this.adapter = adapter || new UpdatesAdapter();
    }

    async loadUpdates() {
      return this.adapter.loadUpdates();
    }

    async createUpdate(payload) {
      return this.adapter.createUpdate(payload);
    }

    async editUpdate(id, payload) {
      return this.adapter.editUpdate(id, payload);
    }

    async deleteUpdate(id) {
      return this.adapter.deleteUpdate(id);
    }

    async cancelUpdate(id, reason) {
      return this.adapter.cancelUpdate(id, reason);
    }

    async publishUpdate(id) {
      return this.adapter.publishUpdate(id);
    }

    async rescheduleUpdate(id, payload) {
      return this.adapter.rescheduleUpdate(id, payload);
    }
  }

  const updatesRepository = new UpdateSchedulerRepository();

  function normalizeStatus(value) {
    const status = String(value || 'draft').trim().toLowerCase();
    return UPDATE_STATUSES.includes(status) ? status : 'draft';
  }

  function getTimezoneOffsetMinutes(timezone) {
    const entry = TIMEZONES.find((item) => item.value === timezone);
    return entry ? entry.offsetMinutes : 330;
  }

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value == null ? '' : value);
    return div.innerHTML;
  }

  function toInteger(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
  }

  function composeIsoFromDateTime(dateValue, timeValue, timezone) {
    if (!dateValue || !timeValue) {
      return null;
    }

    const parts = String(dateValue).split('-').map(toInteger);
    const timeParts = String(timeValue).split(':').map(toInteger);

    if (parts.length !== 3 || timeParts.length < 2) {
      return null;
    }

    const [year, month, day] = parts;
    const [hours, minutes] = timeParts;

    if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - (getTimezoneOffsetMinutes(timezone) * 60000);
    const iso = new Date(utcMs).toISOString();
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }

  function parseDateInTimezone(isoValue, timezone) {
    if (!isoValue) return null;
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return null;

    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(date);

    const map = {};
    formatted.forEach((part) => {
      if (part.type !== 'literal') map[part.type] = part.value;
    });

    if (!map.year || !map.month || !map.day || !map.hour || !map.minute) {
      return null;
    }

    return {
      date: `${map.year}-${map.month}-${map.day}`,
      time: `${map.hour}:${map.minute}`,
      dateTime: `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`
    };
  }

  function formatDateTimeInTimezone(isoValue, timezone) {
    if (!isoValue) return 'Not set';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  function getCountdownParts(scheduledAt) {
    const targetMs = Date.parse(scheduledAt || '');
    if (Number.isNaN(targetMs)) return null;

    const nowMs = Date.now();
    const remaining = targetMs - nowMs;
    if (remaining <= 0) return null;

    const totalMinutes = Math.floor(remaining / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
  }

  function formatCountdown(scheduledAt) {
    const countdown = getCountdownParts(scheduledAt);
    if (!countdown) return '';

    const segments = [];
    if (countdown.days > 0) segments.push(`${countdown.days} day${countdown.days === 1 ? '' : 's'}`);
    if (countdown.hours > 0 || countdown.days > 0) segments.push(`${countdown.hours} hour${countdown.hours === 1 ? '' : 's'}`);
    segments.push(`${countdown.minutes} minute${countdown.minutes === 1 ? '' : 's'}`);

    return `${segments.join(' ')} remaining`;
  }

  function updateMatchesSearch(update, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;

    const fields = [
      update.title,
      update.description,
      update.content,
      update.type,
      update.status
    ];

    return fields.some((field) => String(field || '').toLowerCase().includes(q));
  }

  function filterUpdates(updates, criteria = {}) {
    const status = criteria.status ? String(criteria.status).toLowerCase() : 'all';
    const type = criteria.type ? String(criteria.type) : 'all';
    const query = criteria.query || '';

    return (Array.isArray(updates) ? updates : [])
      .filter((update) => status === 'all' || String(update.status || '').toLowerCase() === status)
      .filter((update) => type === 'all' || update.type === type)
      .filter((update) => updateMatchesSearch(update, query));
  }

  function searchUpdates(updates, query) {
    return filterUpdates(updates, { query });
  }

  function sortByNewestScheduledOrPublished(updates) {
    const list = Array.isArray(updates) ? [...updates] : [];
    return list.sort((left, right) => {
      const leftValue = Date.parse(left.published_at || left.scheduled_at || left.created_at || '');
      const rightValue = Date.parse(right.published_at || right.scheduled_at || right.created_at || '');
      return (Number.isNaN(rightValue) ? 0 : rightValue) - (Number.isNaN(leftValue) ? 0 : leftValue);
    });
  }

  function validateUpdatePayload(payload, nowDate = new Date()) {
    const errors = {};

    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const content = String(payload.content || '').trim();
    const type = String(payload.type || '').trim();
    const status = normalizeStatus(payload.status);
    const timezone = payload.timezone || DEFAULT_TIMEZONE;
    const dateValue = String(payload.scheduled_date || '').trim();
    const timeValue = String(payload.scheduled_time || '').trim();
    const publishAutomatically = Boolean(payload.publish_automatically);

    if (!title) errors.title = 'Title is required.';
    if (!description) errors.description = 'Short description is required.';
    if (!content) errors.content = 'Full update content is required.';
    if (!UPDATE_TYPES.includes(type)) errors.type = 'Select a valid update type.';

    if (!dateValue) {
      errors.scheduled_date = 'Scheduled date is required.';
    }

    if (!timeValue) {
      errors.scheduled_time = 'Scheduled time is required.';
    }

    const scheduledAt = composeIsoFromDateTime(dateValue, timeValue, timezone);
    if (!scheduledAt) {
      if (!errors.scheduled_date) errors.scheduled_date = 'Enter a valid scheduled date.';
      if (!errors.scheduled_time) errors.scheduled_time = 'Enter a valid scheduled time.';
    }

    if (scheduledAt) {
      const scheduledMs = Date.parse(scheduledAt);
      if (Number.isNaN(scheduledMs)) {
        errors.scheduled_time = 'Scheduled date/time is invalid.';
      }

      if ((status === 'scheduled' || publishAutomatically) && scheduledMs <= nowDate.getTime()) {
        errors.scheduled_time = 'Scheduled date/time must be in the future for scheduled publishing.';
      }
    }

    const expiresAt = payload.expires_date
      ? composeIsoFromDateTime(payload.expires_date, payload.expires_time || '00:00', timezone)
      : null;

    if (payload.expires_date && !expiresAt) {
      errors.expires_date = 'Expiration date is invalid.';
    }

    if (scheduledAt && expiresAt && Date.parse(expiresAt) <= Date.parse(scheduledAt)) {
      errors.expires_date = 'Expiration must be after scheduled date/time.';
    }

    if (payload.button_text && !payload.button_url) {
      errors.button_url = 'Button URL is required when button text is provided.';
    }

    if (payload.button_url && !payload.button_text) {
      errors.button_text = 'Button text is required when button URL is provided.';
    }

    const hasErrors = Object.keys(errors).length > 0;
    return {
      valid: !hasErrors,
      errors,
      normalized: {
        id: payload.id || null,
        title,
        description,
        content,
        type,
        image_url: String(payload.image_url || '').trim() || null,
        project_url: String(payload.project_url || '').trim() || null,
        button_text: String(payload.button_text || '').trim() || null,
        button_url: String(payload.button_url || '').trim() || null,
        scheduled_at: scheduledAt,
        timezone,
        expires_at: expiresAt,
        status,
        publish_automatically: publishAutomatically,
        created_by: payload.created_by || null,
        created_at: payload.created_at || null,
        updated_at: payload.updated_at || null,
        published_at: payload.published_at || null,
        cancelled_at: payload.cancelled_at || null,
        failure_reason: String(payload.failure_reason || '').trim() || null
      }
    };
  }

  async function createUpdate(payload) {
    return updatesRepository.createUpdate(payload);
  }

  async function editUpdate(id, payload) {
    return updatesRepository.editUpdate(id, payload);
  }

  async function deleteUpdate(id) {
    return updatesRepository.deleteUpdate(id);
  }

  async function cancelUpdate(id, reason) {
    return updatesRepository.cancelUpdate(id, reason);
  }

  async function publishUpdate(id) {
    return updatesRepository.publishUpdate(id);
  }

  async function rescheduleUpdate(id, payload) {
    return updatesRepository.rescheduleUpdate(id, payload);
  }

  async function loadUpdates() {
    return updatesRepository.loadUpdates();
  }

  window.UpdateSchedulerCore = {
    DEFAULT_TIMEZONE,
    TIMEZONES,
    UPDATE_TYPES,
    UPDATE_STATUSES,
    DatabaseAdapterNotConfiguredError,
    UpdateSchedulerRepository,
    updatesRepository,
    composeIsoFromDateTime,
    parseDateInTimezone,
    formatDateTimeInTimezone,
    formatCountdown,
    filterUpdates,
    searchUpdates,
    sortByNewestScheduledOrPublished,
    validateUpdatePayload,
    normalizeStatus,
    escapeHTML,
    createUpdate,
    editUpdate,
    deleteUpdate,
    cancelUpdate,
    publishUpdate,
    rescheduleUpdate,
    loadUpdates
  };

  window.createUpdate = createUpdate;
  window.editUpdate = editUpdate;
  window.deleteUpdate = deleteUpdate;
  window.cancelUpdate = cancelUpdate;
  window.publishUpdate = publishUpdate;
  window.rescheduleUpdate = rescheduleUpdate;
  window.loadUpdates = loadUpdates;
  window.filterUpdates = filterUpdates;
  window.searchUpdates = searchUpdates;
})();
