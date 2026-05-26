package models

// Geocoding API response
type GeocodingResponse struct {
	Results []struct {
		Name      string  `json:"name"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Country   string  `json:"country"`
	} `json:"results"`
}

// Open-Meteo current weather response
type OpenMeteoResponse struct {
	Current struct {
		Temperature2m      float64 `json:"temperature_2m"`
		RelativeHumidity2m int     `json:"relative_humidity_2m"`
		WindSpeed10m       float64 `json:"wind_speed_10m"`
		WeatherCode        int     `json:"weather_code"`
	} `json:"current"`
}

// Clean JSON output for our API
type NimbusWeatherResponse struct {
	City          string  `json:"city"`
	TempCelsius   float64 `json:"temp_celsius"`
	Humidity      int     `json:"humidity_percent"`
	WindSpeedKMH  float64 `json:"wind_speed_kmh"`
	Description   string  `json:"description"`
	NimbusMessage string  `json:"nimbus_message"`
}

// Standard error response
type ErrorResponse struct {
	Error string `json:"error"`
}
