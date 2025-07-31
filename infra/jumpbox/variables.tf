variable "app_name" {
  type        = string
  description = "Nome do aplicativo, usado para nomear recursos"
  default     = "jumpbox"
}

variable "subscription_id" {
  type = string
  default = "d5f4ef77-c287-4203-bc4e-c987c1587b86"
  description = "ID da assinatura do Azure onde os recursos serão criados"
}

variable "location" {
  type        = string
  description = "Região da Azure"
  default     = "brazilsouth"
}

variable "local_ip" {
  type        = string
  description = "Endereço IP local para acesso à JumpBox"
  default     = ""
}

variable "peering_database" {
  description = "Dados de peering para a VNet onde está o banco de dados"
  type = object({
    vnet_name                = string
    vnet_rg_name             = string
    vnet_id                  = string
    private_dns_zone_name    = string
  })
}