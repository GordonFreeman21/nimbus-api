package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	GeocodingAPIURL   string
	WeatherAPIURL     string
	UnsplashAccessKey string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using defaults or environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		Port:              port,
		GeocodingAPIURL:   "https://geocoding-api.open-meteo.com/v1/search",
		WeatherAPIURL:     "https://api.open-meteo.com/v1/forecast",
		UnsplashAccessKey: os.Getenv("UNSPLASH_ACCESS_KEY"),
	}
}
