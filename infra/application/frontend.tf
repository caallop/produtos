# resource "azurerm_static_web_app" "frontend" {
#   name                = var.app_name
#   resource_group_name = azurerm_resource_group.rg.name
#   location            = azurerm_resource_group.rg.location
#   sku_tier            = "Free"

#   #repository_url      = "https://github.com/minha-org/meu-repo"
#   #branch              = "main"
#   #build_properties {
#   #  app_location     = "/"
#   #  output_location  = "dist"
#   #}

#   identity {
#     type = "SystemAssigned"
#   }
# }



# resource "azurerm_static_site" "frontend" {
#   name                = var.app_name
#   location            = var.location
#   resource_group_name = azurerm_resource_group.rg.name
#   sku_size            = "Free"
#   sku_tier            = "Free"
#   #repository_url      = "https://github.com/${var.github_org}/${var.app_name}"
#   #branch              = "main"

#   #build_properties {
#   #  staging_environment_policy = "Enabled"
#   #}
# }

/*

resource "azurerm_static_site_basic_auth" "default" {
  name                 = "default"
  static_site_id       = azurerm_static_site.frontend.id
  environments_mode    = "SpecifiedEnvironments"
}


# User Assigned Identity
resource "azurerm_user_assigned_identity" "oidc" {
  name                = "${var.app_name}-oidc"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
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

*/