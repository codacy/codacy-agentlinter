FROM node:20-alpine3.20 AS builder

COPY package.json package-lock.json ./
COPY src src
COPY docs docs
COPY tsconfig.json ./

RUN npm install && \
    npm cache clean --force && \
    npm run build:docs

FROM node:20-alpine3.20
COPY --from=builder package*.json ./
COPY --from=builder dist dist
COPY --from=builder docs docs

RUN npm install --omit=dev && \
    npm cache clean --force && \ 
    adduser -u 2004 -D docker && \ 
    chown -R docker:docker /docs

WORKDIR /src

CMD ["node", "/dist/src/index.js"]
