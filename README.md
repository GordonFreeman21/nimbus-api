# NimbusAPI

A lightweight weather API built in Go that fetches real-time weather data from [Open-Meteo](https://open-meteo.com/) and returns clean, human-readable JSON responses with playful weather messages.

## Features

- City-based weather lookup via geocoding + forecast APIs
- Temperature, humidity, wind speed, and condition descriptions
- Fun "Nimbus messages" based on current conditions
- Request logging middleware with response times
- Health check endpoint
- Graceful shutdown handling
- `.env` support via `godotenv`

## Project Structure

```
nimbus-api/
├── cmd/nimbus/main.go          # Entry point, server setup
├── internal/
│   ├── config/config.go        # Environment & config loading
│   ├── handler/weather.go      # HTTP handlers
│   ├── middleware/logger.go     # Request logging middleware
│   ├── models/weather.go       # Data structures
│   └── services/weather.go     # Business logic & API calls
├── go.mod
└── .gitignore
```

## Getting Started

### Prerequisites

- Go 1.22+

### Run

```bash
go run ./cmd/nimbus
```

The server starts on port `8080` by default. Override with a `PORT` environment variable or a `.env` file.

### Example `.env`

```
PORT=3000
```

## API Endpoints

### `GET /api/v1/weather?city={city}`

Returns current weather for the given city.

**Response:**

```json
{
  "city": "Berlin",
  "temp_celsius": 18.5,
  "humidity_percent": 62,
  "wind_speed_kmh": 12.3,
  "description": "Mainly clear, partly cloudy, or overcast",
  "nimbus_message": "🌤️ Nimbus says: Enjoy the weather!"
}
```

**Errors:**

| Status | Meaning |
|--------|---------|
| 400 | Missing `city` parameter |
| 404 | City not found |
| 500 | Upstream API failure |

### `GET /health`

Returns `{"status": "ok"}`.

## License

MIT
