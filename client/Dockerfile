FROM node:20-slim

WORKDIR /app

# Copy package files and install ALL dependencies (including dev for Vite)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and config files
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/

EXPOSE 5173

# Run Vite dev server bound to all interfaces so it's reachable from the host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
