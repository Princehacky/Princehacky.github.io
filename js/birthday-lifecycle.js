(() => {
  const CONFIG_PATH = '/birthday/config.json';
  const IST_OFFSET_MINUTES = 330;

  let contextPromise;

  const toUtcFromIst = (datePart, timePart) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart || '')) return null;
    if (!/^\d{2}:\d{2}$/.test(timePart || '')) return null;

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    if (
      Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
      Number.isNaN(hour) || Number.isNaN(minute) ||
      month < 1 || month > 12 || day < 1 || day > 31 ||
      hour < 0 || hour > 23 || minute < 0 || minute > 59
    ) {
      return null;
    }

    return Date.UTC(year, month - 1, day, hour, minute - IST_OFFSET_MINUTES, 0, 0);
  };

  const formatDateInTimeZone = (ms, timezone) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone
    }).format(new Date(ms));
  };

  const formatCountdown = (remainingMs) => {
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return '00d 00h 00m 00s';

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const normalizeEventConfig = (config) => {
    const birthdayConfiguration = config?.birthdayConfiguration || {};
    const event = config?.event || {};

    return {
      timezone: birthdayConfiguration.TIMEZONE || 'Asia/Kolkata',
      launchDate: birthdayConfiguration.BIRTHDAY_DATE,
      launchTime: birthdayConfiguration.BIRTHDAY_TIME || '00:00',
      expiryDate: birthdayConfiguration.EXPIRY_DATE,
      expiryTime: birthdayConfiguration.EXPIRY_TIME || '23:59',
      age: birthdayConfiguration.AGE,
      archiveBehavior: event.archiveBehavior || 'show-archive',
      homepagePromoEnabledDuringEvent: event.homepagePromoEnabledDuringEvent !== false,
      forcePhase: event.forcePhase || 'auto'
    };
  };

  const computePhase = (config, nowMs) => {
    const event = normalizeEventConfig(config);
    const launchMs = toUtcFromIst(event.launchDate, event.launchTime);
    const expiryMs = toUtcFromIst(event.expiryDate, event.expiryTime);
    const forced = event.forcePhase;

    if (!Number.isFinite(launchMs) || !Number.isFinite(expiryMs) || launchMs > expiryMs) {
      return {
        phase: 'setup-needed',
        timezone: event.timezone,
        launchMs,
        expiryMs,
        statusText: 'Setup needed',
        isLive: false,
        isComingSoon: false,
        isArchive: false,
        countdownTargetMs: null,
        countdownLabel: 'Update /birthday/config.json with valid launch and expiry values.'
      };
    }

    if (forced === 'coming-soon' || forced === 'live' || forced === 'archive') {
      const targetMs = forced === 'coming-soon' ? launchMs : forced === 'live' ? expiryMs : null;
      return {
        phase: forced,
        timezone: event.timezone,
        launchMs,
        expiryMs,
        statusText: forced === 'coming-soon' ? 'Coming Soon' : forced === 'live' ? 'Birthday Mode Live' : 'Birthday Archive',
        isLive: forced === 'live',
        isComingSoon: forced === 'coming-soon',
        isArchive: forced === 'archive',
        countdownTargetMs: targetMs,
        countdownLabel: forced === 'coming-soon' ? 'Launch countdown' : forced === 'live' ? 'Event ends in' : 'Archive mode active'
      };
    }

    if (nowMs < launchMs) {
      return {
        phase: 'coming-soon',
        timezone: event.timezone,
        launchMs,
        expiryMs,
        statusText: 'Coming Soon',
        isLive: false,
        isComingSoon: true,
        isArchive: false,
        countdownTargetMs: launchMs,
        countdownLabel: 'Launch countdown'
      };
    }

    if (nowMs >= launchMs && nowMs <= expiryMs) {
      return {
        phase: 'live',
        timezone: event.timezone,
        launchMs,
        expiryMs,
        statusText: 'Birthday Mode Live',
        isLive: true,
        isComingSoon: false,
        isArchive: false,
        countdownTargetMs: expiryMs,
        countdownLabel: 'Event ends in'
      };
    }

    return {
      phase: 'archive',
      timezone: event.timezone,
      launchMs,
      expiryMs,
      statusText: 'Birthday Archive',
      isLive: false,
      isComingSoon: false,
      isArchive: true,
      countdownTargetMs: null,
      countdownLabel: 'Archive mode active'
    };
  };

  const getServerHeaderTime = (response) => {
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return null;
    const parsed = Date.parse(dateHeader);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getContext = async () => {
    if (!contextPromise) {
      contextPromise = (async () => {
        const configResponse = await fetch(CONFIG_PATH, { cache: 'no-store' });
        if (!configResponse.ok) {
          throw new Error(`Unable to load birthday config (${configResponse.status})`);
        }

        const config = await configResponse.json();
        const normalizedEvent = normalizeEventConfig(config);

        const serverNow = getServerHeaderTime(configResponse);
        const nowMs = Number.isFinite(serverNow) ? serverNow : Date.now();
        const nowSource = Number.isFinite(serverNow) ? 'server-header' : 'local-fallback';

        const timeline = computePhase(config, nowMs);

        return {
          config,
          eventConfig: normalizedEvent,
          nowMs,
          nowSource,
          ...timeline,
          formattedLaunch: Number.isFinite(timeline.launchMs) ? formatDateInTimeZone(timeline.launchMs, timeline.timezone) : 'Not configured',
          formattedExpiry: Number.isFinite(timeline.expiryMs) ? formatDateInTimeZone(timeline.expiryMs, timeline.timezone) : 'Not configured'
        };
      })();
    }

    return contextPromise;
  };

  window.PrinceBirthdayLifecycle = {
    getContext,
    formatCountdown,
    computePhase,
    toUtcFromIst,
    formatDateInTimeZone,
    normalizeEventConfig
  };
})();
