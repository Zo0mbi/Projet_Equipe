# Stage 1: Serve the static files
FROM nginx:alpine
# Copy the contents of the dist folder to Nginx's default web directory
COPY ./dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80