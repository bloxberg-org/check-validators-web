FROM node:12.14.1-buster

# Create and cd the directory
WORKDIR /home/node/server

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 9000

CMD ["npm", "start"]