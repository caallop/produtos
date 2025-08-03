# Generate random value for names. This should be used for the MySQL admin login.
resource "random_string" "name" {
  length  = 8
  lower   = true
  numeric = false
  special = false
  upper   = false
}

# Generate random value for the login password
resource "random_password" "password_db" {
  length           = 8
  lower            = true
  min_lower        = 1
  min_numeric      = 1
  min_special      = 1
  min_upper        = 1
  numeric          = true
  override_special = "_"
  special          = true
  upper            = true
}

## MySQL Flexible Server Configuration

#Subnet for MySQL Flexible Server
resource "azurerm_subnet" "dbSubnet" {
  name                 = "${var.app_name}-dbSubnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
  service_endpoints    = ["Microsoft.Storage"]

  delegation {
    name = "${var.app_name}-dlg-database"
    service_delegation {
      name    = "Microsoft.DBforMySQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Private DNS Zone
resource "azurerm_private_dns_zone" "db_private_dns_zone" {
  name                = "${var.app_name}.mysql.database.azure.com"
  resource_group_name = azurerm_resource_group.rg.name

  depends_on          = [ azurerm_virtual_network.vnet ]

}

# Network Link for Private DNS Zone
resource "azurerm_private_dns_zone_virtual_network_link" "database_network_link" {
  name                  = "${var.app_name}-database-network-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.db_private_dns_zone.name
  virtual_network_id    = azurerm_virtual_network.vnet.id

  depends_on            = [azurerm_subnet.dbSubnet]

}


# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "mysql_server" {
  name                    = "${var.app_name}-mysql-server"
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name

  administrator_login     = random_string.name.result
  administrator_password  = random_password.password_db.result

  delegated_subnet_id     = azurerm_subnet.dbSubnet.id
  private_dns_zone_id     = azurerm_private_dns_zone.db_private_dns_zone.id

  sku_name               = "B_Standard_B1ms"
  version                = "8.0.21"

  backup_retention_days  = 7
  storage {
    size_gb = 20
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.database_network_link]

}

# Manages the MySQL Flexible Server Database
resource "azurerm_mysql_flexible_database" "mysqldb" {
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
  name                = "${var.app_name}-db"
  resource_group_name = azurerm_resource_group.rg.name
  server_name         = azurerm_mysql_flexible_server.mysql_server.name

  depends_on          = [azurerm_mysql_flexible_server.mysql_server]

}