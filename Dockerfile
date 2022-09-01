## relay-dapp dockerfile (This file is called Dockerfile) on server side. ##
FROM node:16-alpine
RUN apk add --no-cache build-base git bash
WORKDIR /usr/src/app
COPY . ./
RUN npm i --no-audit

CMD ["npm","start"]