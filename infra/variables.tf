variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for Cloud Run and Artifact Registry"
  type        = string
  default     = "us-west1"
}

variable "neon_api_key" {
  description = "Neon API key"
  type        = string
  sensitive   = true
}

variable "neon_project_name" {
  description = "Neon project name"
  type        = string
  default     = "permit-staging"
}

variable "backend_image" {
  description = "Full container image path (e.g. us-central1-docker.pkg.dev/my-project/permit/backend:latest)"
  type        = string
}
