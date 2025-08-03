variable "app_name" {
  type = string
}

variable "app_port" {
  type = number
}

variable "subscription_id" {
  type = string
}

variable "location" {
  type        = string
  description = "Região da Azure"
  default     = "East US 2"
}