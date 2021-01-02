/*\
module-type: route

PUT /plugins/hoelzro/first-class-urls/import?url=:url

\*/

(function() {
    let { URL } = require('url');

    let {handler: fetchHandler} = require('$:/plugins/hoelzro/first-class-urls/fetcher-route.js');
    let {onLinksAdded, ALREADY_HAVE_URL, NO_METADATA_TITLE} = require('$:/plugins/hoelzro/first-class-urls/link-added.js');

    exports.method = 'PUT';

    exports.path = new RegExp(`^/plugins/hoelzro/first-class-urls/import`);

    exports.handler = function(request, response, state) {
        let requestURL = new URL('http://localhost' + request.url);
        let fetchThisURL = requestURL.searchParams.get('url');
        let extraFields = {};
        try {
            extraFields = JSON.parse(state.data);
        } catch(e) {}

        let fetchStatusCode;
        let fetchStatus;
        let fetchStatusHeaders;
        let fetchBody;

        function fauxFetch({url, callback}) {
            let fauxResponse = {
                writeHead(statusCode, status, headers) {
                    fetchStatusCode = statusCode;
                    fetchStatus = status;
                    fetchStatusHeaders = headers;
                },

                end(body) {
                    if(fetchStatusCode != 200) {
                        fetchBody = body;
                        callback(new Error(fetchStatus));
                        return;
                    }

                    callback(null, body);
                },
            };

            // XXX wouldn't it be better just to extract the common logic out?
            fetchHandler(request, fauxResponse, state);
        }

        onLinksAdded($tw.wiki, [fetchThisURL], extraFields, fauxFetch).then(function([importedTitle]) {
            if(importedTitle == ALREADY_HAVE_URL) {
                response.writeHead(409, 'Conflict', {
                    'Content-Type': 'application/json'
                });
                response.end('{}');
            } else if(importedTitle == NO_METADATA_TITLE) {
                response.writeHead(400, 'Bad Request', {
                    'Content-Type': 'application/json'
                });
                response.end('{}');
            } else {
                response.writeHead(201, 'Created', {
                    'Content-Type': 'application/json'
                });
                response.end(JSON.stringify({
                    title: importedTitle
                }));
            }
        }, function(error) {
            response.writeHead(fetchStatusCode, fetchStatus, fetchStatusHeaders);
            response.end(fetchBody);
        });
    };
})();
