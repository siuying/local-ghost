// # Ghost Startup
// Orchestrates the startup of Ghost when run from command line.

const startTime = Date.now()
const debug = require('ghost-ignition').debug('boot:index')

debug('First requires...');

const ghost = require('ghost');

debug('Required ghost');

const express = require('express');
const logging = require('ghost/core/server/logging');
const errors = require('ghost/core/server/errors');
const utils = require('ghost/core/server/utils');
const parentApp = express();

debug('Initialising Ghost');
ghost().then(function (ghostServer) {
    // Mount our Ghost instance on our desired subdirectory path if it exists.
    parentApp.use(utils.url.getSubdir(), ghostServer.rootApp);

    debug('Starting Ghost');
    // Let Ghost handle starting our server instance.
    return ghostServer.start(parentApp).then(function afterStart() {
        logging.info('Ghost boot', (Date.now() - startTime) / 1000 + 's');

        // if IPC messaging is enabled, ensure ghost sends message to parent
        // process on successful start
        if (process.send) {
            process.send({started: true});
        }
    });
}).catch(function (err) {
    if (!errors.utils.isIgnitionError(err)) {
        err = new errors.GhostError({err: err});
    }

    if (process.send) {
        process.send({started: false, error: err.message});
    }

    logging.error(err);
    process.exit(-1);
});
