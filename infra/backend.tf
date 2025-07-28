terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "tfstateaccountprod"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}