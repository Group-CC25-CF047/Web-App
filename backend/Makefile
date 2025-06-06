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

# Read port values directly from .env file
PORT_BACKEND := $(shell grep -E '^PORT_BACKEND=' .env | cut -d '=' -f 2)

.PHONY: run install build stop _build-clean-modules _build-init-module _build-install-deps backend

# Define empty targets for arguments
.PHONY: backend build
backend:
	@:
build:
	@:

run:
ifeq ($(word 2, $(MAKECMDGOALS)),backend)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running backend server...${COLOR_RESET}"
	@bun run dev
else ifeq ($(word 2, $(MAKECMDGOALS)),build)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Building production backend server...${COLOR_RESET}"
	@bash build.sh
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Successfully built production server${COLOR_RESET}"
else ifeq ($(word 2, $(MAKECMDGOALS)),migrate)
	@echo "${COLOR_BLUE}${SYMBOL_ROCKET} Running database migrations...${COLOR_RESET}"
	@bun run migrate
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Migrations completed successfully!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make run <environment>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available environments: backend, build${COLOR_RESET}"
endif

install:
ifeq ($(word 2, $(MAKECMDGOALS)),backend)
	@echo "${COLOR_BLUE}${SYMBOL_PACKAGE} Installing backend dependencies...${COLOR_RESET}"
	@bun install
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Updating Bun dependencies...${COLOR_RESET}"
	@bun update
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Backend installation complete!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make install <environment>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available environments: backend${COLOR_RESET}"
endif

stop:
ifeq ($(word 2, $(MAKECMDGOALS)),backend)
	@echo "${COLOR_BLUE}${SYMBOL_PROCESS} Stopping backend server on port ${PORT_BACKEND}...${COLOR_RESET}"
	@lsof -ti:${PORT_BACKEND} | xargs -r kill -9 || echo "${COLOR_YELLOW}${SYMBOL_WARNING} No process found on port ${PORT_BACKEND}${COLOR_RESET}"
	@echo "${COLOR_GREEN}${SYMBOL_SUCCESS} Backend server stopped!${COLOR_RESET}"
else
	@echo "${COLOR_RED}${SYMBOL_ERROR} Usage: make stop <environment>${COLOR_RESET}"
	@echo "${COLOR_INFO}${SYMBOL_INFO} Available environments: backend${COLOR_RESET}"
endif
	@exit