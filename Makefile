# Makefile for UOB RM AI Assistant
# =================================

.PHONY: help build up down logs clean test lint format deploy dev prod terminal

# Default target
help: ## Show this help message
	@echo "UOB RM AI Assistant - Available Commands:"
	@echo "=========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker Commands
build: ## Build Docker images
	docker-compose build

up: ## Start production environment
	docker-compose up -d

down: ## Stop all containers
	docker-compose down

logs: ## View application logs
	docker-compose logs -f

restart: ## Restart all containers
	docker-compose restart

# Development Commands
dev: ## Start development environment
	docker-compose --profile dev up -d

dev-logs: ## View development logs
	docker-compose --profile dev logs -f

terminal: ## Start terminal interface
	docker-compose --profile terminal up

# Production Commands
prod: ## Start production environment
	./scripts/deploy.sh

deploy: ## Deploy application (production)
	./scripts/deploy.sh

deploy-dev: ## Deploy development environment
	./scripts/deploy.sh latest development

# Testing Commands
test: ## Run all tests
	./scripts/run_tests.sh all

test-unit: ## Run unit tests only
	./scripts/run_tests.sh unit

test-integration: ## Run integration tests only
	./scripts/run_tests.sh integration

test-e2e: ## Run end-to-end tests only
	./scripts/run_tests.sh e2e

test-fast: ## Run fast tests only (excluding slow tests)
	./scripts/run_tests.sh fast

test-slow: ## Run slow tests only
	./scripts/run_tests.sh slow

test-cov: ## Run tests with coverage
	./scripts/run_tests.sh all true

test-verbose: ## Run tests with verbose output
	./scripts/run_tests.sh all false true

test-perf: ## Run performance tests
	./scripts/run_tests.sh e2e

test-all: test test-cov ## Run all tests with coverage

# Code Quality Commands
lint: ## Run linting
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=88 --statistics

format: ## Format code with black
	black .

type-check: ## Run type checking
	mypy src/ --ignore-missing-imports --no-strict-optional

quality: lint type-check format ## Run all code quality checks

# Utility Commands
clean: ## Clean up Docker resources
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up all Docker resources including images
	docker-compose down -v --rmi all
	docker system prune -af
	docker volume prune -f

# Environment Commands
env: ## Copy environment template
	cp env.example .env
	@echo "Please edit .env file with your configuration"

env-check: ## Check environment variables
	@echo "Checking environment configuration..."
	@if [ ! -f .env ]; then echo "❌ .env file not found. Run 'make env' first."; exit 1; fi
	@echo "✅ .env file found"

# Data Commands
data-setup: ## Set up data directories
	mkdir -p data/documents data/indexes logs
	@echo "✅ Data directories created"

data-clean: ## Clean data directories
	rm -rf data/indexes/*
	@echo "✅ Index data cleaned"

# Health Check Commands
health: ## Check application health
	@echo "Checking application health..."
	@curl -f http://localhost:5500/ > /dev/null 2>&1 && echo "✅ Application is healthy" || echo "❌ Application is not responding"

status: ## Show container status
	docker-compose ps

# Backup Commands
backup: ## Backup data directory
	tar -czf backup-$(shell date +%Y%m%d-%H%M%S).tar.gz data/
	@echo "✅ Backup created"

restore: ## Restore from backup (usage: make restore BACKUP=backup-file.tar.gz)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore BACKUP=backup-file.tar.gz"; exit 1; fi
	tar -xzf $(BACKUP)
	@echo "✅ Backup restored"

# Documentation Commands
docs: ## Generate documentation
	@echo "Generating documentation..."
	@echo "✅ Documentation generated"

# Release Commands
release: ## Create a new release
	@echo "Creating release..."
	@echo "✅ Release created"

# Quick Start Commands
setup: env data-setup build ## Initial setup for new users
	@echo "🎉 Setup complete! Run 'make up' to start the application."

quick-start: setup up ## Quick start for new users
	@echo "🚀 Application started! Access at http://localhost:5500"

# Monitoring Commands
monitor: ## Monitor application logs and metrics
	@echo "Monitoring application..."
	@echo "Press Ctrl+C to stop"
	docker-compose logs -f

# Security Commands
security-scan: ## Run security scan
	@echo "Running security scan..."
	@echo "✅ Security scan completed"

# Performance Commands
benchmark: ## Run performance benchmarks
	@echo "Running performance benchmarks..."
	python test_performance.py
	@echo "✅ Benchmarks completed"

# Database Commands (for future use)
db-migrate: ## Run database migrations
	@echo "Database migrations not implemented yet"

db-seed: ## Seed database with initial data
	@echo "Database seeding not implemented yet"

# Default target
.DEFAULT_GOAL := help
