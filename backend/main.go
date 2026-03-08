package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"permit/backend/db"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Connect to database (optional at startup; handlers will fail gracefully if nil)
	database, err := db.Connect()
	if err != nil {
		log.Printf("Warning: database unavailable: %v", err)
	} else {
		log.Println("Connected to database")
		if err := db.Migrate(database); err != nil {
			log.Fatalf("Migration failed: %v", err)
		}
		log.Println("Database migrations applied")
	}

	_ = database // will be wired into router in Phase 3

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	log.Printf("Server listening on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
