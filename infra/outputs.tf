output "app_service_plan_id" {
  value = azurerm_app_service_plan.asp.id
}

output "db_fqdn" {
  value = azurerm_mysql_flexible_server.mysql.fqdn
}

output "db_private_dns" {
  value = azurerm_private_dns_zone.mysql.name
}

output "frontend_url" {
  value = azurerm_static_site.frontend.default_hostname
}

output "backend_url" {
  value = azurerm_linux_web_app.backend.default_hostname
}