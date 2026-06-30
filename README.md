# Scriptable Widgets

Scriptable widget scripts for iPhone Home Screen widgets.

## Widgets

- Holiday countdown: `scripts/Holiday_Countdown.scriptable.js`

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

## Development

```bash
npm test
```
