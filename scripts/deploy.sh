#!/bin/bash

# Fanpit Backend Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="fanpit-backend"
DOCKER_IMAGE="fanpit-backend"
DOCKER_TAG="latest"
COMPOSE_FILE="docker-compose.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env.production file exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found. Please create it with your production environment variables."
        exit 1
    fi

    # Check if required environment variables are set
    required_vars=("MONGODB_URI" "JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET" "RAZORPAY_KEY_ID" "RAZORPAY_KEY_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.production; then
            log_error "Required environment variable ${var} is not set in .env.production"
            exit 1
        fi
    done

    log_success "Pre-deployment checks passed"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."

    if docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# Deploy with Docker Compose
deploy_with_compose() {
    log_info "Deploying with Docker Compose..."

    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f ${COMPOSE_FILE} down || true

    # Start services
    log_info "Starting services..."
    if docker-compose -f ${COMPOSE_FILE} up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
}

# Health checks
health_checks() {
    log_info "Running health checks..."

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30

    # Check backend health
    max_attempts=10
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt ${attempt}/${max_attempts}..."

        if curl -f http://localhost:3001/api/v1/health &>/dev/null; then
            log_success "Backend health check passed"
            break
        else
            log_warning "Backend health check failed, retrying in 10 seconds..."
            sleep 10
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Backend health check failed after ${max_attempts} attempts"
        log_info "Checking container logs..."
        docker-compose -f ${COMPOSE_FILE} logs app
        exit 1
    fi

    # Check MongoDB health
    if docker-compose -f ${COMPOSE_FILE} exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
        log_success "MongoDB health check passed"
    else
        log_warning "MongoDB health check failed"
    fi

    # Check Redis health
    if docker-compose -f ${COMPOSE_FILE} exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis health check passed"
    else
        log_warning "Redis health check failed"
    fi
}

# Database setup
setup_database() {
    log_info "Setting up database..."

    # Run database migrations/seeds if they exist
    if [ -f "src/database/migrations/migrate.ts" ]; then
        log_info "Running database migrations..."
        docker-compose -f ${COMPOSE_FILE} exec -T app npm run db:migrate || log_warning "Database migration failed"
    fi

    if [ -f "src/database/seeds/seed.ts" ]; then
        log_info "Running database seeds..."
        docker-compose -f ${COMPOSE_FILE} exec -T app npm run db:seed || log_warning "Database seeding failed"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."

    # Remove dangling images
    docker image prune -f || true

    # Remove unused volumes
    docker volume prune -f || true

    log_success "Cleanup completed"
}

# Show deployment info
show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Information:"
    echo "🌐 API URL: http://localhost:3001"
    echo "📚 Swagger Docs: http://localhost:3001/api/docs"
    echo "🏥 Health Check: http://localhost:3001/api/v1/health"
    echo ""
    echo "🐳 Docker Services:"
    docker-compose -f ${COMPOSE_FILE} ps
    echo ""
    echo "📝 Useful Commands:"
    echo "  View logs: docker-compose -f ${COMPOSE_FILE} logs -f"
    echo "  Stop services: docker-compose -f ${COMPOSE_FILE} down"
    echo "  Restart services: docker-compose -f ${COMPOSE_FILE} restart"
    echo "  Scale services: docker-compose -f ${COMPOSE_FILE} up -d --scale app=3"
}

# Rollback function
rollback() {
    log_error "Deployment failed. Rolling back..."

    # Stop services
    docker-compose -f ${COMPOSE_FILE} down || true

    # Start previous version if it exists
    if docker image inspect ${DOCKER_IMAGE}:previous &>/dev/null; then
        log_info "Starting previous version..."
        DOCKER_TAG="previous" deploy_with_compose
    else
        log_warning "No previous version found to rollback to"
    fi

    exit 1
}

# Main deployment process
main() {
    log_info "Starting Fanpit Backend deployment..."

    # Trap errors for rollback
    trap rollback ERR

    # Run deployment steps
    pre_deployment_checks
    build_docker_image
    deploy_with_compose
    health_checks
    setup_database
    cleanup
    show_deployment_info

    log_success "🎉 Fanpit Backend deployed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        log_info "Rolling back to previous version..."
        rollback
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose -f ${COMPOSE_FILE} down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose -f ${COMPOSE_FILE} restart
        log_success "Services restarted"
        ;;
    "logs")
        log_info "Showing service logs..."
        docker-compose -f ${COMPOSE_FILE} logs -f
        ;;
    "status")
        log_info "Service status:"
        docker-compose -f ${COMPOSE_FILE} ps
        ;;
    *)
        main
        ;;
esac
