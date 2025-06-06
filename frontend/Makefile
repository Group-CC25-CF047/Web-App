# Makefile for GiziLens Frontend

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

# Read port value directly from .env file if it exists, otherwise use default
PORT_FRONTEND := $(shell grep -E '^PORT_FRONTEND=' .env 2>/dev/null | cut -d '=' -f 2 || echo "3000")

.PHONY: run install build stop lint docker-build docker-push

# Define empty targets for arguments
.PHONY: dev prod build

dev:
	@:
prod:
	@:
build:
	@:

run:
ifeq ($(word 2, $(MAKECMDGOALS)),dev)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running frontend in development mode...${COLOR_RESET}"
	@bun run dev
else ifeq ($(word 2, $(MAKECMDGOALS)),prod)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running frontend in production mode...${COLOR_RESET}"
	@bun run preview
else ifeq ($(word 2, $(MAKECMDGOALS)),build)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Building production frontend...${COLOR_RESET}"
	@bash build.sh
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Successfully built production frontend${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make run <environment>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available environments: dev, prod, build${COLOR_RESET}"
endif

install:
	@echo "${COLOR_BLUE}${SYMBOL_PACKAGE} Installing frontend dependencies...${COLOR_RESET}"
	@bun install
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Updating Bun dependencies...${COLOR_RESET}"
	@bun update
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Frontend installation complete!${COLOR_RESET}"

lint:
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Running eslint...${COLOR_RESET}"
	@bun run lint
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Linting complete!${COLOR_RESET}"

lint-fix:
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Running eslint with auto-fix...${COLOR_RESET}"
	@bun run lint:fix
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Linting and fixing complete!${COLOR_RESET}"

stop:
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping frontend server on port ${PORT_FRONTEND}...${COLOR_RESET}"
	@lsof -ti:${PORT_FRONTEND} | xargs -r kill -9 || echo "${COLOR_YELLOW}${SYMBOL_WARNING} No process found on port ${PORT_FRONTEND}${COLOR_RESET}"
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Frontend server stopped!${COLOR_RESET}"