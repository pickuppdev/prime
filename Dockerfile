FROM pickupp/node:12.12 as builder

# Install system dependencies
RUN apk update && apk add git jq

ARG BUILD_DIR=/root/primecms
ARG INSTALL_DIR=/var/primecms

# Create app directory
RUN mkdir -p ${BUILD_DIR}
RUN mkdir -p ${INSTALL_DIR}
WORKDIR ${BUILD_DIR}

COPY . ${BUILD_DIR}

RUN while true; do yarn install --silent; test $? -eq 0 && break; sleep 1; done;
RUN yarn setup
RUN yarn compile

RUN mkdir -p ${INSTALL_DIR}/node_modules/@primecms
WORKDIR ${INSTALL_DIR}/node_modules/@primecms
RUN for dir in "${BUILD_DIR}"/packages/*; do \
        NEW_NAME="$(basename "$dir" | cut -d- -f2-)"; \
        mv "${dir}" "./${NEW_NAME}"; \
    done
RUN rm -fr ${BUILD_DIR}

ENV NODE_ENV=production

WORKDIR ${INSTALL_DIR}
COPY package.deploy.json ${INSTALL_DIR}/package.json
RUN yarn install
RUN echo "require('@primecms/core');" > index.js


FROM pickupp/node:12.12

ARG INSTALL_DIR=/var/primecms
ENV INSTALL_DIR ${INSTALL_DIR}
RUN mkdir -p ${INSTALL_DIR}
COPY --from=builder ${INSTALL_DIR} ${INSTALL_DIR}

WORKDIR ${INSTALL_DIR}

EXPOSE 4000

CMD [ "npm", "start" ]
