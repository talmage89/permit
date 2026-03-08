resource "neon_project" "staging" {
  name                      = var.neon_project_name
  region_id                 = "aws-us-east-2"
  history_retention_seconds = 21600
}

resource "neon_database" "permit" {
  project_id = neon_project.staging.id
  branch_id  = neon_project.staging.default_branch_id
  name       = "permit"
  owner_name = neon_role.permit.name
}

resource "neon_role" "permit" {
  project_id = neon_project.staging.id
  branch_id  = neon_project.staging.default_branch_id
  name       = "permit"
}
