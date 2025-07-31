output "ssh_private_key_pem" {
  description = "Chave privada PEM para acesso à JumpBox"
  value       = tls_private_key.ssh_key.private_key_pem
  sensitive   = true
}

output "jumpbox_ip" {
  description = "IP público da JumpBox (se criada)"
  value       = azurerm_public_ip.pip.ip_address
}