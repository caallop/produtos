variable "app_name" {
  type = string
}

variable "location" {
  type        = string
  description = "Região da Azure"
  default     = "East US 2"
}

variable "db_admin_user" {
  type        = string
  description = "Usuário administrador do MySQL"
}

variable "db_admin_password" {
  type        = string
  description = "Senha do MySQL"
  sensitive   = true
}

variable "github_org" {
  type        = string
  description = "Organização ou usuário do GitHub onde está o repositório"
}

