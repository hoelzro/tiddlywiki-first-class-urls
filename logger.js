/*\
module-type: library

\*/

(function() {
    let logger = {};

    let innerLogger;

    logger.log = function(...args) {
        if(!innerLogger) {
            if(!$tw.utils.Logger) {
                // XXX just drop the logs on the floor?
                return;
            }
            innerLogger = new $tw.utils.Logger('first-class-urls', {
                saveLimit: 1024 * 1024,
            });
        }
        return innerLogger.log(...args);
    };

    logger.error = logger.log; // XXX for now

    logger.debug = function(...args) {
        let debuggingEnabled = ($tw.wiki.getTiddlerText('$:/plugins/hoelzro/first-class-urls/config/debugging') ?? '').trim() === 'yes';
        if(!debuggingEnabled) {
            return;
        }
        return logger.log(...args);
    };

    logger.getBuffer = function() {
        if(!innerLogger) {
            return '';
        }

        return innerLogger.getBuffer();
    };

    logger.setBuffer = function(buffer) {
        if(!innerLogger) {
            return;
        }

        innerLogger.saveBufferLogger.buffer = buffer;
    };

    module.exports = logger;
})();
