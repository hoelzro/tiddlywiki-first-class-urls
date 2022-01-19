/*\
module-type: route

POST /plugins/hoelzro/first-class-urls/logs/reset

\*/

(function() {
    let logger = require('$:/plugins/hoelzro/first-class-urls/logger.js');

    exports.method = 'POST';
    exports.path = new RegExp(`/plugins/hoelzro/first-class-urls/logs/reset`);

    exports.handler = function(request, response, state) {
        logger.setBuffer('');
        response.writeHead(200, 'OK', {
            'Content-Type': 'text/plain',
        });
        response.end('OK');
    };
})();

