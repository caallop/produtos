# resource "azuread_application" "pipeline_app" {
#   display_name = "${var.app_name}-pipeline"
# }

# resource "azuread_service_principal" "pipeline_sp" {
#   client_id = azuread_application.pipeline_app.client_id
# }

# resource "azuread_service_principal_password" "pipeline_sp_secret" {
#   service_principal_id = azuread_service_principal.pipeline_sp.id
#   end_date             = "2099-12-31T23:59:59Z"
# }

# resource "azurerm_role_assignment" "acr_push" {
#   principal_id         = azuread_service_principal.pipeline_sp.id
#   role_definition_name = "AcrPush"
#   scope                = azurerm_container_registry.acr.id
# }

resource "azurerm_container_registry" "acr" {
  name                = "${var.app_name}acr"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "law" {
  name                = "${var.app_name}-law"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_subnet" "appSubnet" {
  name                 = "${var.app_name}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.4.0/23"]
  # delegation {
  #   name = "containerappdelegation"
  #   service_delegation {
  #     name = "Microsoft.App/environments"
  #     actions = [
  #       "Microsoft.Network/virtualNetworks/subnets/join/action",
  #     ]
  #   }
  # }
}

resource "azurerm_container_app_environment" "env" {
  name                       = "${var.app_name}-env"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id
  infrastructure_subnet_id   = azurerm_subnet.appSubnet.id
}

resource "azurerm_container_app" "api" {
  name                         = "${var.app_name}-api"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  ingress {
    external_enabled = true
    target_port      = var.app_port
    transport        = "auto"
    traffic_weight {
      percentage = 100
      latest_revision = true
    }
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  template {
    container {
      name   = "node-api"
      image  = "${azurerm_container_registry.acr.login_server}/${var.app_name}-api:latest"
      cpu    = 0.5
      memory = "1.0Gi"
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "MYSQL_HOST"
        value = azurerm_private_dns_zone.db_private_dns_zone.name
      }
      env {
        name  = "MYSQL_DATABASE"
        value = azurerm_mysql_flexible_database.mysqldb.name
      }
      env {
        name  = "MYSQL_USER"
        value = azurerm_mysql_flexible_server.mysql_server.administrator_login
      }
      env {
        name  = "MYSQL_PASSWORD"
        value = azurerm_mysql_flexible_server.mysql_server.administrator_password
      }
      env {
        name  = "MYSQL_SSL"
        value = azurerm_mysql_flexible_server.mysql_server.administrator_password
      }
      env {
        name  = "APP_PORT"
        value = var.app_port
      }
    }
  }
}