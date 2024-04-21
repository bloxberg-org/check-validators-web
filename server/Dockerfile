FROM node:14.20-alpine

# Create and cd the directory
WORKDIR /home/node/server

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 9000

CMD ["npm", "start"]