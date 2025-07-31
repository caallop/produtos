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
  }
}

output database_credentials {
  value = {
    admin_user = azurerm_mysql_flexible_server.mysql_server.administrator_login
    admin_password = azurerm_mysql_flexible_server.mysql_server.administrator_password
  }
  sensitive = true
}

# Backend
output "service_plan_id" {
  value = azurerm_service_plan.sp.id
}

output "backend_url" {
  value = azurerm_linux_web_app.backend.default_hostname
}


/*
# Frontend
output "frontend_url" {
  value = azurerm_static_site.frontend.default_hostname
}
*/