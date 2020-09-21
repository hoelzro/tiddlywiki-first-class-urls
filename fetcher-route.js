/*\
module-type: route

GET /plugins/hoelzro/first-class-urls/fetch?url=:url

\*/
(function() {
    let { URL } = require('url');
    let http = require('http');
    let https = require('https');
    let { parseDOM } = require('htmlparser2');

    exports.method = 'GET';

    exports.path = new RegExp(`^/plugins/hoelzro/first-class-urls/fetch`);

    function performFetch(url, callback) {
        url = new URL(url);
        let get;
        if(url.protocol == 'https:') {
            get = https.get;
        } else {
            get = http.get;
        }
        let req = get(url, function(res) {
            if(res.statusCode >= 200 && res.statusCode < 300) {
                res.setEncoding('utf8');
                let chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', function() {
                    callback(null, chunks.join(''));
                });
            } else {
                callback(new Exception(`non-2xx HTTP response ${res.statusCode}`));
            }
        });

        req.on('error', function(error) {
            callback(error);
        });

        req.end();
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

                let promises = [];

                $tw.modules.forEachModuleOfType('$:/plugin/hoelzro/url-metadata-extractor', function(title, module) {
                    let metadata = module.extract(fetchThisURL, actualDocument);
                    if(metadata instanceof Promise) {
                        promises.push(metadata);
                    } else {
                        promises.push(Promise.resolve(metadata));
                    }
                });

                Promise.all(promises).then(function(results) {
                    let allMetadata = {};
                    for(let metadata of results) {
                        Object.assign(allMetadata, metadata);
                    }

                    response.writeHead(200, 'OK', {
                        'Content-Type': 'application/json'
                    });
                    response.end(JSON.stringify(allMetadata));
                });
            }
        });
    };
})();
