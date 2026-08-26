FROM keymetrics/pm2:latest-alpine

# Bundle APP files
COPY src src/
COPY public public/
COPY package.json .
COPY package-lock.json .
COPY ecosystem.config.js .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm ci

# Expose the listening port of your app
EXPOSE 5000

# Show current folder structure in logs
#RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
