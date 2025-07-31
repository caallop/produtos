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
    storage_account_name = "tfstatejumpbox"
    container_name       = "tfstate"
    key                  = "tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  subscription_id = var.subscription_id
}

# Detecta IP público do executor
data "http" "my_ip" {
  url = "https://api.ipify.org"
  request_headers = {
    Accept = "text/plain"
  }
}

#Decide entre IP local e IP detectado
locals {
  defined_local_ip = var.local_ip != "" ? var.local_ip : data.http.my_ip.response_body
}

resource "azurerm_resource_group" "rg" {
  name      = "${var.app_name}-rg"
  location  = var.location
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${var.app_name}-vnet"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.1.0.0/16"]

  depends_on = [ azurerm_resource_group.rg ]

}

resource "azurerm_subnet" "subnet" {
  name                 = "${var.app_name}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.1.0.0/24"]

  depends_on = [ azurerm_virtual_network.vnet ]
}

resource "azurerm_network_security_group" "nsg" {
  name                = "${var.app_name}-security-group"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "Allow-SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "${local.defined_local_ip}/32"
    destination_address_prefix = "*"
  }

  depends_on = [azurerm_resource_group.rg]

}

resource "azurerm_public_ip" "pip" {
  name                = "${var.app_name}-public-ip"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"

  depends_on = [azurerm_resource_group.rg]

}

resource "azurerm_network_interface" "nic" {
  name                 = "${var.app_name}-jumpbox-network-interface"
  location             = azurerm_resource_group.rg.location
  resource_group_name  = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "ipconfig"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }

  depends_on = [azurerm_subnet.subnet, azurerm_public_ip.pip]

}

# Associa NSG à NIC
resource "azurerm_network_interface_security_group_association" "nic_nsg" {
  network_interface_id      = azurerm_network_interface.nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id

  depends_on = [ azurerm_network_interface.nic, azurerm_network_security_group.nsg ]
}

# SSH Key pública
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Jumpbox VM Linux para acesso
resource "azurerm_linux_virtual_machine" "vm" {
  name                = "${var.app_name}-vm"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  #size                = "Standard_B1ms"
  size                = "Standard_B1s"
  admin_username      = "azureuser"

  network_interface_ids = [azurerm_network_interface.nic.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = tls_private_key.ssh_key.public_key_openssh
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    name                 = "${var.app_name}-vm-osdisk"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts"
    version   = "latest"
  }

  depends_on = [ azurerm_resource_group.rg, azurerm_network_interface.nic ]
}

# Peering de Saída - VNet da JumpBox => Database
resource "azurerm_virtual_network_peering" "vnp_jump_db" {
  name                         = "${var.app_name}-vnp-to-database"
  resource_group_name          = azurerm_resource_group.rg.name
  virtual_network_name         = azurerm_virtual_network.vnet.name
  remote_virtual_network_id    = var.peering_database.vnet_id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true

  depends_on = [ azurerm_resource_group.rg, azurerm_virtual_network.vnet ]

}

# Peering de Entrada - VNet do Database => JumpBox 
resource "azurerm_virtual_network_peering" "vnp_db_jumpbox" {
  name                         = "${var.app_name}-from-database"
  resource_group_name          = var.peering_database.vnet_rg_name
  virtual_network_name         = var.peering_database.vnet_name
  remote_virtual_network_id    = azurerm_virtual_network.vnet.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true

  depends_on = [ azurerm_resource_group.rg, azurerm_virtual_network.vnet ]

}

# Vincula a zona DNS privada do banco à VNet da JumpBox
resource "azurerm_private_dns_zone_virtual_network_link" "mysql_dns_link" {
  name                   = "${var.app_name}-database-dns-link"
  resource_group_name    = var.peering_database.vnet_rg_name
  private_dns_zone_name  = var.peering_database.private_dns_zone_name
  virtual_network_id     = azurerm_virtual_network.vnet.id

  depends_on             = [azurerm_resource_group.rg, azurerm_virtual_network.vnet]

}