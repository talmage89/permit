resource "google_service_account" "backend" {
  account_id   = "permit-staging-backend"
  display_name = "Permit Staging Backend"
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "permit-staging"
  location = var.gcp_region

  template {
    service_account = google_service_account.backend.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      env {
        name  = "DATABASE_URL"
        value = "postgres://${neon_role.permit.name}:${neon_role.permit.password}@${neon_project.staging.database_host}/${neon_database.permit.name}?sslmode=require"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}

# Allow unauthenticated access (public API)
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = google_cloud_run_v2_service.backend.project
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
