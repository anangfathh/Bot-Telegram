.PHONY: help build up down restart logs logs-bot logs-mysql ps clean rebuild backup restore shell-bot shell-mysql

help: ## Show this help message
	@echo "🐳 Docker Commands for Telegram Bot"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

restart-bot: ## Restart bot only
	docker-compose restart bot

restart-mysql: ## Restart MySQL only
	docker-compose restart mysql

logs: ## View all logs
	docker-compose logs -f

logs-bot: ## View bot logs only
	docker-compose logs -f bot

logs-mysql: ## View MySQL logs only
	docker-compose logs -f mysql

ps: ## List running containers
	docker-compose ps

stats: ## Show resource usage
	docker stats

clean: ## Stop and remove containers, networks
	docker-compose down

clean-all: ## Remove everything including volumes and images
	docker-compose down -v --rmi all

rebuild: ## Rebuild and restart services
	docker-compose up -d --build

shell-bot: ## Access bot container shell
	docker-compose exec bot sh

shell-mysql: ## Access MySQL shell
	docker-compose exec mysql mysql -u root -p

backup: ## Backup database
	@echo "Creating backup..."
	docker-compose exec mysql mysqldump -u root -p mager_bot > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

restore: ## Restore database from backup.sql
	@echo "Restoring database..."
	docker-compose exec -T mysql mysql -u root -p mager_bot < backup.sql
	@echo "Database restored!"

health: ## Check services health
	@docker-compose ps
	@echo ""
	@echo "Bot logs (last 10 lines):"
	@docker-compose logs --tail=10 bot

setup: ## Initial setup (copy .env and start)
	@if [ ! -f .env ]; then \
		echo "Creating .env from template..."; \
		cp .env.docker .env; \
		echo "✅ .env created! Please edit it with your credentials."; \
		echo "📝 Run: nano .env"; \
	else \
		echo "⚠️  .env already exists!"; \
	fi

start: up ## Alias for 'up'

stop: down ## Alias for 'down'
