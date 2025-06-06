# Makefile

# Suppress "Entering directory" and "Leaving directory" messages
MAKEFLAGS += --no-print-directory

# Color definitions
COLOR_RESET=\033[0m
COLOR_GREEN=\033[0;32m
COLOR_RED=\033[0;31m
COLOR_YELLOW=\033[0;33m
COLOR_BLUE=\033[0;34m
COLOR_CYAN=\033[0;36m

# Symbols
SYMBOL_SUCCESS=✅
SYMBOL_ERROR=❌
SYMBOL_WARNING=⚠️
SYMBOL_INFO=ℹ️
SYMBOL_PROCESS=🔹
SYMBOL_ROCKET=🚀
SYMBOL_PACKAGE=📦

# Configuration variables
NGINX_SERVER_CONFIG_SCRIPT=./nginx_server_config.sh
CERT_EMAIL=admin@$(shell echo $$COOKIE_DOMAIN)
NGINX_CONTAINER=nginx-prod

# Base configuration directory
CONFIG_DIR = .config

# Docker compose commands
DC_GIZILENS_CMD = docker compose -p gizilens -f docker-compose-gizilens.yml
DC_SERVER_CMD = docker compose -p server -f docker-compose-server.yml

# Nginx commands
NGINX_TEST_CMD = docker exec $(NGINX_CONTAINER) nginx -t
NGINX_RELOAD_CMD = docker exec $(NGINX_CONTAINER) nginx -s reload
NGINX_TEST_RELOAD = $(NGINX_TEST_CMD) && $(NGINX_RELOAD_CMD)

# PM2 service names
PM2_BACKEND = gizilens-backend

.PHONY: run docker cert stop restart status log

run:
ifeq ($(word 2, $(MAKECMDGOALS)),build)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Building all components...${COLOR_RESET}"
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Building backend...${COLOR_RESET}"
	@cd backend && $(MAKE) run build
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Building frontend...${COLOR_RESET}"
	@cd frontend && $(MAKE) run build
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} All components built successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),zip)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Cleaning and preparing zip package...${COLOR_RESET}"
	@sudo rm -rf plugins/migration/.dist
	@sudo rm -rf backend/.dist backend/certs backend/node_modules
	@sudo rm -rf backend/.env backend/bun.lock backend/keyfile.json
	@sudo rm -rf frontend/.dist frontend/.output frontend/.nuxt frontend/node_modules 
	@sudo rm -rf frontend/.env frontend/bun.lock
	@sudo rm -rf $(CONFIG_DIR)/backend $(CONFIG_DIR)/nginx $(CONFIG_DIR)/postgres $(CONFIG_DIR)/redis
	@sudo rm -rf $(CONFIG_DIR)/.env $(CONFIG_DIR)/keyfile.json
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Successfully cleaned project files${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),migrate)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running database migration...${COLOR_RESET}"
	@cd plugins/migration && $(MAKE) run migrate
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Database migration completed successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),gizilens)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running GiziLens and Server containers...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && { \
		chmod +x $(NGINX_SERVER_CONFIG_SCRIPT); \
		bash $(NGINX_SERVER_CONFIG_SCRIPT); \
		if ! docker network inspect gizilens_network >/dev/null 2>&1; then \
			echo "Creating docker network gizilens_network..."; \
			docker network create gizilens_network; \
		else \
			echo "Docker network gizilens_network already exists. Skipping create."; \
		fi; \
		docker compose -p gizilens -f docker-compose.yml up -d; \
	}
	# @sudo cp -f frontend/index.html /var/www/html/
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} GiziLens and Server containers started successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),dev)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Starting development environment...${COLOR_RESET}"
	@docker run --name postgres-sql -p 5432:5432 -e POSTGRES_PASSWORD=postgres -v postgres_data:/var/lib/postgresql/data -d postgres
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Waiting for PostgreSQL to initialize...${COLOR_RESET}"
	@sleep 5
	@docker run --name redis -p 6379:6379 -v redis_data:/data -d redis redis-server --requirepass redis
	@docker exec postgres-sql psql -U postgres -c "SELECT 'CREATE DATABASE postgres' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'postgres');" || echo "${COLOR_YELLOW}${SYMBOL_WARNING} Database creation failed, but continuing setup...${COLOR_RESET}"
	@which pm2 > /dev/null 2>&1; \
	if [ $$? -ne 0 ]; then \
		echo "${COLOR_BLUE}${SYMBOL_PROCESS} Installing PM2...${COLOR_RESET}"; \
		sudo npm install -g pm2; \
	else \
		echo "${COLOR_BLUE}${SYMBOL_INFO} PM2 is already installed. Skipping installation.${COLOR_RESET}"; \
	fi
	@which bun > /dev/null 2>&1; \
	if [ $$? -ne 0 ]; then \
		echo "${COLOR_BLUE}${SYMBOL_PROCESS} Installing Bun...${COLOR_RESET}"; \
		sudo npm install -g bun; \
	else \
		echo "${COLOR_BLUE}${SYMBOL_INFO} Bun is already installed. Skipping installation.${COLOR_RESET}"; \
	fi
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Starting backend services with PM2...${COLOR_RESET}"
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Running database migration before starting backend...${COLOR_RESET}"
	@cd backend && bun -r reflect-metadata db/migration.ts
	@cd backend && pm2 start ecosystem.config.cjs
	@cd frontend && bun install --production
	@cd frontend && make run dev
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Development environment started successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),backend)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Starting backend services with PM2...${COLOR_RESET}"
	@cd backend && pm2 start ecosystem.config.cjs
	@docker exec nginx-prod nginx -t && docker exec nginx-prod nginx -s reload
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Backend services started successfully with PM2!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),frontend)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Starting frontend in development mode...${COLOR_RESET}"
	@cd frontend && bun run nuxt dev
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Frontend started successfully!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make run <service>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available services: build, zip, migrate, dump, gizilens, backend, frontend${COLOR_RESET}"
endif
	@exit

docker:
ifeq ($(word 2, $(MAKECMDGOALS)),gizilens)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running GiziLens service...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && { \
		docker compose -p gizilens -f docker-compose-gizilens.yml up -d; \
	}
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} GiziLens service started successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),server)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running Server service...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && { \
		chmod +x $(NGINX_SERVER_CONFIG_SCRIPT); \
		bash $(NGINX_SERVER_CONFIG_SCRIPT); \
		docker compose -p gizilens -f docker-compose-server.yml up -d; \
		sleep 5; \
		docker exec nginx-prod nginx -t && docker exec nginx-prod nginx -s reload; \
	}
	# @sudo cp -f frontend/index.html /var/www/html/
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Server service started successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),update)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Updating Docker containers...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && { \
		chmod +x docker_update.sh; \
		bash docker_update.sh; \
		docker exec nginx-prod nginx -t && docker exec nginx-prod nginx -s reload; \
	}
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Docker containers updated successfully!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make docker <service>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available services: gizilens, server, update${COLOR_RESET}"
endif
	@exit

stop:
ifeq ($(word 2, $(MAKECMDGOALS)),server)
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping server containers and PM2 processes...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && docker compose -p gizilens -f docker-compose-server.yml down
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping PM2 processes...${COLOR_RESET}"
	@sudo rm -f $(CONFIG_DIR)/nginx/conf.d/api.conf
	@sudo rm -f $(CONFIG_DIR)/nginx/conf.d/frontend.conf
	@sudo rm -f $(CONFIG_DIR)/nginx/conf.d/landing.conf
	@sudo rm -f /var/www/html/index.html
	@$(NGINX_TEST_RELOAD)
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Server stopped and cleanup completed.${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),gizilens)
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping all GiziLens containers and cleaning up...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && docker compose -p gizilens -f docker-compose-gizilens.yml down
	@sudo rm -rf $(CONFIG_DIR)/nginx/conf.d
	# @sudo rm -rf $(CONFIG_DIR)/postgres/data
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} GiziLens cleanup completed.${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),vscode)
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping all VS Code Server processes...${COLOR_RESET}"
	@pkill -f vscode-server || echo "${COLOR_YELLOW}${SYMBOL_WARNING} No VS Code Server processes found.${COLOR_RESET}"
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} VS Code Server processes stopped.${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),all)
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping all containers and cleaning up...${COLOR_RESET}"
	@cd $(CONFIG_DIR) && docker compose -p gizilens -f docker-compose-gizilens.yml down
	@cd $(CONFIG_DIR) && docker compose -p gizilens -f docker-compose-server.yml down
	@cd $(CONFIG_DIR) && docker compose -p gizilens -f docker-compose.yml down
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping PM2 processes...${COLOR_RESET}"
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Removing Nginx data directories...${COLOR_RESET}"
	@sudo rm -rf $(CONFIG_DIR)/nginx/conf.d
	@sudo rm -f /var/www/html/index.html
	# @sudo rm -rf $(CONFIG_DIR)/postgres/data
	@docker stop postgres-sql && docker rm postgres-sql && docker volume rm postgres_data
	@docker stop redis && docker rm redis && docker volume rm redis_data
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Cleanup completed.${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make stop <service>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available services: server, gizilens, vscode, all${COLOR_RESET}"
endif
	@exit

cert:
ifeq ($(word 2, $(MAKECMDGOALS)),local)
	@echo "${COLOR_BLUE}${SYMBOL_PACKAGE} Creating local certificate...${COLOR_RESET}"
	@sudo certbot certonly --manual --preferred-challenges=dns \
		--email $(CERT_EMAIL) \
		--agree-tos --no-eff-email \
		-d $(MQTT_DOMAIN)
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Local certificate created successfully!${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),global)
	@echo "${COLOR_BLUE}${SYMBOL_PACKAGE} Creating global certificate...${COLOR_RESET}"
	@sudo certbot certonly --standalone \
		--email $(CERT_EMAIL) \
		--agree-tos --no-eff-email \
		-d $(MQTT_DOMAIN)
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Global certificate created successfully!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make cert <environment>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available environments: local, global${COLOR_RESET}"
endif
	@exit

log:
ifeq ($(word 2, $(MAKECMDGOALS)),backend)
	@echo "${COLOR_BLUE}${SYMBOL_INFO} Showing logs for Backend service...${COLOR_RESET}"
	@cd backend && pm2 logs $(PM2_BACKEND)
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make log <service>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available services: backend${COLOR_RESET}"
endif
	@exit

%:
	@echo -n ""