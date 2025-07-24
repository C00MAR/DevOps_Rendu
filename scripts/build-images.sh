#!/bin/bash

# Script pour builder toutes les images Docker
# Usage: ./scripts/build-images.sh [--push]

set -e

# Configuration
AWS_REGION="eu-west-1"
AWS_ACCOUNT_ID="135808930620"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLIENT_REPO="${ECR_REGISTRY}/todo-app/client"
SERVER_REPO="${ECR_REGISTRY}/todo-app/server"

# Obtenir le commit SHA pour le tag
COMMIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAG="${COMMIT_SHA}-${TIMESTAMP}"

# Vérifier qu'on est à la racine du projet
if [[ ! -d "client" || ! -d "server" ]]; then
    echo "❌ Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

echo "🔨 Building Docker images..."
echo "📦 Tag: ${TAG}"

# Builder l'image du client (React)
echo "📱 Building client image..."
docker build \
    --build-arg REACT_APP_API_URL=http://18.203.139.83:5001 \
    -t ${CLIENT_REPO}:${TAG} \
    -t ${CLIENT_REPO}:latest \
    -f client/Dockerfile \
    client/

echo "✅ Client image built: ${CLIENT_REPO}:${TAG}"

# Builder l'image du serveur (Node.js)
echo "🖥️  Building server image..."
docker build \
    -t ${SERVER_REPO}:${TAG} \
    -t ${SERVER_REPO}:latest \
    -f server/Dockerfile \
    server/

echo "✅ Server image built: ${SERVER_REPO}:${TAG}"

# Afficher la taille des images
echo ""
echo "📊 Taille des images:"
docker images | grep "todo-app" | head -4

# Si l'option --push est passée, pousser vers ECR
if [[ "$1" == "--push" || "$1" == "-p" ]]; then
    echo ""
    echo "📤 Pushing images to ECR..."
    
    # Login ECR
    echo "🔐 Login to ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # Push client
    echo "📱 Pushing client image..."
    docker push ${CLIENT_REPO}:${TAG}
    docker push ${CLIENT_REPO}:latest
    
    # Push server
    echo "🖥️  Pushing server image..."
    docker push ${SERVER_REPO}:${TAG}
    docker push ${SERVER_REPO}:latest
    
    echo "✅ Images pushed successfully!"
    echo ""
    echo "📋 Images disponibles dans ECR:"
    echo "   Client: ${CLIENT_REPO}:${TAG}"
    echo "   Server: ${SERVER_REPO}:${TAG}"
else
    echo ""
    echo "💡 Pour pousser vers ECR, utilisez: ./scripts/build-images.sh --push"
fi

echo ""
echo "🎉 Build terminé !"