package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"permit/backend/db"
	"permit/backend/router"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	var database *sql.DB
	conn, err := db.Connect()
	if err != nil {
		log.Printf("Warning: database unavailable: %v", err)
	} else {
		log.Println("Connected to database")
		if err := db.Migrate(conn); err != nil {
			log.Fatalf("Migration failed: %v", err)
		}
		log.Println("Database migrations applied")
		database = conn
	}

	r := router.New(database)

	log.Printf("Server listening on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
