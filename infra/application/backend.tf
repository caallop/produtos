
resource "azurerm_subnet" "appSubnet" {
  name                 = "${var.app_name}-appSubnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
  delegation {
    name = "${var.app_name}-dlg-app"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }

  depends_on = [ azurerm_virtual_network.vnet ]
}

# Service Plan
resource "azurerm_service_plan" "sp" {
  name                = "${var.app_name}-sp"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "B1"

  depends_on = [ azurerm_resource_group.rg ]

}

resource "azurerm_linux_web_app" "backend" {
  name                = var.app_name
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.sp.id

  site_config {    
    #linux_fx_version            = "NODE|22-lts"
    #use_32_bit_worker_process   = true
    #ftps_state                  = "FtpsOnly"
    #scm_type                    = "GitHubAction"
    #minimum_elastic_instance_count = 1
    #app_command_line            = "npm install\nnode index.js"
    #http20_enabled              = true
    #always_on                   = false
    #websockets_enabled          = false
  }

  virtual_network_subnet_id = azurerm_subnet.appSubnet.id

  #https_only = false
  depends_on = [ azurerm_subnet.appSubnet, azurerm_service_plan.sp ]
  
}