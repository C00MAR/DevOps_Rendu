#!/bin/bash

# Script pour lancer l'environnement de développement local
# Usage: ./scripts/dev-start.sh

set -e

echo "🚀 Démarrage de l'environnement de développement Todo App..."

# Vérifier que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez le démarrer."
    exit 1
fi

# Vérifier que docker compose est disponible
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible. Veuillez l'installer d'abord."
    exit 1
fi

# Nettoyer les containers précédents si nécessaire
echo "🧹 Nettoyage des containers précédents..."
docker compose down --remove-orphans

# Reconstruire les images si demandé
if [[ "$1" == "--build" || "$1" == "-b" ]]; then
    echo "🔨 Reconstruction des images Docker..."
    docker compose build --no-cache
fi

# Démarrer tous les services
echo "📦 Démarrage des services..."
docker compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 10

# Vérifier la santé des services
echo "🔍 Vérification de la santé des services..."

# Vérifier DynamoDB
if curl -f http://localhost:8000 &> /dev/null; then
    echo "✅ DynamoDB Local: OK"
else
    echo "❌ DynamoDB Local: KO"
fi

# Vérifier Backend
if curl -f http://localhost:5001/health &> /dev/null; then
    echo "✅ Backend API: OK"
else
    echo "⚠️  Backend API: En cours de démarrage..."
fi

# Vérifier Frontend
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend React: OK"
else
    echo "⚠️  Frontend React: En cours de démarrage..."
fi

# Afficher les logs en temps réel
echo ""
echo "🎉 Environnement de développement démarré !"
echo ""
echo "📱 URLs disponibles :"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:5001"
echo "   DynamoDB:     http://localhost:8000"
echo "   DynamoDB UI:  http://localhost:8001"
echo ""
echo "📋 Commandes utiles :"
echo "   Voir les logs:        docker compose logs -f"
echo "   Arrêter les services: docker compose down"
echo "   Redémarrer:           docker compose restart"
echo ""
echo "👀 Affichage des logs (Ctrl+C pour quitter):"

# Suivre les logs
docker compose logs -f