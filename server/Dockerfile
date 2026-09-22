FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["node", "src/index.js"]
