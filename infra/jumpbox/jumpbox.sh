#!/bin/bash

set -e

echo "⚙️  Extraindo chave SSH privada do Terraform..."
terraform output -raw "ssh_private_key_pem" > ./jumpbox.pem
chmod 600 ./jumpbox.pem
echo "✅ Chave salva como ./jumpbox.pem"

echo "🌐 Buscando IP da JumpBox..."
JUMPBOX_IP=$(terraform output -raw "jumpbox_ip")

echo "🔐 Estabelecendo túnel SSH: localhost:3306 -> $1:3306 via $JUMPBOX_IP"
echo

ssh -i ./jumpbox.pem azureuser@"$JUMPBOX_IP" -L 3306:"$1":3306
