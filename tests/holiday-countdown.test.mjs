import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCountdowns,
  getWidgetPlan,
} from '../scripts/Holiday_Countdown.scriptable.js';

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

test('can filter solar terms out of the widget plan', () => {
  const plan = getWidgetPlan({
    family: 'medium',
    now: new Date(2026, 5, 30),
    options: { showTerms: false },
  });

  assert.equal(plan.visibleItems.some((item) => item.name === '小暑'), false);
});
