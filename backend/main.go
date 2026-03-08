package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"permit/backend/db"
	"permit/backend/notifications"
	"permit/backend/router"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	conn, err := db.Connect()
	if err != nil {
		log.Fatalf("Database unavailable: %v", err)
	}
	log.Println("Connected to database")
	if err := db.Migrate(conn); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("Database migrations applied")
	database := conn

	fcm := notifications.NewFCMClient()
	r := router.New(database, fcm)

	log.Printf("Server listening on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
