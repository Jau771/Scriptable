// Holiday Countdown for Scriptable
// Paste this file into Scriptable or import it from a raw GitHub URL.

const HOLIDAYS = {
  '01-01': { name: '元旦', type: 'holiday' },
  '02-14': { name: '情人节', type: 'holiday' },
  '03-08': { name: '妇女节', type: 'holiday' },
  '04-01': { name: '愚人节', type: 'holiday' },
  '05-01': { name: '劳动节', type: 'holiday' },
  '05-04': { name: '青年节', type: 'holiday' },
  '06-01': { name: '儿童节', type: 'holiday' },
  '07-01': { name: '建党节', type: 'holiday' },
  '08-01': { name: '建军节', type: 'holiday' },
  '09-10': { name: '教师节', type: 'holiday' },
  '10-01': { name: '国庆节', type: 'holiday' },
  '11-11': { name: '光棍节', type: 'holiday' },
  '12-25': { name: '圣诞节', type: 'holiday' },
  '12-31': { name: '跨年夜', type: 'holiday' },
};

const LUNAR_HOLIDAYS = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕节',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
  '12-30': '除夕',
};

const FLOATING_HOLIDAYS = {
  mother: { name: '母亲节', calc: (year) => getNthWeekday(year, 5, 0, 2) },
  father: { name: '父亲节', calc: (year) => getNthWeekday(year, 6, 0, 3) },
};

const SOLAR_TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

const SOLAR_TERM_MONTHS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12];

const C_2000 = [
  5.4055, 20.12, 3.87, 18.73, 3.695, 18.367,
  4.241, 20.888, 5.5133, 21.208, 6.285, 21.732,
  7.214, 23.085, 7.9013, 23.839, 8.784, 23.969,
  9.767, 24.475, 10.84, 26.613, 11.303, 27.185,
];

const C_1900 = [
  6.3811, 20.84, 4.6295, 19.51, 4.1867, 18.944,
  5.4159, 20.888, 6.3811, 21.923, 7.214, 22.555,
  7.9013, 23.085, 8.784, 23.486, 9.767, 24.124,
  10.423, 24.646, 11.303, 27.03, 11.303, 27.185,
];

const TERM_CORRECTIONS = {
  0: { 2019: -1 },
  2: { 2084: 1 },
  4: { 1911: 1 },
  6: { 1925: 1, 2032: -1 },
  8: { 1911: 1 },
  9: { 2008: 1 },
  10: { 2016: 1 },
  18: { 2089: 1 },
  22: { 1954: 1 },
};

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14aa6, 0x02b60, 0x09570, 0x04976, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54,
  0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x16ea5, 0x05ad0, 0x02b60,
  0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0,
  0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x145ad,
  0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,
  0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250,
];

const CONFIG = {
  maxRows: 6,
  gap: 8,
  cornerRadius: 11,
  padding: 16,
  maxNameLength: 4,
  urgentDays: 3,
  warningDays: 7,
};

function makeColors() {
  return {
    bg: Color.dynamic(new Color('#EAF3F8', 0.58), new Color('#142235', 0.58)),
    border: Color.dynamic(new Color('#FFFFFF', 0.45), new Color('#FFFFFF', 0.35)),
    urgent: Color.dynamic(new Color('#F87171'), new Color('#FF8A8A')),
    warning: Color.dynamic(new Color('#F59E0B'), new Color('#FFB84D')),
    normal: Color.dynamic(new Color('#FFFFFF', 0.9), new Color('#F8FAFC', 0.92)),
  };
}

function getSolarTermDate(year, termIndex) {
  const c = year >= 2000 ? C_2000 : C_1900;
  const y = year % 100;
  let date = Math.floor(y * 0.2422 + c[termIndex]) - Math.floor((y - 1) / 4);
  if (TERM_CORRECTIONS[termIndex]?.[year]) date += TERM_CORRECTIONS[termIndex][year];
  return date;
}

function leapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function leapDays(year) {
  if (!leapMonth(year)) return 0;
  return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
}

function monthDays(year, month) {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function lunarYearDays(year) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (LUNAR_INFO[year - 1900] & i) sum += 1;
  }
  return sum + leapDays(year);
}

function solarToLunar(year, month, day) {
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(year, month - 1, day);
  let offset = Math.floor((targetDate - baseDate) / 86400000);
  let lunarYear = 1900;
  let temp = 0;

  for (let i = 1900; i < 2100 && offset > 0; i += 1) {
    temp = lunarYearDays(i);
    offset -= temp;
    lunarYear = i;
  }

  if (offset < 0) {
    offset += temp;
    lunarYear -= 1;
  }

  const leap = leapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;

  for (let i = 1; i < 13 && offset > 0; i += 1) {
    if (leap > 0 && i === leap + 1 && !isLeap) {
      i -= 1;
      isLeap = true;
      temp = leapDays(lunarYear);
    } else {
      temp = monthDays(lunarYear, i);
    }

    if (isLeap && i === leap + 1) isLeap = false;
    offset -= temp;

    if (offset < 0) {
      offset += temp;
      i += 1;
      lunarMonth = i - 1;
      break;
    }
    lunarMonth = i;
  }

  return {
    year: lunarYear,
    month: lunarMonth,
    day: offset + 1,
    isLeap,
  };
}

function getNthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  const diff = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + diff + (n - 1) * 7);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysDiff(from, to) {
  return Math.floor((startOfDay(to) - startOfDay(from)) / 86400000);
}

function findSolarDateByLunar(targetMonth, targetDay, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 2, 10);

  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const lunar = solarToLunar(day.getFullYear(), day.getMonth() + 1, day.getDate());
    if (lunar.month === targetMonth && lunar.day === targetDay && !lunar.isLeap) {
      return new Date(day.getFullYear(), day.getMonth(), day.getDate());
    }
  }
  return null;
}

function getCountdowns(now = new Date()) {
  const today = startOfDay(now);
  const year = today.getFullYear();
  const results = [];

  for (const [key, holiday] of Object.entries(HOLIDAYS)) {
    const [month, day] = key.split('-').map(Number);
    let target = new Date(year, month - 1, day);
    if (target < today) target = new Date(year + 1, month - 1, day);
    results.push({ name: holiday.name, days: daysDiff(today, target), type: holiday.type });
  }

  for (const holiday of Object.values(FLOATING_HOLIDAYS)) {
    let target = holiday.calc(year);
    if (target < today) target = holiday.calc(year + 1);
    results.push({ name: holiday.name, days: daysDiff(today, target), type: 'floating' });
  }

  for (let i = 0; i < SOLAR_TERM_NAMES.length; i += 1) {
    const month = SOLAR_TERM_MONTHS[i];
    const day = getSolarTermDate(year, i);
    let target = new Date(year, month - 1, day);
    if (target < today) {
      const nextDay = getSolarTermDate(year + 1, i);
      target = new Date(year + 1, month - 1, nextDay);
    }
    results.push({ name: SOLAR_TERM_NAMES[i], days: daysDiff(today, target), type: 'term' });
  }

  for (const [key, name] of Object.entries(LUNAR_HOLIDAYS)) {
    const [month, day] = key.split('-').map(Number);
    const isNewYearEve = key === '12-30';
    let target = findSolarDateByLunar(month, day, year);
    if (isNewYearEve && !target) target = findSolarDateByLunar(12, 29, year);

    if (!target || target < today) {
      target = findSolarDateByLunar(month, day, year + 1);
      if (isNewYearEve && !target) target = findSolarDateByLunar(12, 29, year + 1);
    }

    if (target) results.push({ name, days: daysDiff(today, target), type: 'lunar' });
  }

  results.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name, 'zh-Hans-CN'));

  const seen = new Set();
  return results.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function truncateName(name, limit = CONFIG.maxNameLength) {
  return name.length <= limit ? name : `${name.slice(0, limit)}…`;
}

function normalizeFamily(family) {
  if (family === 'systemSmall' || family === 'small') return 'small';
  if (family === 'systemLarge' || family === 'large') return 'large';
  return 'medium';
}

function getLayout(family) {
  const normalized = normalizeFamily(family);
  if (normalized === 'small') return { family: normalized, columns: 3, fontSize: 11, maxRows: 6, padding: 14 };
  if (normalized === 'large') return { family: normalized, columns: 5, fontSize: 13, maxRows: 9, padding: 18 };
  return { family: normalized, columns: 5, fontSize: 12, maxRows: 6, padding: 16 };
}

function filterItems(items, options = {}) {
  let filtered = items;
  if (options.showHolidays === false) filtered = filtered.filter((item) => item.type !== 'holiday');
  if (options.showTerms === false) filtered = filtered.filter((item) => item.type !== 'term');
  if (options.showTraditional === false) {
    filtered = filtered.filter((item) => item.type !== 'lunar' && item.type !== 'floating');
  }
  return filtered;
}

function getWidgetPlan({ family = 'medium', now = new Date(), options = {} } = {}) {
  const layout = getLayout(family);
  const items = filterItems(getCountdowns(now), options);
  const limit = layout.columns * layout.maxRows;
  const visibleItems = items.slice(0, limit).map((item) => ({
    ...item,
    label: `${truncateName(item.name)} ${item.days === 0 ? '今天' : `${item.days}天`}`,
  }));

  return {
    ...layout,
    visibleItems,
  };
}

function parseOptions() {
  const raw = typeof args !== 'undefined' ? String(args.widgetParameter || '') : '';
  const parts = raw.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean);
  return {
    showHolidays: !parts.includes('no-holiday'),
    showTerms: !parts.includes('no-term'),
    showTraditional: !parts.includes('no-traditional'),
  };
}

function colorForDays(days, colors) {
  if (days === 0 || days <= CONFIG.urgentDays) return colors.urgent;
  if (days <= CONFIG.warningDays) return colors.warning;
  return colors.normal;
}

function addCapsule(row, item, fontSize, colors) {
  const capsule = row.addStack();
  capsule.layoutHorizontally();
  capsule.centerAlignContent();
  capsule.cornerRadius = CONFIG.cornerRadius;
  capsule.borderWidth = 1;
  capsule.borderColor = colors.border;
  capsule.backgroundColor = new Color('#FFFFFF', 0.12);
  capsule.setPadding(5, 8, 5, 8);

  const text = capsule.addText(item.label);
  text.font = Font.mediumSystemFont(fontSize);
  text.textColor = colorForDays(item.days, colors);
  text.lineLimit = 1;
  text.minimumScaleFactor = 0.72;
  text.centerAlignText();
}

function createWidget({ family, now = new Date(), options = parseOptions() } = {}) {
  const widget = new ListWidget();
  const plan = getWidgetPlan({ family, now, options });
  const colors = makeColors();
  widget.setPadding(plan.padding, plan.padding, plan.padding, plan.padding);
  widget.backgroundColor = colors.bg;
  widget.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);

  for (let i = 0; i < plan.visibleItems.length; i += plan.columns) {
    const row = widget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.spacing = CONFIG.gap;

    const chunk = plan.visibleItems.slice(i, i + plan.columns);
    for (const item of chunk) {
      addCapsule(row, item, plan.fontSize, colors);
      if (item !== chunk[chunk.length - 1]) row.addSpacer(CONFIG.gap);
    }

    if (i + plan.columns < plan.visibleItems.length) widget.addSpacer(8);
  }

  return widget;
}

function runInScriptable() {
  const family = typeof config !== 'undefined' ? config.widgetFamily : 'medium';
  const widget = createWidget({ family });

  if (typeof config !== 'undefined' && config.runsInWidget) {
    Script.setWidget(widget);
    Script.complete();
    return;
  } else if (typeof widget.presentMedium === 'function') {
    Promise.resolve(widget.presentMedium())
      .then(() => Script.complete())
      .catch((error) => {
        console.error(error);
        Script.complete();
      });
    return;
  }

  if (typeof Script !== 'undefined') Script.complete();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    solarToLunar,
    getCountdowns,
    getWidgetPlan,
    createWidget,
  };
}

if (typeof Script !== 'undefined' && typeof config !== 'undefined') {
  runInScriptable();
}
