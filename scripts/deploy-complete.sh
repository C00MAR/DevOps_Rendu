#!/bin/bash

# Script de déploiement complet avec CloudWatch
# Usage: ./scripts/deploy-complete.sh

set -e

# Configuration
AWS_REGION="eu-west-1"
AWS_ACCOUNT_ID="135808930620"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
EC2_HOST="3.251.78.158"
EC2_USER="ec2-user"
KEY_PATH="${HOME}/.ssh/todo-app-key.pem"
APP_DIR="/home/ec2-user/todo-app"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour exécuter des commandes sur l'instance EC2
ssh_exec() {
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$1"
}

# Fonction pour copier des fichiers vers l'instance EC2
scp_copy() {
    scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r "$1" "$EC2_USER@$EC2_HOST:$2"
}

echo "🚀 Déploiement complet Todo App avec CloudWatch"
echo "=============================================="

# Étape 1 : Vérifications préalables
log_info "Vérification des prérequis..."

# Vérifier que Terraform est installé
if ! command -v terraform &> /dev/null; then
    log_error "Terraform n'est pas installé"
    exit 1
fi

# Vérifier que AWS CLI est installé et configuré
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS CLI n'est pas configuré correctement"
    exit 1
fi

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé"
    exit 1
fi

# Vérifier que la clé SSH existe
if [[ ! -f "$KEY_PATH" ]]; then
    log_error "Clé SSH non trouvée: $KEY_PATH"
    exit 1
fi

log_success "Tous les prérequis sont satisfaits"

# Étape 2 : Appliquer l'infrastructure Terraform
log_info "Application de l'infrastructure Terraform..."
cd infrastructure

# Initialiser Terraform si nécessaire
if [[ ! -d ".terraform" ]]; then
    terraform init
fi

# Planifier les changements
terraform plan -out=tfplan

# Demander confirmation
read -p "Voulez-vous appliquer ces changements Terraform ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply tfplan
    log_success "Infrastructure Terraform appliquée"
else
    log_warning "Application Terraform annulée"
    exit 1
fi

cd ..

# Étape 3 : Build et push des images Docker
log_info "Build et push des images Docker..."

# Obtenir le commit SHA pour le tag
COMMIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="${COMMIT_SHA}-${TIMESTAMP}"

log_info "Tag des images: $TAG"

# Login ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build client
log_info "Build de l'image client..."
docker build \
    --build-arg REACT_APP_API_URL=http://${EC2_HOST}:5001 \
    -t ${ECR_REGISTRY}/todo-app/client:${TAG} \
    -t ${ECR_REGISTRY}/todo-app/client:latest \
    -f client/Dockerfile \
    client/

# Build server
log_info "Build de l'image server..."
docker build \
    -t ${ECR_REGISTRY}/todo-app/server:${TAG} \
    -t ${ECR_REGISTRY}/todo-app/server:latest \
    -f server/Dockerfile \
    server/

# Push images
log_info "Push des images vers ECR..."
docker push ${ECR_REGISTRY}/todo-app/client:${TAG}
docker push ${ECR_REGISTRY}/todo-app/client:latest
docker push ${ECR_REGISTRY}/todo-app/server:${TAG}
docker push ${ECR_REGISTRY}/todo-app/server:latest

log_success "Images Docker buildées et pushées"

# Étape 4 : Préparer les fichiers de configuration
log_info "Préparation des fichiers de configuration..."

# Créer le middleware de métriques si nécessaire
mkdir -p server/src/middleware

# Étape 5 : Déployer sur EC2
log_info "Déploiement sur l'instance EC2..."

# Vérifier la connexion SSH
if ! ssh_exec "echo 'SSH OK'" &> /dev/null; then
    log_error "Impossible de se connecter à l'instance EC2"
    exit 1
fi

log_success "Connexion SSH établie"

# Créer les répertoires nécessaires
ssh_exec "mkdir -p $APP_DIR"

# Copier les fichiers de configuration
log_info "Copie des fichiers de configuration..."
scp_copy "docker-compose.prod.yml" "$APP_DIR/docker-compose.yml"
scp_copy "cloudwatch-config.json" "$APP_DIR/"

# Copier les scripts
ssh_exec "mkdir -p $APP_DIR/scripts"
scp_copy "scripts/" "$APP_DIR/"
ssh_exec "chmod +x $APP_DIR/scripts/*.sh"

# Déploiement sur l'instance
log_info "Exécution du déploiement sur l'instance..."
ssh_exec "
    cd $APP_DIR
    
    # Login ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    
    # Arrêter les services existants
    docker-compose down || true
    
    # Nettoyer les anciennes images
    docker image prune -f
    
    # Récupérer les nouvelles images
    docker-compose pull
    
    # Démarrer les services
    docker-compose up -d
    
    # Attendre que les services soient prêts
    sleep 20
    
    echo '📊 Statut des conteneurs:'
    docker-compose ps
"

# Étape 6 : Tests de santé
log_info "Tests de santé de l'application..."
sleep 30

# Test de l'API
if curl -f http://$EC2_HOST:5001/health &> /dev/null; then
    log_success "API de santé: OK"
else
    log_error "API de santé: KO"
    ssh_exec "cd $APP_DIR && docker-compose logs server"
fi

# Test du frontend
if curl -f http://$EC2_HOST &> /dev/null; then
    log_success "Frontend: OK"
else
    log_warning "Frontend: Problème détecté"
    ssh_exec "cd $APP_DIR && docker-compose logs client"
fi

# Test des métriques
if curl -f http://$EC2_HOST:5001/metrics &> /dev/null; then
    log_success "Endpoint métriques: OK"
else
    log_warning "Endpoint métriques: Problème détecté"
fi

# Étape 7 : Affichage des URLs
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo "=================================="
echo ""
echo "📱 URLs de l'application:"
echo "   Frontend: http://$EC2_HOST"
echo "   API: http://$EC2_HOST:5001"
echo "   Health Check: http://$EC2_HOST:5001/health"
echo "   Métriques: http://$EC2_HOST:5001/metrics"
echo ""
echo "📊 Monitoring (URLs à obtenir via terraform output):"
echo "   CloudWatch Dashboard: (voir terraform output monitoring_urls)"
echo "   CloudWatch Logs: (voir terraform output monitoring_urls)"
echo "   CloudWatch Alarms: (voir terraform output monitoring_urls)"
echo ""
echo "🔧 Commandes utiles:"
echo "   SSH: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST"
echo "   Logs: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'cd $APP_DIR && docker-compose logs -f'"
echo "   Redémarrer: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'cd $APP_DIR && docker-compose restart'"
echo ""

# Afficher les URLs CloudWatch
if command -v terraform &> /dev/null; then
    echo "📊 URLs CloudWatch:"
    cd infrastructure
    terraform output monitoring_urls 2>/dev/null || echo "   (Utilisez 'terraform output monitoring_urls' dans le dossier infrastructure)"
    cd ..
fi

echo ""
log_success "Déploiement complet terminé! 🎉"
