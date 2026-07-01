# Scriptable Widgets

Scriptable widget scripts for iPhone Home Screen widgets.

## Widgets

- Holiday countdown: `scripts/Holiday_Countdown.scriptable.js`
- Oil price: `scripts/Oil_Widget.scriptable.js`

## Holiday Countdown

Raw URL:

```text
https://raw.githubusercontent.com/Jau771/Scriptable/main/scripts/Holiday_Countdown.scriptable.js
```

The widget shows upcoming holidays, lunar festivals, floating holidays, and solar
terms in a compact capsule grid.

Optional widget parameter:

```text
no-term,no-holiday,no-traditional
```

Use any comma-separated subset:

- `no-term`: hide solar terms.
- `no-holiday`: hide fixed Gregorian holidays.
- `no-traditional`: hide lunar and floating holidays.

## Oil Price

Raw URL:

```text
https://raw.githubusercontent.com/Jau771/Scriptable/main/scripts/Oil_Widget.scriptable.js
```

The widget fetches live oil prices from `m.qiyoujiage.com`, caches the last
successful result, and displays 92/95/98 gasoline and diesel prices.

Refresh interval: 6 hours.

Optional widget parameter:

```text
region=shandong/dezhou,trend=false
```

You can also pass only the region, for example:

```text
hainan/haikou
```

Default region: `shandong/dezhou`.

## Development

```bash
npm test
```
