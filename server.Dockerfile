FROM node:14.21-buster

# Create and cd the directory
WORKDIR /home/node

COPY server/pkg/package.json ./

RUN npm install

COPY server/files/. .

EXPOSE 9000

# CMD ["npm", "start"]
