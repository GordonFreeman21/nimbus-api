package main

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

//go:embed static/index.html
var staticFS embed.FS

func main() {
	port := "8899"

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		data, _ := staticFS.ReadFile("static/index.html")
		w.Write(data)
	})

	// Open in default browser
	url := fmt.Sprintf("http://localhost:%s", port)
	openBrowser(url)

	fmt.Printf("☁️ Nimbus API Tester running at %s\n", url)
	fmt.Println("Close this terminal to exit.")

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Server failed: %v\n", err)
		os.Exit(1)
	}
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
