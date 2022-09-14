FROM node:lts-alpine
WORKDIR /app

COPY ./dist /app/dist
COPY package.json yarn.lock /app/

ENV NODE_ENV=production

RUN yarn install --production --frozen-lockfile

EXPOSE 5000

CMD ["yarn","run","start"]