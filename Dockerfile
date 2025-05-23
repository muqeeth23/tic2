# Use Node.js LTS as base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the server port
EXPOSE 3000

# Start the Node.js server
CMD ["npm", "start"]
