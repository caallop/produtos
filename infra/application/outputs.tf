# VNet
output "vnet_info" {
  value = {
    id   = azurerm_virtual_network.vnet.id
    name = azurerm_virtual_network.vnet.name
    rg   = azurerm_virtual_network.vnet.resource_group_name
  }
}

output database_info {
  value = {
    id   = azurerm_mysql_flexible_server.mysql_server.id
    name = azurerm_mysql_flexible_server.mysql_server.name
    rg   = azurerm_mysql_flexible_server.mysql_server.resource_group_name
    private_dns = azurerm_private_dns_zone.db_private_dns_zone.name
    fqdn = azurerm_mysql_flexible_server.mysql_server.fqdn
    database_name = azurerm_mysql_flexible_database.mysqldb.name
  }
}

output database_credentials {
  value = {
    admin_user = azurerm_mysql_flexible_server.mysql_server.administrator_login
    admin_password = azurerm_mysql_flexible_server.mysql_server.administrator_password
  }
  sensitive = true
}

# output "gha_secret" {
#   value = azuread_service_principal_password.gha_sp_secret.value
#   sensitive = true
# }

# Backend com Container
output "container_app_url" {
  value = azurerm_container_app.api.latest_revision_fqdn
}

output "pipeline_credentials" {
  value = {
    # client_id     = azuread_application.pipeline_app.client_id
    # client_secret = azuread_service_principal_password.pipeline_sp_secret.value
    username = azurerm_container_registry.acr.admin_username
    password = azurerm_container_registry.acr.admin_password
    login_server = azurerm_container_registry.acr.login_server
  }
  sensitive = true
}

/*
# Frontend
output "frontend_url" {
  value = azurerm_static_site.frontend.default_hostname
}
*/