import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  createWidget,
  getCountdowns,
  getWidgetPlan,
} = require('../scripts/Holiday_Countdown.scriptable.js');

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
      };
      this.children.push(child);
      return child;
    }

    addSpacer(length) {
      this.children.push({ type: 'spacer', length });
    }

    layoutHorizontally() {}
    centerAlignContent() {}

    setPadding(top, leading, bottom, trailing) {
      this.padding = { top, leading, bottom, trailing };
    }
  }

  global.Color = FakeColor;
  global.Font = FakeFont;
  global.Size = FakeSize;
  global.ListWidget = class FakeListWidget extends FakeStack {
    constructor() {
      super('widget');
    }
  };
}

test('returns upcoming countdowns sorted by days', () => {
  const items = getCountdowns(new Date(2026, 5, 30));

  assert.equal(items[0].name, '建党节');
  assert.equal(items[0].days, 1);
  assert.ok(items.some((item) => item.name === '小暑' && item.days === 7));
});

test('includes lunar holidays in the upcoming countdown list', () => {
  const items = getCountdowns(new Date(2026, 1, 1));

  assert.ok(items.some((item) => item.name === '春节' && item.days === 16));
  assert.ok(items.some((item) => item.name === '元宵节'));
});

test('uses compact grid limits for medium widgets', () => {
  const plan = getWidgetPlan({
    family: 'medium',
    now: new Date(2026, 5, 30),
  });

  assert.equal(plan.columns, 5);
  assert.equal(plan.visibleItems.length, 30);
  assert.equal(plan.visibleItems[0].label, '建党节 1天');
});

test('uses fixed medium capsule geometry to avoid Scriptable text ellipsis', () => {
  const plan = getWidgetPlan({
    family: 'medium',
    now: new Date(2026, 5, 30),
  });

  assert.equal(plan.itemWidth, 58);
  assert.equal(plan.itemHeight, 25);
  assert.equal(plan.capsuleHorizontalPadding, 2);
  assert.equal(plan.usesFlexibleSpacers, true);
  assert.ok(plan.fontSize <= 11);
  assert.ok(plan.minimumScaleFactor <= 0.6);
  assert.equal(plan.visibleItems.some((item) => item.label.includes('…')), false);
});

test('renders medium capsules with fixed width and flexible spacing', () => {
  installScriptableFakes();

  const widget = createWidget({
    family: 'medium',
    now: new Date(2026, 5, 30),
    options: {},
  });
  const firstRow = widget.children[0];
  const capsules = firstRow.children.filter((child) => child.type === 'stack');
  const spacers = firstRow.children.filter((child) => child.type === 'spacer');

  assert.equal(firstRow.spacing || 0, 0);
  assert.equal(capsules.length, 5);
  assert.deepEqual(spacers.map((spacer) => spacer.length), [undefined, undefined, undefined, undefined]);
  assert.equal(capsules[0].size.width, 58);
  assert.equal(capsules[0].size.height, 25);
  assert.equal(capsules[0].children[0].text, '建党节 1天');
});

test('can filter solar terms out of the widget plan', () => {
  const plan = getWidgetPlan({
    family: 'medium',
    now: new Date(2026, 5, 30),
    options: { showTerms: false },
  });

  assert.equal(plan.visibleItems.some((item) => item.name === '小暑'), false);
});
