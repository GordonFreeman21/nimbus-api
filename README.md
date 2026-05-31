# Nimbus API

**Lightweight, open-source APIs built with Go.**  
No paywalls. No signup. No BS.

Nimbus is a small developer studio from Niedersachsen, Germany. We build APIs, tools, and apps — if it's useful and can be open source, we'll build it.

## Philosophy

- **Built with Go** — Single binary. Minimal memory. Deploys in seconds. Fast and boring.
- **Forever Free** — No "free trial." No "basic plan." No credit card required. Free means free.
- **Open Source** — Every line of code is public. Read it, fork it, ship your own version.
- **No BS** — No signup walls, no dashboard you don't need, no email just to try something.

## API Endpoints

### `GET /api/v1/weather?city={city}`

Returns current weather for a city. No API key needed.

| Field | Description |
|-------|-------------|
| `city` | City name |
| `temp_celsius` | Current temperature in °C |
| `humidity_percent` | Relative humidity |
| `wind_speed_kmh` | Wind speed |
| `description` | Human-readable weather description |
| `nimbus_message` | Playful weather message |

```bash
curl "https://nimbus-api-gxuc.onrender.com//api/v1/weather?city=Berlin"
```

### `GET /api/v1/bio/species?name={name}`

Search for any animal or plant by common name and get its full scientific taxonomic hierarchy (kingdom, phylum, class, order, family). Powered by the GBIF Species API.

| Field | Description |
|-------|-------------|
| `common_name` | The name you searched for |
| `scientific_name` | Accepted scientific name |
| `kingdom` | Taxonomic kingdom |
| `phylum` | Taxonomic phylum |
| `class` | Taxonomic class |
| `order` | Taxonomic order |
| `family` | Taxonomic family |

```bash
curl https://nimbus-api-gxuc.onrender.com//api/v1/bio/species?name=Blue+Whale"
```

**Response:**
```json
{
  "common_name": "Blue Whale",
  "scientific_name": "Balaenoptera musculus",
  "kingdom": "Animalia",
  "phylum": "Chordata",
  "class": "Mammalia",
  "order": "Cetacea",
  "family": "Balaenopteridae"
}
```

### `GET /api/v1/screenshot?url={url}`

Captures a real-time PNG screenshot of any public website. Uses headless Chrome via chromedp.

| Parameter | Description |
|-----------|-------------|
| `url` | Full URL starting with `http://` or `https://` |

```bash
curl "https://nimbus-api-gxuc.onrender.com//api/v1/screenshot?url=https://example.com" --output screenshot.png
```

**Notes:**
- Returns raw `image/png` binary data
- Full-page screenshot (viewport 1920×1080)
- 30-second timeout per request
- Requires Chrome/Chromium installed locally

### `GET /api/v1/geocode?city={city}` — *Coming soon*

### `GET /health`

Returns `{"status": "ok"}`.

## Project Structure

```
nimbus-api/
├── cmd/nimbus/main.go           # Entry point, server setup
├── internal/
│   ├── config/config.go         # Environment & config loading
│   ├── handler/
│   │   ├── weather.go           # Weather HTTP handlers
│   │   ├── species.go           # Species taxonomy handlers
│   │   └── screenshot.go        # Website screenshot handler
│   ├── middleware/logger.go     # Request logging middleware
│   ├── models/
│   │   ├── weather.go           # Weather & error data structures
│   │   └── species.go           # Species taxonomy data structures
│   └── services/
│       ├── weather.go           # Weather business logic & API calls
│       ├── species.go           # GBIF species lookup logic
│       └── screenshot.go        # Chrome screenshot logic
├── go.mod
├── render.yaml                  # Render.com deployment config
└── .gitignore
```

## Getting Started

### Prerequisites

- Go 1.22+

### Run locally

```bash
git clone https://github.com/GordonFreeman21/nimbus-api.git
cd nimbus-api
go run ./cmd/nimbus
```

The server starts on port `8080` by default. Override with a `PORT` environment variable or a `.env` file:

```
PORT=3000
```

## Deployment

This project includes a `render.yaml` for one-click deploy on [Render](https://render.com).

## Contact

- **Email:** kareemharimech7@gmail.com
- **Discord:** [Join the server](https://discord.gg/nimbus)
- **GitHub:** [GordonFreeman21/nimbus-api](https://github.com/GordonFreeman21/nimbus-api)

## License

MIT
