package router

import (
	"database/sql"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"permit/backend/handlers"
)

func New(database *sql.DB) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	deviceHandler := &handlers.DeviceHandler{DB: database}
	childHandler := &handlers.ChildHandler{DB: database}
	groupHandler := &handlers.GroupHandler{DB: database}
	eventHandler := &handlers.EventHandler{DB: database}

	r.Get("/health", handlers.Health)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/devices", deviceHandler.Create)

		r.Route("/devices/{deviceId}", func(r chi.Router) {
			r.Put("/", deviceHandler.Update)
			r.Get("/children", childHandler.List)
			r.Post("/children", childHandler.Create)
			r.Put("/children/{childId}", childHandler.Update)
			r.Delete("/children/{childId}", childHandler.Delete)
			r.Get("/groups", groupHandler.ListForDevice)
		})

		r.Post("/groups", groupHandler.Create)
		r.Post("/groups/join", groupHandler.Join)
		r.Route("/groups/{groupId}", func(r chi.Router) {
			r.Get("/", groupHandler.Get)
			r.Get("/events", eventHandler.List)
			r.Post("/events", eventHandler.Create)
			r.Get("/events/{eventId}", eventHandler.Get)
			r.Put("/events/{eventId}", eventHandler.Update)
			r.Delete("/events/{eventId}", eventHandler.Delete)
		})
	})

	return r
}
