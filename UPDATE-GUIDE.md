# Updating the Eagles schedule calendar

The public calendar is **editor-friendly by design**: every event is a small
YAML file. To add, change or remove something, you edit a file and commit — no
code, no build step to learn. After the push, Cloudflare Pages rebuilds the site
and the calendar updates automatically.

**Where:** `src/content/calendar/`

---

## The two kinds of entries

1. **Recurring** (e.g. weekly Sunday training) — uses a `recurrence` block.
2. **One-off / multi-day** (races, meets, events) — uses `start` (and `end`).

### Recurring — Sunday training (already live)

`src/content/calendar/training-sunday.yaml`:

```yaml
title: Sunday training session
category: training
recurrence:
  freq: weekly
  days: [Sun]            # Mon Tue Wed Thu Fri Sat Sun
  from: '2026-08-16'     # first occurrence
  # until: '2026-12-20'  # optional — stop after this date
time: '12:00'            # 24h, optional
endTime: '13:00'         # optional
location: TBC            # optional
info: >-                 # free text, optional (wraps across lines)
  Open to club members. Bring your own helmet (required to skate) ...
url: https://…           # optional link to official event info
```

- To change the time: edit `time` / `endTime`.
- To run training twice a week: add another day, e.g. `days: [Tue, Sun]`.
- To pause for a season: add an `until:` date.

### One-off event — a race or meet

Create a new file, e.g. `src/content/calendar/my-race.yaml`:

```yaml
title: State championships
category: state          # training | local | state | national | international
start: '2026-10-18'      # YYYY-MM-DD
# end: '2026-10-19'      # add this for a multi-day event
time: '09:00'            # 24h, optional
endTime: '17:00'         # optional
location: Queensland Speed Centre   # optional
info: >-                 # free text, optional
  Nominations close two weeks prior. See official page for the program.
url: https://example.org/event      # link to official event info (optional)
```

**Categories** drive the colour and the filter buttons on the site:

| category       | filter label | colour  |
| -------------- | ------------ | ------- |
| `training`     | Training     | navy    |
| `local`        | Local        | green   |
| `state`        | State        | amber   |
| `national`     | National     | purple  |
| `international`| International| red     |

---

## How to add a new event

1. Copy any existing `.yaml` file in `src/content/calendar/` (or use the
   templates above) into the same folder with a new filename.
2. Fill in the fields. Only `title`, `category`, and one of
   `start` / `recurrence` are required.
3. Commit and push. That's it.

```bash
git add src/content/calendar/your-event.yaml
git commit -m "Add: State championships 2026"
git push
```

## How to remove or edit

- **Remove:** delete the file and push.
- **Edit:** change the field and push. Times/dates/locations/links all update on
  the next build.
- The five `example-*.yaml` files are **placeholders** (clearly marked
  "EXAMPLE ENTRY"). Replace them with real events or delete them — they are not
  real fixtures.

## Rules the build enforces (so mistakes fail loudly, not silently)

- Dates are `YYYY-MM-DD`; times are 24-hour `HH:MM`.
- Each entry must have **either** `start` **or** `recurrence` — not both.
- `category` must be one of the five listed above.
- `url`, if present, must be a valid URL.

If a file breaks a rule, `npm run build` (and the deploy) will report the exact
field — fix it and push again.
