package main

import (
	"embed"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	webview "github.com/webview/webview_go"
)

//go:embed static/index.html
var uiFS embed.FS

func main() {
	// Start local API proxy on a random available port
	port := "8899"
	go func() {
		http.HandleFunc("/", serveUI)
		http.HandleFunc("/api/", proxyAPI)
		http.ListenAndServe(":"+port, nil)
	}()

	time.Sleep(500 * time.Millisecond)

	w := webview.New(true)
	defer w.Destroy()
	w.SetTitle("Nimbus API Tester")
	w.SetSize(960, 700, webview.HintNone)
	w.Navigate(fmt.Sprintf("http://localhost:%s", port))
	w.Run()
}

func serveUI(w http.ResponseWriter, r *http.Request) {
	data, _ := uiFS.ReadFile("static/index.html")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func proxyAPI(w http.ResponseWriter, r *http.Request) {
	// Proxy requests to the live Nimbus API
	target := "https://nimbus-api-gxuc.onrender.com" + r.URL.Path
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery
	}

	// Validate the URL
	parsed, err := url.Parse(target)
	if err != nil {
		http.Error(w, "invalid url", http.StatusBadRequest)
		return
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		http.Error(w, "invalid scheme", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(target)
	if err != nil {
		http.Error(w, "request failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy headers
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.WriteHeader(resp.StatusCode)

	// Stream the response body
	buf := make([]byte, 32*1024)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			w.Write(buf[:n])
		}
		if err != nil {
			break
		}
	}
}

func isImageType(contentType string) bool {
	return strings.HasPrefix(contentType, "image/")
}
