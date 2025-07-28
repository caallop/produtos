terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
  }

  required_version = ">= 1.4.0"
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.app_name
  location = var.location
}

# App Service Plan
resource "azurerm_app_service_plan" "asp" {
  name                = "${var.app_name}-asp"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "Linux"
  reserved            = true
  sku {
    tier     = "Basic"
    size     = "B1"
    capacity = 1
  }
}

# User Assigned Identity
resource "azurerm_user_assigned_identity" "oidc" {
  name                = "${var.app_name}-oidc"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "${var.app_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Subnet App
resource "azurerm_subnet" "appSubnet" {
  name                 = "${var.app_name}-appSubnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]

  delegation {
    name = "${var.app_name}-dlg-app"
    service_delegation {
      name    = "Microsoft.Web/serverfarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# Subnet DB
resource "azurerm_subnet" "dbSubnet" {
  name                 = "${var.app_name}-dbSubnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "${var.app_name}-dlg-database"
    service_delegation {
      name    = "Microsoft.DBforMySQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# Private DNS Zone
resource "azurerm_private_dns_zone" "db" {
  name                = "privatelink.${var.app_name}.database.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "dns_link" {
  name                  = "${var.app_name}-dns-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.db.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false
}

# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "mysql" {
  name                   = "${var.app_name}-mysql"
  location               = azurerm_resource_group.rg.location
  resource_group_name    = azurerm_resource_group.rg.name
  administrator_login    = var.db_admin_user
  administrator_password = var.db_admin_password
  sku_name               = "B1ms"
  version                = "8.0"

  storage {
    size_gb = 20
  }

  high_availability {
    mode = "Disabled"
  }

  network {
    delegated_subnet_id = azurerm_subnet.db.id
    private_dns_zone_id = azurerm_private_dns_zone.db.id
  }

  backup {
    backup_retention_days        = 7
    geo_redundant_backup_enabled = false
  }
}

resource "azurerm_static_site" "frontend" {
  name                = var.app_name
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  sku_size            = "Free"
  sku_tier            = "Free"
  repository_url      = "https://github.com/${var.github_org}/${var.app_name}"
  branch              = "main"

  build_properties {
    staging_environment_policy = "Enabled"
  }
}

resource "azurerm_static_site_basic_auth" "default" {
  name                 = "default"
  static_site_id       = azurerm_static_site.frontend.id
  environments_mode    = "SpecifiedEnvironments"
}


resource "azurerm_linux_web_app" "backend" {
  name                = var.app_name
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_app_service_plan.asp.id

  site_config {
    linux_fx_version            = "NODE|22-lts"
    #use_32_bit_worker_process   = true
    ftps_state                  = "FtpsOnly"
    scm_type                    = "GitHubAction"
    #minimum_elastic_instance_count = 1
    #app_command_line            = "npm install\nnode index.js"
    #http20_enabled              = true
    always_on                   = false
    websockets_enabled          = false
  }

  app_settings = {
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITE_NODE_DEFAULT_VERSION        = "22-lts"
  }

  virtual_network_subnet_id = azurerm_subnet.appSubnet.id

  https_only = false
}

resource "azurerm_app_service_virtual_network_swift_connection" "vnet_integration" {
  app_service_id = azurerm_linux_web_app.backend.id
  subnet_id      = azurerm_subnet.appSubnet.id
}

resource "azurerm_app_service_basic_authentication_policy" "ftp" {
  site_name           = azurerm_linux_web_app.backend.name
  resource_group_name = var.resource_group_name
  authentication_name = "ftp"
  enabled             = true
}

resource "azurerm_app_service_basic_authentication_policy" "scm" {
  site_name           = azurerm_linux_web_app.backend.name
  resource_group_name = var.resource_group_name
  authentication_name = "scm"
  enabled             = true
}
