# ---- Stage 1: Build the React app ----
    FROM node:16-alpine AS builder

    # Create app directory in the container
    WORKDIR /app
    
    # Copy package.json and package-lock.json first (better caching)
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy the rest of your frontend code
    COPY . .
    
    # Build the React app for production
    RUN npm run build
    
    
    # ---- Stage 2: Serve the app with Nginx ----
    FROM nginx:stable-alpine
    
    # Copy build output from Stage 1 to Nginx HTML folder
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Expose port 80 to the outside world
    EXPOSE 80
    
    # Start Nginx when the container launches
    CMD ["nginx", "-g", "daemon off;"]