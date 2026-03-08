output "backend_url" {
  description = "Cloud Run service URL (set as EXPO_PUBLIC_API_URL)"
  value       = google_cloud_run_v2_service.backend.uri
}

output "artifact_registry" {
  description = "Docker image registry path"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.backend.repository_id}"
}

output "database_host" {
  description = "Neon database host"
  value       = neon_project.staging.database_host
  sensitive   = true
}
