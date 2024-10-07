FROM node:12.14.1-buster

# Environment vars
ENV REACT_APP_SERVER_PORT=9000
ENV REACT_APP_PORT=5000
ENV REACT_APP_SERVER_HOST=check-validators-web-server
ENV REACT_APP_API_HOST_QA=check-validators-web-server.qa.nut.test.bloxberg.org
ENV REACT_APP_API_HOST_PROD=check-validators-web-server.prod.test.bloxberg.org

# Create and cd the directory
WORKDIR /home/node/client

COPY client/pkg/package.json ./
COPY client/env-tmpl.json .
COPY client/env-to-json.sh .
COPY client/start.sh .
COPY client/public ./public
COPY client/src ./src

RUN echo "DEBUG": $REACT_APP_API_HOST_QA
RUN echo "DEBUG": $REACT_APP_API_HOST_PROD

RUN apt-get update
RUN apt-get install -y gettext-base
# babel core issue
RUN npm install --save-dev @babel/core
RUN npm install --legacy-peer-deps
RUN npm run build
RUN npm install -g serve@^13.x.x

EXPOSE 5000

# CMD ./start.sh
