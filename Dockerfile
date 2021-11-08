FROM node:12.14.1-buster

# Create and cd the directory
WORKDIR /home/node/client

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 9001

CMD [ "npm", "start"]