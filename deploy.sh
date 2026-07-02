#!/bin/bash
# Script de Despliegue para VPS (Ubuntu/Debian)
# Dominio: encuesta.secarvajal.com

# 1. Variables
REPO_URL="https://github.com/carvajal7lsch-commits/encuestas"
DOMAIN="encuesta.secarvajal.com"
APP_DIR="/opt/modulo_crud"

echo "🚀 Iniciando despliegue de $DOMAIN..."

# 2. Actualizar sistema e instalar dependencias básicas
sudo apt-update
sudo apt-get install -y git curl nginx certbot python3-certbot-nginx

# 3. Instalar Docker y Docker Compose si no están instalados
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 4. Clonar o actualizar el repositorio
if [ -d "$APP_DIR" ]; then
    echo "📥 Actualizando código desde GitHub..."
    cd $APP_DIR
    sudo git pull origin main
else
    echo "📥 Clonando código desde GitHub..."
    sudo git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 5. Levantar contenedores con Docker Compose
echo "🏗️ Construyendo y levantando contenedores..."
sudo docker-compose up -d --build

# 6. Configurar Nginx (Reverse Proxy)
echo "🌐 Configurando Nginx para $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (puerto 80 del contenedor)
    location / {
        proxy_pass http://127.0.0.1:80/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API (puerto 3000 del contenedor)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Habilitar el sitio en Nginx
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Configurar SSL con Certbot (Let's Encrypt)
echo "🔒 Obteniendo certificado SSL..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@secarvajal.com --redirect

echo "✅ ¡Despliegue finalizado con éxito! Visita https://$DOMAIN"
