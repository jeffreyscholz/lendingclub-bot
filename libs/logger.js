var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
            new (winston.transports.Console)({'timestamp':true, 'colorize':true, 'timestamp':true, level:'info'}),
            new (winston.transports.File)({filename: 'log.log'})
        ]
});

module.exports = logger;
