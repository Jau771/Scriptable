import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  CACHE_REFRESH_HOURS,
  createOilWidget,
  getCacheKey,
  getOilWidgetPlan,
  normalizeRegionParam,
  parseOilHtml,
  parseWidgetParameter,
} = require('../scripts/Oil_Widget.scriptable.js');

function installScriptableFakes() {
  class FakeColor {
    constructor(hex, alpha = 1) {
      this.hex = hex;
      this.alpha = alpha;
    }

    static dynamic(light, dark) {
      return { light, dark };
    }
  }

  class FakeFont {
    static mediumSystemFont(size) {
      return { weight: 'medium', size };
    }

    static semiboldSystemFont(size) {
      return { weight: 'semibold', size };
    }
  }

  class FakeSize {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
  }

  class FakeStack {
    constructor(type = 'stack') {
      this.type = type;
      this.children = [];
    }

    addStack() {
      const child = new FakeStack();
      this.children.push(child);
      return child;
    }

    addText(text) {
      const child = {
        type: 'text',
        text,
        centerAlignText() {},
        rightAlignText() {},
      };
      this.children.push(child);
      return child;
    }

    addImage(image) {
      const child = { type: 'image', image };
      this.children.push(child);
      return child;
    }

    addSpacer(length) {
      this.children.push({ type: 'spacer', length });
    }

    layoutHorizontally() {}
    layoutVertically() {}
    centerAlignContent() {}

    setPadding(top, leading, bottom, trailing) {
      this.padding = { top, leading, bottom, trailing };
    }
  }

  global.Color = FakeColor;
  global.Font = FakeFont;
  global.Size = FakeSize;
  global.SFSymbol = {
    named(name) {
      return { image: `sf-symbol:${name}` };
    },
  };
  global.ListWidget = class FakeListWidget extends FakeStack {
    constructor() {
      super('widget');
    }
  };
}

const SAMPLE_HTML = `
<!doctype html>
<html>
<head>
  <title>德州油价_德州92_95汽油价格_德州今日油价查询_汽油价格网</title>
</head>
<body>
  <div class="content_youjia">
    <dl>
      <dt>德州92号汽油</dt>
      <dd>7.90(元)</dd>
    </dl>
    <dl>
      <dt>德州95号汽油</dt>
      <dd>8.48(元)</dd>
    </dl>
    <dl>
      <dt>德州98号汽油</dt>
      <dd>9.48(元)</dd>
    </dl>
    <dl>
      <dt>德州0号柴油</dt>
      <dd>7.52(元)</dd>
    </dl>
  </div>
  <div class="tishi"> <span>下次油价7月3日24时调整</span><br/>
目前预计下调630元/吨(0.48元/升-0.57元/升),大家相互转告油价继续下跌。<br/>
  </div>
</body>
</html>`;

test('normalizes Scriptable oil widget parameters', () => {
  assert.deepEqual(parseWidgetParameter(''), {
    region: 'shandong/dezhou',
    showTrend: true,
  });
  assert.deepEqual(parseWidgetParameter('hainan/haikou'), {
    region: 'hainan/haikou',
    showTrend: true,
  });
  assert.deepEqual(parseWidgetParameter('region=shandong/dezhou,trend=false'), {
    region: 'shandong/dezhou',
    showTrend: false,
  });
  assert.equal(normalizeRegionParam('/shandong/dezhou.shtml'), 'shandong/dezhou');
});

test('uses a non-reserved Keychain cache key and six-hour refresh interval', () => {
  const key = getCacheKey('shandong/dezhou');

  assert.equal(key, 'jau771_oil_widget_shandong_dezhou');
  assert.equal(key.startsWith('scriptable'), false);
  assert.equal(CACHE_REFRESH_HOURS, 6);
});

test('parses qiyoujiage html into oil prices and trend text', () => {
  const parsed = parseOilHtml(SAMPLE_HTML, { showTrend: true });

  assert.equal(parsed.regionName, '德州');
  assert.deepEqual(parsed.prices, {
    p92: 7.9,
    p95: 8.48,
    p98: 9.48,
    diesel: 7.52,
  });
  assert.equal(parsed.trendInfo, '7月3日24时调整 ↓ 0.48-0.57');
});

test('can hide trend parsing when requested', () => {
  const parsed = parseOilHtml(SAMPLE_HTML, { showTrend: false });

  assert.equal(parsed.trendInfo, '');
});

test('builds a medium oil widget plan matching the accepted Egern layout', () => {
  const data = parseOilHtml(SAMPLE_HTML, { showTrend: true });
  const plan = getOilWidgetPlan({
    family: 'medium',
    data,
    now: new Date(2026, 6, 1, 13, 6),
    showTrend: true,
  });

  assert.equal(plan.title, '德州实时油价');
  assert.equal(plan.trendInfo, '7月3日24时调整 ↓ 0.48-0.57');
  assert.equal(plan.updatedText, '13:06 更新');
  assert.equal(plan.unitText, '元/升');
  assert.equal(plan.rows.length, 4);
  assert.deepEqual(plan.rows.map((row) => row.label), ['92 号', '95 号', '98 号', '柴油']);
  assert.deepEqual(plan.rows.map((row) => row.priceText), ['7.90', '8.48', '9.48', '7.52']);
  assert.equal(plan.cardWidth, 70);
  assert.equal(plan.cardHeight, 62);
});

test('renders a medium oil widget with header, four price cards, and footer', () => {
  installScriptableFakes();
  const data = parseOilHtml(SAMPLE_HTML, { showTrend: true });
  const widget = createOilWidget({
    family: 'medium',
    data,
    now: new Date(2026, 6, 1, 13, 6),
    showTrend: true,
  });

  const stacks = widget.children.filter((child) => child.type === 'stack');
  const header = stacks[0];
  const priceRow = stacks[1];
  const footer = stacks[2];
  const cards = priceRow.children.filter((child) => child.type === 'stack');

  assert.ok(header.children.some((child) => child.text === '德州实时油价'));
  assert.ok(header.children.some((child) => child.text === '7月3日24时调整 ↓ 0.48-0.57'));
  assert.equal(cards.length, 4);
  assert.equal(cards[0].size.width, 70);
  assert.equal(cards[0].size.height, 62);
  assert.equal(cards[0].children[0].children[0].text, '92 号');
  assert.equal(cards[0].children[2].text, '7.90');
  assert.ok(footer.children.some((child) => child.text === '13:06 更新'));
  assert.ok(footer.children.some((child) => child.text === '元/升'));
});
