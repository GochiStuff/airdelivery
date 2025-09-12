FROM node:18-alpine 

WORKDIR /app
COPY package*.json ./
RUN npm install --production 

COPY . .

EXPOSE 5500

CMD [ "node", "src/server.js" ]
