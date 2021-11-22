FROM node:12.14.1-buster

# Build args
ARG REACT_APP_SERVER_PORT
ARG REACT_APP_PORT
ARG REACT_APP_SERVER_HOST

# Environment vars
ENV REACT_APP_SERVER_PORT: 9000
ENV REACT_APP_PORT: 9001
ENV REACT_APP_SERVER_HOST: check-validators-web-server

# Create and cd the directory
WORKDIR /home/node/client

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 9001

CMD [ "npm", "start"]