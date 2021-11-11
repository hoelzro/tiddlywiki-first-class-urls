/*\
module-type: route

GET /plugins/hoelzro/first-class-urls/logs

\*/

(function() {
    let logger = require('$:/plugins/hoelzro/first-class-urls/logger.js');

    exports.method = 'GET';
    exports.path = new RegExp(`/plugins/hoelzro/first-class-urls/logs`);

    exports.handler = function(request, response, state) {
        response.writeHead(200, 'OK', {
            'Content-Type': 'text/plain',
        });
        response.end(logger.getBuffer());
    };
})();
