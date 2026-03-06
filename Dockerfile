FROM node:18-alpine

WORKDIR /usr/src/app

# Copy root package.json for "type": "module" resolution of shared data
COPY package.json ./

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source code and the shared game data
COPY server/ ./server/
COPY src/data/ ./src/data/

# Set working directory to the server so 'node index.js' runs correctly
WORKDIR /usr/src/app/server

ENV PORT=4000
EXPOSE 4000

CMD [ "node", "index.js" ]
