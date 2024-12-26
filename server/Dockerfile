FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the backend port (e.g., 5000)
EXPOSE 5001

# Start the backend when the container launches
CMD ["node", "index.js"]