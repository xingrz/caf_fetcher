FROM node:16-alpine

RUN mkdir /opt/app
WORKDIR /opt/app

COPY package.json package-lock.json /opt/app/
RUN npm install

COPY . /opt/app/
RUN npm run build

# runtime
FROM node:16-alpine

RUN mkdir /opt/app
WORKDIR /opt/app

ENV NODE_ENV=production

COPY package.json package-lock.json /opt/app/
RUN npm install --only=prod

COPY . /opt/app/
COPY --from=builder /opt/app/lib /opt/app/lib

VOLUME [ "/opt/app/data" ]

CMD ["npm", "start"]
