FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY lib ./lib
COPY public ./public
RUN addgroup -S ash && adduser -S ash -G ash && mkdir -p /var/lib/ash && chown -R ash:ash /app /var/lib/ash
USER ash
ENV NODE_ENV=production XMR_DATA_FILE=/var/lib/ash/receipts.json
EXPOSE 8788
CMD ["node", "server.mjs"]
