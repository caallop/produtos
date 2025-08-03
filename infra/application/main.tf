# Terraform Configuration
terraform {
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.37.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform"
    storage_account_name = "tfstateproduto"
    container_name       = "tfstate"
    key                  = "tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}


# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.app_name
  location = var.location
}

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.app_name}-vnet"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/16"]

  depends_on = [ azurerm_resource_group.rg ]
  
}