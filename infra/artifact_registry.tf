resource "google_artifact_registry_repository" "backend" {
  location      = var.gcp_region
  repository_id = "permit"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-latest-3"
    action = "KEEP"

    most_recent_versions {
      package_name_prefixes = ["backend"]
      keep_count            = 3
    }
  }

  cleanup_policies {
    id     = "delete-old"
    action = "DELETE"

    condition {
      older_than = "604800s" # 7 days
    }
  }
}
