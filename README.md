# TeslaMate Dashboard

A beautiful, widget-based dashboard for [TeslaMate](https://github.com/adriankumpf/teslamate) — a lightweight alternative to Grafana.

![Tesla UI inspired dark dashboard]

## Features

- **Tesla-style dark UI** — clean, minimal, inspired by the in-car display
- **Widget system** — show/hide and reorder widgets from the UI
- **Real-time data** — battery %, range, tyre pressures, temperatures, state
- **Dual-tariff charging cost** — split kWh by day/night rates with per-month tariff management
- **Monthly statistics** — drives, km, energy, efficiency
- **Recent drives** — today & yesterday with route, distance, efficiency
- **Responsive** — works on desktop and phone
- **Zero extra databases** — connects read-only to your existing TeslaMate PostgreSQL; stores settings in a local SQLite file inside the container

---

## Quick Start (Docker)

Add to your existing `docker-compose.yml`:

```yaml
services:
  teslamate-dashboard:
    image: ghcr.io/yourusername/teslamate-dashboard:latest
    restart: unless-stopped
    ports:
      - "4000:3000"
    environment:
      DATABASE_URL: postgres://teslamate:YOUR_PASSWORD@database:5432/teslamate
      TIMEZONE: Europe/Sofia
    volumes:
      - teslamate-dashboard-data:/data
    networks:
      - teslamate

volumes:
  teslamate-dashboard-data:
```

Then open `http://your-server:4000`.

> **Tip:** Replace `database` with the service name of your PostgreSQL container. The `TIMEZONE` must match a valid [tz database name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string for TeslaMate DB |
| `TIMEZONE` | ❌ | `UTC` | Local timezone for charge time display (e.g. `Europe/Sofia`) |
| `PORT` | ❌ | `3000` | Internal HTTP port |
| `DATA_DIR` | ❌ | `/data` | Path for SQLite settings file inside container |

---

## Build Locally

```bash
# Clone
git clone https://github.com/yourusername/teslamate-dashboard.git
cd teslamate-dashboard

# Build Docker image
docker build -t teslamate-dashboard .

# Run
docker run -p 4000:3000 \
  -e DATABASE_URL="postgres://teslamate:password@localhost:5432/teslamate" \
  -e TIMEZONE="Europe/Sofia" \
  -v $(pwd)/data:/data \
  teslamate-dashboard
```

### Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
# Visit http://localhost:5173
```

---

## Widgets

| Widget | Description |
|---|---|
| **Battery & Range** | Battery %, rated/estimated range, odometer |
| **Tyre Pressures** | FL/FR/RL/RR in bar with colour warnings |
| **Temperature** | Inside/outside temp with climate status |
| **Last Charge** | End battery %, kWh added, date |
| **Monthly Stats** | Drives, km, time, energy, efficiency |
| **Recent Drives** | Today & yesterday drive table |
| **Charging Cost** | Dual-tariff day/night cost calculator with per-session breakdown |

Click **⊞ Widgets** in the top-right to enable/disable widgets.

---

## Dual-Tariff Charging Cost

This feature is unique to TeslaMate Dashboard. It splits charging kWh into **day** and **night** tariffs based on your electricity provider's time-of-use pricing.

1. Click **⚙ Prices** inside the Charging Cost widget
2. Select your home charging location (geofence from TeslaMate)
3. Enter day/night prices (EUR/kWh) and the night window hours
4. Apply to one or more months
5. Run a date-range calculation to see cost breakdown per session

Tariffs are stored locally in SQLite and never sent anywhere.

---

## Architecture

```
teslamate-dashboard/
├── backend/          Node.js + Express API
│   └── src/
│       ├── db/       postgres.js (TeslaMate, read-only), sqlite.js (settings)
│       └── routes/   car, tariffs, chargeCost, widgets
├── frontend/         React + Tailwind CSS SPA
│   └── src/
│       ├── components/widgets/   One file per widget
│       └── lib/      api.js, utils.js
└── Dockerfile        Multi-stage build
```

---

## Security

- The app connects to TeslaMate PostgreSQL in **read-only** mode — it never writes to the TeslaMate database
- Tariff data and widget layout are stored in a local SQLite file inside the container volume
- No authentication by default — add a reverse proxy (nginx, Traefik) with basic auth if needed

---

## Contributing

PRs welcome! Please open an issue first for large changes.

## License

MIT
