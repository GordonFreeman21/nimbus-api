package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/models"
)

type WeatherService struct {
	httpClient   *http.Client
	geocodingURL string
	weatherURL   string
}

func NewWeatherService(geocodingURL, weatherURL string) *WeatherService {
	return &WeatherService{
		httpClient:   &http.Client{Timeout: 10 * time.Second},
		geocodingURL: geocodingURL,
		weatherURL:   weatherURL,
	}
}

// WMO Weather Codes → human readable
func weatherCodeToDescription(code int) string {
	switch code {
	case 0:
		return "Clear sky"
	case 1, 2, 3:
		return "Mainly clear, partly cloudy, or overcast"
	case 45, 48:
		return "Fog or depositing rime fog"
	case 51, 53, 55:
		return "Drizzle"
	case 56, 57:
		return "Freezing drizzle"
	case 61, 63, 65:
		return "Rain"
	case 66, 67:
		return "Freezing rain"
	case 71, 73, 75:
		return "Snow fall"
	case 77:
		return "Snow grains"
	case 80, 81, 82:
		return "Rain showers"
	case 85, 86:
		return "Snow showers"
	case 95:
		return "Thunderstorm"
	case 96, 99:
		return "Thunderstorm with hail"
	default:
		return "Unknown"
	}
}

// Helper to generate a playful "Nimbus message" based on conditions
func nimbusMessage(desc string, humidity int, wind float64) string {
	switch {
	case desc == "Rain" || desc == "Rain showers" || desc == "Drizzle":
		return "☔ Nimbus says: Take an umbrella!"
	case desc == "Thunderstorm" || desc == "Thunderstorm with hail":
		return "⚡ Nimbus says: Seek shelter, storm approaching!"
	case desc == "Clear sky":
		return "🌞 Nimbus says: Perfect day for a walk."
	case humidity > 80:
		return "💧 Nimbus says: Feels a bit muggy out there."
	case wind > 30:
		return "💨 Nimbus says: Hold onto your hat – it's windy!"
	default:
		return "🌤️ Nimbus says: Enjoy the weather!"
	}
}

func (s *WeatherService) GetWeatherByCity(city string) (*models.NimbusWeatherResponse, error) {
	// 1. Geocoding: city → lat/lon
	geoResp, err := s.geocodeCity(city)
	if err != nil {
		return nil, err
	}
	if len(geoResp.Results) == 0 {
		return nil, fmt.Errorf("city not found")
	}
	first := geoResp.Results[0]
	lat := first.Latitude
	lon := first.Longitude
	cityName := first.Name

	// 2. Weather API
	weatherResp, err := s.fetchWeather(lat, lon)
	if err != nil {
		return nil, err
	}

	desc := weatherCodeToDescription(weatherResp.Current.WeatherCode)
	nimbusMsg := nimbusMessage(desc, weatherResp.Current.RelativeHumidity2m, weatherResp.Current.WindSpeed10m)

	return &models.NimbusWeatherResponse{
		City:          cityName,
		TempCelsius:   weatherResp.Current.Temperature2m,
		Humidity:      weatherResp.Current.RelativeHumidity2m,
		WindSpeedKMH:  weatherResp.Current.WindSpeed10m,
		Description:   desc,
		NimbusMessage: nimbusMsg,
	}, nil
}

func (s *WeatherService) geocodeCity(city string) (*models.GeocodingResponse, error) {
	apiURL := fmt.Sprintf("%s?name=%s&count=1&language=en&format=json", s.geocodingURL, url.QueryEscape(city))
	resp, err := s.httpClient.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geocoding API returned %d", resp.StatusCode)
	}

	var geo models.GeocodingResponse
	if err := json.NewDecoder(resp.Body).Decode(&geo); err != nil {
		return nil, err
	}
	return &geo, nil
}

func (s *WeatherService) fetchWeather(lat, lon float64) (*models.OpenMeteoResponse, error) {
	apiURL := fmt.Sprintf("%s?latitude=%f&longitude=%f&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto", s.weatherURL, lat, lon)
	resp, err := s.httpClient.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather API returned %d", resp.StatusCode)
	}

	var weather models.OpenMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&weather); err != nil {
		return nil, err
	}
	return &weather, nil
}
