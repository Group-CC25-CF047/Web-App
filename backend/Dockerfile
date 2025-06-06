FROM oven/bun:latest

WORKDIR /app

# Copy only the built output
COPY .dist /app/

# Expose the port the app runs on
EXPOSE 5500

# Set environment to production
ENV NODE_ENV=production

CMD ["bun", "run", "server.js"]