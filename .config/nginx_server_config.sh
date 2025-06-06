#!/bin/bash
# ==============================================================================
# Nginx Server Configuration Script for GiziLens
# ==============================================================================
# 
# DESCRIPTION:
#     This script configures Nginx for the GiziLens platform API and proxy services.
#
# USAGE:
#     ./nginx_server_config.sh
#
# PREREQUISITES:
#     - .env file with required environment variables
#     - certbot installed
#     - sudo privileges
#
# VERSION:
#     1.0
# ==============================================================================

set -euo pipefail

# ==============================================================================
# INITIALIZATION: Terminal Color Definitions
# ==============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly PURPLE='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ==============================================================================
# FUNCTION: log
# DESCRIPTION:
#     Logs messages with appropriate formatting and color coding
# PARAMETERS:
#     $1 - Log level (INFO, SUCCESS, WARNING, ERROR, STEP, CONFIG, DETAIL, DEBUG)
#     $2 - Message text
# ==============================================================================
log() {
  local type=$1
  local message=$2
  
  case "$type" in
    "INFO")
      echo -e "${CYAN}ℹ️ INFO: ${message}${NC}"
      ;;
    "SUCCESS")
      echo -e "${GREEN}✅ SUCCESS: ${message}${NC}"
      ;;
    "WARNING")
      echo -e "${YELLOW}⚠️ WARNING: ${message}${NC}"
      ;;
    "ERROR")
      echo -e "${RED}❌ ERROR: ${message}${NC}"
      ;;
    "STEP")
      echo -e "${PURPLE}🔄 STEP: ${message}${NC}"
      ;;
    "CONFIG")
      echo -e "${BLUE}🌐 ENVIRONMENT: ${message}${NC}"
      ;;
    "DETAIL")
      echo -e "${BLUE}   └─ ${message}${NC}"
      ;;
    "DEBUG")
      echo -e "${CYAN}🔍 DEBUG: ${message}${NC}"
      ;;
    *)
      echo -e "${message}"
      ;;
  esac
}

# ==============================================================================
# FUNCTION: error_exit
# DESCRIPTION:
#     Logs an error message and exits the script
# PARAMETERS:
#     $1 - Error message
# ==============================================================================
error_exit() {
  log "ERROR" "$1"
  exit 1
}

# ==============================================================================
# FUNCTION: command_exists
# DESCRIPTION:
#     Checks if a command exists in the system
# PARAMETERS:
#     $1 - Command to check
# RETURNS:
#     0 if command exists, 1 otherwise
# ==============================================================================
command_exists() {
  command -v "$1" &> /dev/null
}

# ==============================================================================
# FUNCTION: check_dependencies
# DESCRIPTION:
#     Checks if required dependencies are installed
# ==============================================================================
check_dependencies() {
  log "STEP" "Checking dependencies"
  
  if ! command_exists certbot; then
    error_exit "certbot is not installed. Please install certbot to proceed."
  fi

  log "SUCCESS" "All dependencies are installed"
}

# ==============================================================================
# FUNCTION: load_environment_vars
# DESCRIPTION:
#     Loads and validates required environment variables from .env file
# ==============================================================================
load_environment_vars() {
  log "STEP" "Loading environment variables"
  
  if [ -f "./.env" ]; then
    source ./.env
    log "INFO" "Environment variables loaded from .env file"
  else
    error_exit ".env file not found in current directory!"
  fi

  if [ -z "$COOKIE_DOMAIN" ]; then
    error_exit "COOKIE_DOMAIN is not set in the .env file!"
  fi
  
  log "SUCCESS" "Environment variables validated"
}

# ==============================================================================
# FUNCTION: select_deployment_mode
# DESCRIPTION:
#     Prompts the user to select the deployment mode (local/global)
# ==============================================================================
select_deployment_mode() {
  log "STEP" "Selecting deployment mode"
  
  while true; do
    read -p "Select deployment mode (local/global): " DEPLOYMENT_MODE
    case $DEPLOYMENT_MODE in
      local|global)
        log "CONFIG" "Selected ${DEPLOYMENT_MODE} deployment mode"
        break
        ;;
      *)
        log "WARNING" "Invalid selection. Please enter 'local' or 'global'"
        ;;
    esac
  done
}

# ==============================================================================
# FUNCTION: check_existing_certificates
# DESCRIPTION:
#     Checks for and skip cerbot if existing SSL certificates found for the domain
# PARAMETERS:
#     $1 - Domain name
# ==============================================================================
check_existing_certificates() {
  local domain="$1"
  
  log "STEP" "Checking if SSL certificates already exist for ${domain}"

  if [ -d "/etc/letsencrypt/live/${domain}" ] && [ "$(ls -A /etc/letsencrypt/live/${domain})" ]; then
    log "INFO" "SSL certificates already exist for ${domain}. Skipping certificate generation."
    return 0
  else
    log "INFO" "No existing certificates found for ${domain}. Proceeding to certificate creation."
    return 1
  fi
}

# ==============================================================================
# FUNCTION: obtain_ssl_certificates
# DESCRIPTION:
#     Obtains SSL certificates using certbot with standalone or DNS method
# PARAMETERS:
#     $1 - Domain name
#     $2 - Base domain for email
# ==============================================================================
obtain_ssl_certificates() {
  local domain="$1"
  local base_domain="$2"
  
  log "STEP" "Obtaining SSL certificates using standalone method"
  
  if ! echo "1" | sudo certbot certonly --standalone \
      --email "admin@${base_domain}" \
      --agree-tos --no-eff-email \
      -d "${domain}"; then
    
    log "WARNING" "Standalone method failed, trying manual DNS challenge method"
    if ! echo "1" | sudo certbot certonly --manual --preferred-challenges=dns \
        --email "admin@${base_domain}" \
        --agree-tos --no-eff-email \
        -d "${domain}"; then
        error_exit "Failed to obtain SSL certificates"
    else
        log "SUCCESS" "SSL certificates obtained using DNS challenge method"
    fi
  else
    log "SUCCESS" "SSL certificates obtained using standalone method"
  fi
}

# ==============================================================================
# FUNCTION: create_nginx_server_directory
# DESCRIPTION:
#     Creates the necessary directory for Server Nginx configurations
# ==============================================================================
create_nginx_server_directory() {
  log "STEP" "Creating nginx server configuration directory"
  
  mkdir -p "nginx/conf.d/" || error_exit "Failed to create nginx configuration directories"
  
  log "SUCCESS" "Nginx server directory created successfully"
}

# ==============================================================================
# FUNCTION: check_file_exists_with_sudo
# DESCRIPTION:
#     Checks if a file exists using sudo to bypass permission restrictions
# PARAMETERS:
#     $1 - File path to check
# RETURNS:
#     0 if file exists, 1 otherwise
# ==============================================================================
check_file_exists_with_sudo() {
  local file_path="$1"
  if sudo test -f "$file_path"; then
    return 0
  else
    return 1
  fi
}

# ==============================================================================
# FUNCTION: check_custom_certificates
# DESCRIPTION:
#     Checks if custom SSL certificates exist for a domain
# PARAMETERS:
#     $1 - Base domain
# RETURNS:
#     0 if certificates exist, 1 otherwise
# ==============================================================================
check_custom_certificates() {
  local base_domain="$1"
  local cert_path="/etc/ssl/certs/${base_domain}.pem"
  local key_path="/etc/ssl/private/${base_domain}.key"
  
  log "DEBUG" "Checking for custom SSL certificates at:"
  log "DETAIL" "Certificate: ${cert_path}"
  log "DETAIL" "Private key: ${key_path}"
  
  # Check certificate file
  local cert_exists=false
  if check_file_exists_with_sudo "${cert_path}"; then
    cert_exists=true
    log "DETAIL" "Certificate file found: ${cert_path}"
  else
    log "DETAIL" "Certificate file missing: ${cert_path}"
  fi
  
  # Check key file
  local key_exists=false
  if check_file_exists_with_sudo "${key_path}"; then
    key_exists=true
    log "DETAIL" "Private key file found: ${key_path}"
  else
    log "DETAIL" "Private key file missing: ${key_path}"
  fi
  
  # Only return success if both files exist
  if [ "$cert_exists" = true ] && [ "$key_exists" = true ]; then
    log "INFO" "Custom SSL certificates found for ${base_domain}"
    log "DETAIL" "Will use custom certificate: ${cert_path}"
    log "DETAIL" "Will use private key: ${key_path}"
    return 0
  else
    log "INFO" "No custom SSL certificates found for ${base_domain}"
    if [ "$cert_exists" = false ]; then
      log "DETAIL" "Missing certificate file: ${cert_path}"
    fi
    if [ "$key_exists" = false ]; then
      log "DETAIL" "Missing private key file: ${key_path}"
    fi
    return 1
  fi
}

# ==============================================================================
# FUNCTION: generate_server_configs
# DESCRIPTION:
#     Generates the Nginx configuration files for API and Frontend
# PARAMETERS:
#     $1 - Cookie domain
# ==============================================================================
generate_server_configs() {
  local cookie_domain="$1"
  
  local api_host=""
  local frontend_host=""
  
  if [ "$DEPLOYMENT_MODE" = "local" ]; then
    api_host="host.docker.internal:5500"
    frontend_host="host.docker.internal:3000"
  else
    api_host="backend-prod:5500"
    frontend_host="frontend-prod:3000"
  fi
  
  log "STEP" "Generating API Nginx configuration file"
  
  local use_custom_api_certs=false
  if check_custom_certificates "${cookie_domain}"; then
    use_custom_api_certs=true
    log "INFO" "Using custom SSL certificates for api.${cookie_domain}"
    log "DETAIL" "Certificate path: /etc/ssl/certs/${cookie_domain}.pem"
    log "DETAIL" "Private key path: /etc/ssl/private/${cookie_domain}.key"
  else
    log "INFO" "Using Let's Encrypt certificates for api.${cookie_domain}"
    log "DETAIL" "Certificate path: /etc/letsencrypt/live/api.${cookie_domain}/fullchain.pem"
    log "DETAIL" "Private key path: /etc/letsencrypt/live/api.${cookie_domain}/privkey.pem"
  fi
  
  cat > "nginx/conf.d/api.conf" << EOF
server {
    listen 443 ssl;
    server_name api.${cookie_domain};

EOF

  if [ "$use_custom_api_certs" = true ]; then
    cat >> "nginx/conf.d/api.conf" << EOF
    ssl_certificate /etc/ssl/certs/${cookie_domain}.pem;
    ssl_certificate_key /etc/ssl/private/${cookie_domain}.key;
EOF
  else
    cat >> "nginx/conf.d/api.conf" << EOF
    ssl_certificate /etc/letsencrypt/live/api.${cookie_domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.${cookie_domain}/privkey.pem;
EOF
  fi

  cat >> "nginx/conf.d/api.conf" << EOF

    # Increase timeout and payload size limits for large file uploads
    client_max_body_size 500M;
    proxy_connect_timeout 1800;
    proxy_send_timeout 1800;
    proxy_read_timeout 1800;
    send_timeout 1800;
    fastcgi_read_timeout 1800;
    
    # Additional buffer size configurations
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://${api_host};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Enable request buffering for large uploads
        proxy_request_buffering on;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-NginX-Proxy true;

        # Security headers
        add_header Access-Control-Max-Age "600" always;
    }
}

server {
    listen 80;
    server_name api.${cookie_domain};
    return 301 https://\$host\$request_uri;
}
EOF

  log "STEP" "Generating Frontend Nginx configuration file"
  
  local use_custom_frontend_certs=false
  if check_custom_certificates "${cookie_domain}"; then
    use_custom_frontend_certs=true
    log "INFO" "Using custom SSL certificates for app.${cookie_domain}"
    log "DETAIL" "Certificate path: /etc/ssl/certs/${cookie_domain}.pem"
    log "DETAIL" "Private key path: /etc/ssl/private/${cookie_domain}.key"
  else
    log "INFO" "Using Let's Encrypt certificates for app.${cookie_domain}"
    log "DETAIL" "Certificate path: /etc/letsencrypt/live/app.${cookie_domain}/fullchain.pem"
    log "DETAIL" "Private key path: /etc/letsencrypt/live/app.${cookie_domain}/privkey.pem"
  fi
  
  cat > "nginx/conf.d/frontend.conf" << EOF
server {
    listen 443 ssl;
    server_name app.${cookie_domain};

EOF

  if [ "$use_custom_frontend_certs" = true ]; then
    cat >> "nginx/conf.d/frontend.conf" << EOF
    ssl_certificate /etc/ssl/certs/${cookie_domain}.pem;
    ssl_certificate_key /etc/ssl/private/${cookie_domain}.key;
EOF
  else
    cat >> "nginx/conf.d/frontend.conf" << EOF
    ssl_certificate /etc/letsencrypt/live/app.${cookie_domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.${cookie_domain}/privkey.pem;
EOF
  fi

  cat >> "nginx/conf.d/frontend.conf" << EOF

    # Increase timeout and payload size limits
    client_max_body_size 100M;
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    location / {
        proxy_pass http://${frontend_host}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_cache off;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header Cross-Origin-Opener-Policy "same-origin" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Permissions-Policy "geolocation=(), microphone=()" always;
    }
}

server {
    listen 80;
    server_name app.${cookie_domain};
    return 301 https://\$host\$request_uri;
}
EOF

  # Comment out Landing Page Nginx configuration
  log "STEP" "Generating Landing Page Nginx configuration file (commented out)"
  
  cat > "nginx/conf.d/landing.conf" << EOF
# Landing page configuration is commented out
# server {
#     listen 443 ssl;
#     server_name ${cookie_domain} www.${cookie_domain};
#
#     # SSL certificate configuration would be here
#
#     root /var/www/html;
#     index index.html;
#     
#     location / {
#         try_files \$uri \$uri/ /index.html;
#
#         # Security headers
#         add_header X-Frame-Options "DENY" always;
#         add_header Cross-Origin-Opener-Policy "same-origin" always;
#         add_header Referrer-Policy "no-referrer-when-downgrade" always;
#         add_header Permissions-Policy "geolocation=(), microphone=()" always;
#     }
#     
#     # Static assets caching
#     location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
#         expires 7d;
#         add_header Cache-Control "public";
#     }
# }
#
# server {
#     listen 80;
#     server_name ${cookie_domain} www.${cookie_domain};
#     return 301 https://\$host\$request_uri;
# }
EOF

  log "CONFIG" "SERVER NGINX CONFIGURATION:"
  log "DETAIL" "Cookie Domain: ${cookie_domain}"
  log "DETAIL" "API Domain: api.${cookie_domain}"
  log "DETAIL" "Frontend Domain: app.${cookie_domain}"
  log "SUCCESS" "API configuration file created at nginx/conf.d/api.conf"
  log "SUCCESS" "Frontend configuration file created at nginx/conf.d/frontend.conf"
  log "SUCCESS" "Landing Page configuration file created at nginx/conf.d/landing.conf (commented out)"
}

# ==============================================================================
# MAIN SCRIPT EXECUTION
# ==============================================================================
check_dependencies
load_environment_vars
select_deployment_mode

custom_certs_exist=false
if check_custom_certificates "$COOKIE_DOMAIN"; then
  custom_certs_exist=true
  log "SUCCESS" "Custom SSL certificates verified and will be used for all domains"
  log "DETAIL" "Custom certificate path: /etc/ssl/certs/${COOKIE_DOMAIN}.pem"
  log "DETAIL" "Custom private key path: /etc/ssl/private/${COOKIE_DOMAIN}.key"
  
  if ! sudo -u www-data test -r "/etc/ssl/certs/${COOKIE_DOMAIN}.pem" 2>/dev/null; then
    log "WARNING" "Nginx user (www-data) may not have read permissions for the certificate file"
    log "DETAIL" "Consider running: sudo chmod 644 /etc/ssl/certs/${COOKIE_DOMAIN}.pem"
  fi
  
  if ! sudo -u www-data test -r "/etc/ssl/private/${COOKIE_DOMAIN}.key" 2>/dev/null; then
    log "WARNING" "Nginx user (www-data) may not have read permissions for the private key file"
    log "DETAIL" "Consider running: sudo chmod 640 /etc/ssl/private/${COOKIE_DOMAIN}.key"
    log "DETAIL" "And: sudo chown root:www-data /etc/ssl/private/${COOKIE_DOMAIN}.key"
  fi
else
  log "INFO" "No custom certificates found or permissions issues occurred, will use Let's Encrypt certificates"
  log "DETAIL" "If you have custom certificates, ensure they are properly placed and readable:"
  log "DETAIL" "Certificate should be at: /etc/ssl/certs/${COOKIE_DOMAIN}.pem"
  log "DETAIL" "Private key should be at: /etc/ssl/private/${COOKIE_DOMAIN}.key"
  log "DETAIL" "Check permissions with: sudo ls -la /etc/ssl/certs/${COOKIE_DOMAIN}.pem /etc/ssl/private/${COOKIE_DOMAIN}.key"
fi

declare -a domains_needing_certs=()

if [ "$custom_certs_exist" = false ] && ( ! [ -d "/etc/letsencrypt/live/api.${COOKIE_DOMAIN}" ] || ! [ "$(ls -A /etc/letsencrypt/live/api.${COOKIE_DOMAIN})" ] ); then
  domains_needing_certs+=("api.$COOKIE_DOMAIN")
fi

if [ "$custom_certs_exist" = false ] && ( ! [ -d "/etc/letsencrypt/live/app.${COOKIE_DOMAIN}" ] || ! [ "$(ls -A /etc/letsencrypt/live/app.${COOKIE_DOMAIN})" ] ); then
  domains_needing_certs+=("app.$COOKIE_DOMAIN")
fi

# Commented out landing page domain certificate check
# if [ "$custom_certs_exist" = false ] && ( ! [ -d "/etc/letsencrypt/live/${COOKIE_DOMAIN}" ] || ! [ "$(ls -A /etc/letsencrypt/live/${COOKIE_DOMAIN})" ] ); then
#   domains_needing_certs+=("$COOKIE_DOMAIN")
# fi

for domain in "${domains_needing_certs[@]}"; do
  log "STEP" "Obtaining certificates for ${domain}"
  obtain_ssl_certificates "$domain" "$COOKIE_DOMAIN"
done

# Comment out landing page copying process
log "STEP" "Landing page process (commented out)"
# sudo mkdir -p /var/www/html/ || error_exit "Failed to create web root directory"
# SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
# PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
# sudo cp -r "$PROJECT_ROOT/server/frontend/index.html" /var/www/html/ || error_exit "Failed to copy landing page"
# log "SUCCESS" "Landing page copied to Nginx web root"

create_nginx_server_directory
generate_server_configs "$COOKIE_DOMAIN"

log "SUCCESS" "Server Nginx configuration completed successfully"