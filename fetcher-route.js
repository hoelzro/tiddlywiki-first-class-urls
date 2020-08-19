/*\
title: $:/plugins/hoelzro/first-class-urls/fetcher-route.js
type: application/javascript
module-type: route

POST /plugins/hoelzro/first-class-urls/fetch?url=:url

\*/
(function() {
    let { URL } = require('url');
    let fs = require('fs');
    let { parseDOM } = require('htmlparser2');

    exports.method = 'POST';

    exports.path = new RegExp(`^/plugins/hoelzro/first-class-urls/fetch`);

    // XXX DEBUG
    function performFetch(url, callback) {
        fs.readFile('sample.html', {encoding:'utf-8'}, function(error, data) {
            if(error != null) {
                callback(error);
            } else {
                callback(null, data);
            }
        });
    }

    exports.handler = function(request, response, state) {
        let requestURL = new URL('http://localhost' + request.url);
        let fetchThisURL = requestURL.searchParams.get('url');

        performFetch(fetchThisURL, function(error, html) {
            if(error != null) {
                console.log(error);
                response.writeHead(500, 'Internal Server Error', {
                    'Content-Type': 'application/json'
                });
                response.end('{}');
            } else {
                let [document] = parseDOM(html);

                let actualDocument;

                while(document != null) {
                    // XXX just the first one?
                    if(document.nodeType == 1 && document.tagName == 'html') { // XXX MAGIC NUMBER
                        actualDocument = document;
                        break;
                    }
                    document = document.nextSibling;
                }

                let allMetadata = {};

                $tw.modules.forEachModuleOfType('$:/plugin/hoelzro/url-metadata-extractor', function(title, module) {
                    // XXX async
                    let metadata = module.extract(fetchThisURL, actualDocument);
                    Object.assign(allMetadata, metadata);
                });

                response.writeHead(200, 'OK', {
                    'Content-Type': 'application/json'
                });
                response.end(JSON.stringify(allMetadata));
            }
        });
    };
})();
