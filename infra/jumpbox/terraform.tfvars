subscription_id       = "d5f4ef77-c287-4203-bc4e-c987c1587b86"
#location              = "brazilsouth"
location              = "canadacentral"

peering_database      = {
                          vnet_name           = "produto-vnet"
                          vnet_id            = "/subscriptions/d5f4ef77-c287-4203-bc4e-c987c1587b86/resourceGroups/produto/providers/Microsoft.Network/virtualNetworks/produto-vnet"
                          vnet_rg_name       = "produto"
                          private_dns_zone_name = "produto.mysql.database.azure.com"
                        }