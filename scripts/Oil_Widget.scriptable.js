// Oil price widget for Scriptable.
// Paste this file into Scriptable or import it from a raw GitHub URL.

const DEFAULT_REGION = 'shandong/dezhou';
const CACHE_PREFIX = 'jau771_oil_widget_';
const CACHE_REFRESH_HOURS = 6;
const DEFAULT_PRICES = {
  p92: null,
  p95: null,
  p98: null,
  diesel: null,
};

const OIL_ITEMS = [
  { key: 'p92', label: '92 号', color: '#FFB347' },
  { key: 'p95', label: '95 号', color: '#FF8A5C' },
  { key: 'p98', label: '98 号', color: '#FF6B6B' },
  { key: 'diesel', label: '柴油', color: '#5CD67D' },
];

function normalizeRegionParam(value) {
  const raw = String(value || DEFAULT_REGION)
    .trim()
    .replace(/^https?:\/\/m\.qiyoujiage\.com\//i, '')
    .replace(/^\/+/, '')
    .replace(/\.shtml(?:\?.*)?$/i, '')
    .replace(/\/+$/g, '');

  return raw || DEFAULT_REGION;
}

function parseWidgetParameter(rawParam) {
  const raw = String(rawParam || '').trim();
  if (!raw) return { region: DEFAULT_REGION, showTrend: true };

  const result = {
    region: DEFAULT_REGION,
    showTrend: true,
  };

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.split('=');
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join('=').trim();

    if (value && (key === 'region' || key === 'city')) {
      result.region = normalizeRegionParam(value);
    } else if (value && (key === 'trend' || key === 'show_trend')) {
      result.showTrend = !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
    } else if (['trend=false', 'no-trend', 'notrend'].includes(part.toLowerCase())) {
      result.showTrend = false;
    } else if (!part.includes('=')) {
      result.region = normalizeRegionParam(part);
    }
  }

  return result;
}

function stripTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRegionName(html) {
  const h1Match = String(html).match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const titleMatch = String(html).match(/<title>([^_<]+)[^<]*<\/title>/i);
  const rawName = stripTags(h1Match?.[1] || titleMatch?.[1] || '');
  return rawName.replace(/(油价|实时|今日|最新|查询|价格)/g, '').trim();
}

function parsePriceValue(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parsePrices(html) {
  const prices = { ...DEFAULT_PRICES };
  const regPrice = /<dl>[\s\S]*?<dt>([\s\S]*?油)<\/dt>[\s\S]*?<dd>([\s\S]*?)<\/dd>[\s\S]*?<\/dl>/gi;
  let match = null;

  while ((match = regPrice.exec(html)) !== null) {
    const name = stripTags(match[1]);
    const value = parsePriceValue(stripTags(match[2]));
    if (value === null) continue;

    if (/92\s*号|92号|92/.test(name)) prices.p92 = value;
    else if (/95\s*号|95号|95/.test(name)) prices.p95 = value;
    else if (/98\s*号|98号|98/.test(name)) prices.p98 = value;
    else if (/0\s*号|0号|柴油/.test(name)) prices.diesel = value;
  }

  return prices;
}

function parseTrendInfo(html, { showTrend = true } = {}) {
  if (!showTrend) return '';

  const trendMatch = String(html).match(/<div[^>]*class=["'][^"']*tishi[^"']*["'][^>]*>[\s\S]*?<span>([^<]+)<\/span>\s*<br\/?>([\s\S]*?)<br\/?>/i);
  if (!trendMatch) return '';

  const dateText = stripTags(trendMatch[1])
    .replace(/^下次油价/, '')
    .replace(/^油价/, '')
    .trim();
  const detailText = stripTags(trendMatch[2]);
  const trend = /下调|下跌|下降/.test(detailText) ? '↓' : '↑';
  const literRange = detailText.match(/(\d+(?:\.\d+)?)\s*元\/升\s*-\s*(\d+(?:\.\d+)?)\s*元\/升/);
  const bracketRange = detailText.match(/\((\d+(?:\.\d+)?)\s*元\/升\s*-\s*(\d+(?:\.\d+)?)\s*元\/升\)/);
  const singleLiter = detailText.match(/(\d+(?:\.\d+)?)\s*元\/升/);
  const tonValues = detailText.match(/(\d+)\s*元(?:\/吨)?/g);

  let amount = '';
  const range = literRange || bracketRange;
  if (range) {
    amount = `${range[1]}-${range[2]}`;
  } else if (singleLiter) {
    amount = `${singleLiter[1]}元/L`;
  } else if (tonValues && tonValues.length >= 2) {
    const values = tonValues.map((item) => item.match(/(\d+)/)[1]);
    amount = `${values[0]}-${values[1]}元/吨`;
  } else if (tonValues && tonValues.length === 1) {
    amount = `${tonValues[0].match(/(\d+)/)[1]}元/吨`;
  }

  return `${dateText} ${trend} ${amount}`.replace(/\s+/g, ' ').trim();
}

function parseOilHtml(html, { showTrend = true } = {}) {
  return {
    regionName: parseRegionName(html),
    prices: parsePrices(html),
    trendInfo: parseTrendInfo(html, { showTrend }),
  };
}

function normalizeFamily(family) {
  if (family === 'systemSmall' || family === 'small') return 'small';
  if (family === 'systemLarge' || family === 'large') return 'large';
  return 'medium';
}

function formatTime(now = new Date()) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getOilLayout(family) {
  const normalized = normalizeFamily(family);
  if (normalized === 'small') {
    return {
      family: normalized,
      widgetPadding: 10,
      headerFont: 12,
      trendFont: 10,
      labelFont: 10,
      priceFont: 18,
      footerFont: 10,
      cardWidth: 58,
      cardHeight: 54,
      cardCornerRadius: 12,
      labelWidth: 40,
      labelHeight: 18,
      labelCornerRadius: 6,
      rowGap: 6,
      sectionGap: 8,
      priceColumns: 2,
    };
  }
  if (normalized === 'large') {
    return {
      family: normalized,
      widgetPadding: 16,
      headerFont: 14,
      trendFont: 12,
      labelFont: 12,
      priceFont: 26,
      footerFont: 12,
      cardWidth: 74,
      cardHeight: 68,
      cardCornerRadius: 12,
      labelWidth: 47,
      labelHeight: 22,
      labelCornerRadius: 7,
      rowGap: 8,
      sectionGap: 12,
      priceColumns: 4,
    };
  }
  return {
    family: normalized,
    widgetPadding: 12,
    headerFont: 13,
    trendFont: 12,
    labelFont: 11,
    priceFont: 24,
    footerFont: 12,
    cardWidth: 70,
    cardHeight: 62,
    cardCornerRadius: 12,
    labelWidth: 45,
    labelHeight: 21,
    labelCornerRadius: 7,
    rowGap: 8,
    sectionGap: 10,
    priceColumns: 4,
  };
}

function getOilWidgetPlan({ family = 'medium', data, now = new Date(), showTrend = true, errorMessage = '' } = {}) {
  const layout = getOilLayout(family);
  const prices = data?.prices || DEFAULT_PRICES;
  const rows = OIL_ITEMS
    .map((item) => ({
      ...item,
      price: prices[item.key],
      priceText: prices[item.key] === null || prices[item.key] === undefined ? '--' : Number(prices[item.key]).toFixed(2),
    }))
    .filter((item) => item.price !== null && item.price !== undefined);

  return {
    ...layout,
    title: data?.regionName ? `${data.regionName}实时油价` : '实时油价',
    trendInfo: showTrend ? (data?.trendInfo || '') : '',
    updatedText: `${formatTime(now)} 更新`,
    unitText: '元/升',
    rows,
    errorMessage,
  };
}

function makeColors() {
  return {
    background: Color.dynamic(new Color('#1C1C1E', 0.9), new Color('#1C1C1E', 0.9)),
    panel: Color.dynamic(new Color('#2C2C2E', 0.82), new Color('#2C2C2E', 0.82)),
    border: Color.dynamic(new Color('#FFFFFF', 0.09), new Color('#FFFFFF', 0.09)),
    primary: Color.dynamic(new Color('#FFFFFF'), new Color('#FFFFFF')),
    secondary: Color.dynamic(new Color('#F2F2F7', 0.9), new Color('#F2F2F7', 0.9)),
    tertiary: Color.dynamic(new Color('#D1D1D6', 0.75), new Color('#D1D1D6', 0.75)),
    warning: Color.dynamic(new Color('#FF6B6B'), new Color('#FF6B6B')),
  };
}

function addText(stack, text, { fontSize, color, bold = false, align = 'left', lineLimit = 1, minScale = 0.75 } = {}) {
  const node = stack.addText(text);
  node.font = bold ? Font.semiboldSystemFont(fontSize) : Font.mediumSystemFont(fontSize);
  node.textColor = color;
  node.lineLimit = lineLimit;
  node.minimumScaleFactor = minScale;
  if (align === 'center') node.centerAlignText();
  if (align === 'right') node.rightAlignText();
  return node;
}

function addHeader(widget, plan, colors) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const icon = row.addImage(SFSymbol.named('fuelpump.fill').image);
  icon.imageSize = new Size(13, 13);
  icon.tintColor = new Color('#FFB347');
  row.addSpacer(4);
  addText(row, plan.title, {
    fontSize: plan.headerFont,
    color: colors.secondary,
    bold: true,
    minScale: 0.7,
  });
  row.addSpacer();

  if (plan.errorMessage) {
    addText(row, plan.errorMessage, {
      fontSize: plan.trendFont,
      color: colors.warning,
      align: 'right',
      minScale: 0.65,
    });
  } else if (plan.trendInfo) {
    addText(row, plan.trendInfo, {
      fontSize: plan.trendFont,
      color: colors.primary,
      align: 'right',
      minScale: 0.68,
    });
  }
}

function addOilCard(row, item, plan, colors) {
  const card = row.addStack();
  card.layoutVertically();
  card.centerAlignContent();
  card.size = new Size(plan.cardWidth, plan.cardHeight);
  card.cornerRadius = plan.cardCornerRadius;
  card.backgroundColor = colors.panel;
  card.borderWidth = 0.5;
  card.borderColor = colors.border;
  card.setPadding(6, 4, 6, 4);

  const label = card.addStack();
  label.layoutHorizontally();
  label.centerAlignContent();
  label.size = new Size(plan.labelWidth, plan.labelHeight);
  label.cornerRadius = plan.labelCornerRadius;
  label.backgroundColor = new Color(item.color, 0.15);
  label.borderWidth = 0.5;
  label.borderColor = new Color(item.color, 0.34);
  addText(label, item.label, {
    fontSize: plan.labelFont,
    color: new Color(item.color),
    bold: true,
    align: 'center',
    minScale: 0.68,
  });

  card.addSpacer(2);
  addText(card, item.priceText, {
    fontSize: plan.priceFont,
    color: colors.primary,
    bold: true,
    align: 'center',
    minScale: 0.62,
  });
}

function addPrices(widget, plan, colors) {
  if (!plan.rows.length) {
    const empty = widget.addStack();
    empty.layoutVertically();
    empty.centerAlignContent();
    empty.addSpacer();
    addText(empty, plan.errorMessage || '暂无数据', {
      fontSize: plan.headerFont,
      color: colors.tertiary,
      align: 'center',
    });
    empty.addSpacer();
    return;
  }

  for (let i = 0; i < plan.rows.length; i += plan.priceColumns) {
    const row = widget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    const chunk = plan.rows.slice(i, i + plan.priceColumns);
    for (const item of chunk) {
      addOilCard(row, item, plan, colors);
      if (item !== chunk[chunk.length - 1]) row.addSpacer();
    }
    if (i + plan.priceColumns < plan.rows.length) widget.addSpacer(plan.rowGap);
  }
}

function addFooter(widget, plan, colors) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  addText(row, plan.updatedText, {
    fontSize: plan.footerFont,
    color: colors.tertiary,
    minScale: 0.75,
  });
  row.addSpacer();
  addText(row, plan.unitText, {
    fontSize: plan.footerFont,
    color: colors.tertiary,
    align: 'right',
    minScale: 0.75,
  });
}

async function fetchOilData(region, { showTrend = true } = {}) {
  const url = `http://m.qiyoujiage.com/${normalizeRegionParam(region)}.shtml`;
  const req = new Request(url);
  req.method = 'GET';
  req.timeoutInterval = 15;
  req.headers = {
    referer: 'http://m.qiyoujiage.com/',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  };

  const html = await req.loadString();
  const status = req.response?.statusCode || 200;
  if (status < 200 || status >= 400) throw new Error(`HTTP ${status}`);
  return parseOilHtml(html, { showTrend });
}

function getCacheKey(region) {
  return `${CACHE_PREFIX}${normalizeRegionParam(region).replace(/[^\w-]+/g, '_')}`;
}

function readCache(region) {
  if (typeof Keychain === 'undefined') return null;
  const key = getCacheKey(region);
  if (!Keychain.contains(key)) return null;
  try {
    return JSON.parse(Keychain.get(key));
  } catch (error) {
    return null;
  }
}

function writeCache(region, data) {
  if (typeof Keychain === 'undefined') return;
  try {
    Keychain.set(getCacheKey(region), JSON.stringify(data));
  } catch (error) {
    console.warn(`Oil widget cache skipped: ${error.message || error}`);
  }
}

async function loadOilData(region, { showTrend = true } = {}) {
  const cached = readCache(region);
  try {
    const data = await fetchOilData(region, { showTrend });
    writeCache(region, data);
    return { data, errorMessage: '' };
  } catch (error) {
    if (cached) return { data: cached, errorMessage: '' };
    return {
      data: {
        regionName: '',
        prices: DEFAULT_PRICES,
        trendInfo: '',
      },
      errorMessage: error.message || '加载失败',
    };
  }
}

function createOilWidget({ family = 'medium', data, now = new Date(), showTrend = true, errorMessage = '' } = {}) {
  const plan = getOilWidgetPlan({ family, data, now, showTrend, errorMessage });
  const colors = makeColors();
  const widget = new ListWidget();
  widget.backgroundColor = colors.background;
  widget.setPadding(plan.widgetPadding, plan.widgetPadding, plan.widgetPadding, plan.widgetPadding);
  widget.refreshAfterDate = new Date(Date.now() + CACHE_REFRESH_HOURS * 60 * 60 * 1000);

  addHeader(widget, plan, colors);
  widget.addSpacer(plan.sectionGap);
  addPrices(widget, plan, colors);
  widget.addSpacer(plan.sectionGap);
  addFooter(widget, plan, colors);

  return widget;
}

async function runInScriptable() {
  const options = parseWidgetParameter(typeof args !== 'undefined' ? args.widgetParameter : '');
  const family = typeof config !== 'undefined' ? config.widgetFamily : 'medium';
  const { data, errorMessage } = await loadOilData(options.region, { showTrend: options.showTrend });
  const widget = createOilWidget({
    family,
    data,
    showTrend: options.showTrend,
    errorMessage,
  });

  if (typeof config !== 'undefined' && config.runsInWidget) {
    Script.setWidget(widget);
    Script.complete();
    return;
  }

  if (typeof widget.presentMedium === 'function') {
    await widget.presentMedium();
  }
  if (typeof Script !== 'undefined') Script.complete();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_REFRESH_HOURS,
    DEFAULT_REGION,
    createOilWidget,
    getCacheKey,
    getOilWidgetPlan,
    normalizeRegionParam,
    parseOilHtml,
    parseWidgetParameter,
  };
}

if (typeof Script !== 'undefined' && typeof config !== 'undefined') {
  runInScriptable().catch((error) => {
    console.error(error);
    Script.complete();
  });
}
