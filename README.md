# TeslaMate Dashboard

A beautiful, widget-based dashboard for your Tesla — built as a free alternative to Grafana.

Made by [mvmrik](https://github.com/mvmrik)

---

## What is this?

If you use [TeslaMate](https://github.com/adriankumpf/teslamate) to track your Tesla, you already have all your car's data stored in a database. This dashboard gives you a clean, modern way to view that data — without needing to set up or learn Grafana.

It shows things like:
- 🔋 Battery level and range
- 🛞 Tyre pressures
- 🌡️ Inside and outside temperature
- ⚡ Last charge details
- 📊 Monthly driving statistics
- 🗺️ Recent drives
- 💶 Charging cost calculator with day/night electricity tariffs
- 🧭 Trip tracking with detailed per-trip statistics

---

## Requirements

Before installing, you need:

1. **TeslaMate** already running with Docker — [TeslaMate installation guide](https://docs.teslamate.org/docs/installation/docker)
2. **Docker** and **Docker Compose** installed on your server or computer
3. Your TeslaMate **database password** (you set this when you installed TeslaMate)

That's it. No programming knowledge needed.

---

## Installation

### Step 1 — Find your existing `docker-compose.yml`

This is the file you used to install TeslaMate. Open it in a text editor.

### Step 2 — Add the dashboard service

Copy and paste this into your `docker-compose.yml`, at the same level as your other services:

```yaml
  teslamate-dashboard:
    image: mvmrik/teslamate-dashboard:latest
    restart: unless-stopped
    ports:
      - "4000:3000"
    environment:
      DATABASE_URL: postgres://teslamate:YOUR_DB_PASSWORD@database:5432/teslamate
      TIMEZONE: Europe/Sofia
    volumes:
      - teslamate-dashboard-data:/data
    networks:
      - teslamate
```

And at the bottom of your file, under `volumes:`, add:

```yaml
  teslamate-dashboard-data:
```

### Step 3 — Change the settings

In the block you just pasted, change:

| Value | What to put |
|---|---|
| `YOUR_DB_PASSWORD` | Your TeslaMate database password |
| `Europe/Sofia` | Your timezone — [find yours here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) |

### Step 4 — Start it

Run this command in the same folder as your `docker-compose.yml`:

```bash
docker compose up -d teslamate-dashboard
```

### Step 5 — Open it

Go to `http://your-server-ip:4000` in your browser.

Done! ✅

---

## Full example docker-compose.yml

Here is what a complete setup looks like (your file may look slightly different):

```yaml
version: "3.8"

services:
  teslamate:
    image: teslamate/teslamate:latest
    restart: always
    environment:
      - ENCRYPTION_KEY=your-encryption-key
      - DATABASE_USER=teslamate
      - DATABASE_PASS=your-db-password
      - DATABASE_NAME=teslamate
      - DATABASE_HOST=database
      - MQTT_HOST=mosquitto
    ports:
      - "4080:4000"
    networks:
      - teslamate

  database:
    image: postgres:16
    restart: always
    environment:
      - POSTGRES_USER=teslamate
      - POSTGRES_PASSWORD=your-db-password
      - POSTGRES_DB=teslamate
    volumes:
      - teslamate-db:/var/lib/postgresql/data
    networks:
      - teslamate

  grafana:
    image: teslamate/grafana:latest
    restart: always
    ports:
      - "3000:3000"
    networks:
      - teslamate

  teslamate-dashboard:
    image: mvmrik/teslamate-dashboard:latest
    restart: unless-stopped
    ports:
      - "4000:3000"
    environment:
      DATABASE_URL: postgres://teslamate:your-db-password@database:5432/teslamate
      TIMEZONE: Europe/Sofia
    volumes:
      - teslamate-dashboard-data:/data
    networks:
      - teslamate

volumes:
  teslamate-db:
  teslamate-dashboard-data:

networks:
  teslamate:
```

---

## Updating to a new version

When a new version is released, run this in the folder where your `docker-compose.yml` is:

```bash
docker compose pull teslamate-dashboard
docker compose up -d teslamate-dashboard
```

---

## Widgets

You can show or hide widgets by clicking **⊞ Widgets** in the top right corner. The layout is fully customisable — drag to reorder, resize columns and rows.

| Widget | Description |
|---|---|
| Battery & Range | Battery percentage, rated and estimated range, odometer |
| Tyre Pressures | All four tyres in bar, with colour warnings if low |
| Temperature | Outside and inside temperature, climate status |
| Last Charge | End battery level, energy added, date |
| Monthly Stats | Drives, distance, time, energy used, efficiency |
| Recent Drives | Drives from today and yesterday |
| Charging Cost | Day/night tariff cost calculator |
| Trips | Track multi-day trips with detailed statistics |

---

## Trip tracking

The **Trips** widget lets you group drives into a single trip (e.g. a holiday or a road trip spanning multiple days).

**How to use:**
1. Press **+ New Trip** and give it a name before you leave
2. The widget shows live stats for the active trip: distance, drive time, and consumption
3. Tap the trip name to open the detailed view, which shows:
   - Distance and number of charging stops
   - Speed (average and maximum)
   - Power (maximum and maximum regeneration)
   - Consumption (average per 100 km/mi and total kWh used)
   - Outside temperature (average, minimum, maximum)
   - Inside temperature while driving (average, minimum, maximum)
   - Inside temperature while parked (average, minimum, maximum)
   - Elevation (average, minimum, maximum)
   - Total ascent and descent
   - Battery level (minimum and maximum reached)
   - Charging time and energy added
   - AC charging efficiency
   - Full state timeline (driving, charging, sleeping, etc.)
4. Press **Stop** when the trip is done

Trip data is stored locally in the container volume and is never lost on restart.

---

## Charging cost calculator

This is a unique feature not available in TeslaMate or Grafana.

It lets you calculate exactly how much money you spent charging your Tesla, split by **day** and **night** electricity tariffs (useful if your electricity provider charges different rates at different times).

**How to set it up:**
1. Open the dashboard and find the **Charging Cost** widget
2. Click **⚙ Prices**
3. Select your home charging location
4. Enter your electricity prices (day rate and night rate in EUR/kWh)
5. Set the night hours (e.g. 22:00 to 06:00)
6. Apply to the months you want
7. Pick a date range and click **Calculate**

Your tariff settings are saved locally inside the container and never sent anywhere.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | — | Connection to your TeslaMate PostgreSQL database |
| `TIMEZONE` | ❌ No | `UTC` | Your local timezone (e.g. `Europe/Sofia`, `Europe/London`) |
| `PORT` | ❌ No | `3000` | Internal port (do not change unless you know what you're doing) |

---

## Frequently asked questions

**Does this work without TeslaMate?**
No. TeslaMate must be installed and collecting data from your car first.

**Does this replace TeslaMate or Grafana?**
No. TeslaMate runs in the background as always. This dashboard is just a nicer way to view the data. You can keep Grafana too.

**Is my data sent anywhere?**
No. The dashboard connects only to your own database. Nothing is sent to any external server.

**Can I use this on my phone?**
Yes. The design is responsive and works well on mobile.

**What if I have multiple Teslas?**
Currently the dashboard shows data for car ID 1 (the first car in TeslaMate). Multi-car support is planned.

---

## License

MIT — free to use, modify and share.

---

Made with ❤️ by [mvmrik](https://github.com/mvmrik)
