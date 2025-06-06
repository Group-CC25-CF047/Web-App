# Production-only Dockerfile that uses locally built artifacts
FROM oven/bun:latest

WORKDIR /app

# Copy only the built output
COPY .output /app/.output

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Command to run the application
CMD ["bun", ".output/server/index.mjs"]
