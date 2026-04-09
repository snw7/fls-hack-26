FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_APP_NAME
ARG VITE_DEFAULT_TEMPLATE_ID
ARG VITE_DISCOVERY_WEBHOOK_URL
ARG VITE_REVISION_WEBHOOK_URL

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_DEFAULT_TEMPLATE_ID=$VITE_DEFAULT_TEMPLATE_ID
ENV VITE_DISCOVERY_WEBHOOK_URL=$VITE_DISCOVERY_WEBHOOK_URL
ENV VITE_REVISION_WEBHOOK_URL=$VITE_REVISION_WEBHOOK_URL

COPY package.json ./
RUN npm install

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
