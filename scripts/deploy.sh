#!/bin/bash

# Script pour déployer l'application sur l'instance EC2
# Usage: ./scripts/deploy.sh

set -e

# Configuration
EC2_HOST="34.243.109.207"
EC2_USER="ec2-user"
KEY_PATH="${HOME}/.ssh/todo-app-key.pem"
APP_DIR="/home/ec2-user/todo-app"

echo "🚀 Déploiement de l'application Todo sur l'instance EC2..."

# Vérifier que la clé SSH existe
if [[ ! -f "$KEY_PATH" ]]; then
    echo "❌ Clé SSH non trouvée: $KEY_PATH"
    echo "💡 Veuillez ajuster le chemin dans le script ou copier la clé au bon endroit."
    exit 1
fi

# Vérifier les permissions de la clé
chmod 400 "$KEY_PATH"

# Fonction pour exécuter des commandes sur l'instance EC2
ssh_exec() {
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$1"
}

# Fonction pour copier des fichiers vers l'instance EC2
scp_copy() {
    scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r "$1" "$EC2_USER@$EC2_HOST:$2"
}

echo "🔍 Vérification de la connexion SSH..."
if ! ssh_exec "echo 'SSH OK'"; then
    echo "❌ Impossible de se connecter à l'instance EC2"
    exit 1
fi

echo "✅ Connexion SSH établie"

# Créer le répertoire de l'application
echo "📁 Création du répertoire de l'application..."
ssh_exec "mkdir -p $APP_DIR"

# Copier les fichiers docker-compose et configuration
echo "📋 Copie des fichiers de configuration..."
scp_copy "docker-compose.prod.yml" "$APP_DIR/docker-compose.yml"

# Si nginx.conf existe, le copier aussi
if [[ -f "nginx.conf" ]]; then
    scp_copy "nginx.conf" "$APP_DIR/"
fi

# Copier les scripts utilitaires
echo "🛠️  Copie des scripts..."
ssh_exec "mkdir -p $APP_DIR/scripts"
scp_copy "scripts/" "$APP_DIR/"

# Rendre les scripts exécutables
ssh_exec "chmod +x $APP_DIR/scripts/*.sh"

# Login ECR sur l'instance
echo "🔐 Login ECR sur l'instance..."
ssh_exec "aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 135808930620.dkr.ecr.eu-west-1.amazonaws.com"

# Arrêter les services existants
echo "⏹️  Arrêt des services existants..."
ssh_exec "cd $APP_DIR && docker-compose down || true"

# Récupérer les dernières images
echo "📥 Récupération des dernières images..."
ssh_exec "cd $APP_DIR && docker-compose pull"

# Démarrer les services
echo "▶️  Démarrage des services..."
ssh_exec "cd $APP_DIR && docker-compose up -d"

# Attendre que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 15

# Vérifier la santé des services
echo "🔍 Vérification de la santé des services..."

# Vérifier le backend
if ssh_exec "curl -f http://localhost:5001/health"; then
    echo "✅ Backend API: OK"
else
    echo "⚠️  Backend API: Problème détecté"
    ssh_exec "cd $APP_DIR && docker-compose logs server"
fi

# Vérifier le frontend
if ssh_exec "curl -f http://localhost:80"; then
    echo "✅ Frontend: OK"
else
    echo "⚠️  Frontend: Problème détecté"
    ssh_exec "cd $APP_DIR && docker-compose logs client"
fi

echo ""
echo "🎉 Déploiement terminé !"
echo ""
echo "📱 URLs de l'application :"
echo "   Frontend: http://$EC2_HOST"
echo "   Backend:  http://$EC2_HOST:5001"
echo ""
echo "📋 Commandes utiles sur l'instance :"
echo "   SSH:          ssh -i $KEY_PATH $EC2_USER@$EC2_HOST"
echo "   Logs:         cd $APP_DIR && docker-compose logs -f"
echo "   Redémarrer:   cd $APP_DIR && docker-compose restart"
echo "   Arrêter:      cd $APP_DIR && docker-compose down"