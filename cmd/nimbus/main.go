package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gordonfreeman21/nimbus-api/internal/config"
	handlers "github.com/gordonfreeman21/nimbus-api/internal/handler"
	"github.com/gordonfreeman21/nimbus-api/internal/middleware"
	"github.com/gordonfreeman21/nimbus-api/internal/services"
)

func main() {
	// Load config
	cfg := config.Load()

	// Init services and handlers
	weatherSvc := services.NewWeatherService(cfg.GeocodingAPIURL, cfg.WeatherAPIURL)
	weatherHandler := handlers.NewWeatherHandler(weatherSvc)

	// Set up router with Go 1.22+ method + path routing
	mux := http.NewServeMux()

	// Species Taxonomy Endpoint (Biology)
	speciesSvc := services.NewSpeciesService()
	speciesHandler := handlers.NewSpeciesHandler(speciesSvc)

	// Screenshot Endpoint (Utility)
	screenshotSvc := services.NewScreenshotService()
	screenshotHandler := handlers.NewScreenshotHandler(screenshotSvc)

	// Weather Endpoint
	mux.HandleFunc("GET /api/v1/weather", weatherHandler.GetCurrentWeather)

	// Species Taxonomy Endpoint
	mux.HandleFunc("GET /api/v1/bio/species", speciesHandler.GetSpeciesTaxonomy)

	// Screenshot Endpoint
	mux.HandleFunc("GET /api/v1/screenshot", screenshotHandler.CaptureScreenshot)

	// Email Endpoint
	mux.HandleFunc("GET /api/v1/email", handlers.SendEmail)

	// Health Check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Apply middleware: CORS outermost so preflights and error paths get headers
	handler := middleware.CORS(middleware.CloudLogger(mux))

	// Server setup
	port := ":" + cfg.Port
	srv := &http.Server{
		Addr:         port,
		Handler:      handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	// Cloud-themed startup logs
	log.Printf("☁️  NimbusAPI starting on port %s", port)
	log.Printf("🌤️  Weather endpoint:     GET /api/v1/weather?city=Berlin")
	log.Printf("🧬 Species endpoint:     GET /api/v1/bio/species?name=Blue+Whale")
	log.Printf("📸 Screenshot endpoint:  GET /api/v1/screenshot?url=https://example.com")
	log.Printf("📧 Email endpoint:       GET /api/v1/email?to=user@example.com&subject=Hi&body=Hello")
	log.Printf("✅ Health check:         GET /health")

	// Run server in goroutine
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	log.Println("☁️  Shutting down NimbusAPI...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Graceful shutdown failed: %v", err)
	}
	log.Println("🌧️  Goodbye from Nimbus.")
}
