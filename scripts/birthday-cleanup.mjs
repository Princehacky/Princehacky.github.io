import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, 'birthday', 'config.json');

const readConfig = () => {
  if (!fs.existsSync(configPath)) {
    throw new Error('birthday/config.json not found. Cleanup aborted safely.');
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed.birthdayConfiguration || !parsed.event || !parsed.cleanup) {
    throw new Error('Missing birthdayConfiguration/event/cleanup sections in birthday/config.json. Cleanup aborted safely.');
  }

  return parsed;
};

const parseIstToUtcMs = (datePart, timePart) => {
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(datePart || '');
  const timeOk = /^\d{2}:\d{2}$/.test(timePart || '');
  if (!dateOk || !timeOk) return null;

  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);

  if ([y, m, d, hh, mm].some(Number.isNaN)) return null;
  return Date.UTC(y, m - 1, d, hh, mm - 330, 0, 0);
};

const config = readConfig();
const expiryMs = parseIstToUtcMs(
  config.birthdayConfiguration.EXPIRY_DATE,
  config.birthdayConfiguration.EXPIRY_TIME
);

if (!Number.isFinite(expiryMs)) {
  console.log('Expiry date/time not configured with valid values; no cleanup changes applied.');
  process.exit(0);
}

const nowMs = Date.now();
if (nowMs < expiryMs) {
  console.log('Expiry time has not passed; no cleanup needed yet.');
  process.exit(0);
}

let changed = false;

if (config.event.homepagePromoEnabledDuringEvent !== false) {
  config.event.homepagePromoEnabledDuringEvent = false;
  changed = true;
}

if (config.event.forcePhase !== 'archive') {
  config.event.forcePhase = 'archive';
  changed = true;
}

if (config.cleanup.cleanupCompleted !== true) {
  config.cleanup.cleanupCompleted = true;
  config.cleanup.cleanupCompletedAt = new Date(nowMs).toISOString();
  changed = true;
}

if (!changed) {
  console.log('Cleanup already applied.');
  process.exit(0);
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log('Birthday cleanup update prepared in birthday/config.json');
