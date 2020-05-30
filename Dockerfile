FROM node:12.16-alpine

RUN mkdir /opt/app
WORKDIR /opt/app

VOLUME /opt/app/data

ENV NODE_ENV=production

COPY package.json package-lock.json /opt/app/
RUN npm install

COPY . /opt/app/

CMD ["npm", "start"]
