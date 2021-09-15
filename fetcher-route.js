/*\
module-type: route

GET /plugins/hoelzro/first-class-urls/fetch?url=:url

\*/
(function() {
    const MAX_REDIRECTS = 5;

    let { URL } = require('url');
    let http = require('http');
    let https = require('https');
    let zlib = require('zlib');

    let { parseDOM } = require('htmlparser2');

    let match = require('$:/plugins/hoelzro/first-class-urls/match.js');
    let logger = require('$:/plugins/hoelzro/first-class-urls/logger.js');

    exports.method = 'GET';

    exports.path = new RegExp(`^/plugins/hoelzro/first-class-urls/fetch`);

    function HTTPError(res) {
        this.res = res;
    }

    HTTPError.prototype = new Error();

    Object.defineProperty(HTTPError.prototype, 'message', {
        get() {
            return `non-2xx HTTP response ${this.statusCode}`;
        },
    });

    HTTPError.prototype.toString = function() {
        return this.message;
    };

    Object.defineProperty(HTTPError.prototype, 'statusCode', {
        get() {
            return this.res.statusCode;
        },
    });

    function performFetch(url, callback, numRedirects) {
        numRedirects = numRedirects ?? MAX_REDIRECTS;

        url = new URL(url);
        let get;
        if(url.protocol == 'https:') {
            get = https.get;
        } else {
            get = http.get;
        }
        let headers = {
            'User-Agent': 'TiddlyWikiFirstClassURLs/1.0.0',
        };
        let req = get(url, {headers}, function(res) {
            try {
                if(res.statusCode >= 200 && res.statusCode < 300) {
                    let chunks = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', function() {
                        let responseBody = Buffer.concat(chunks);
                        if('content-encoding' in res.headers) {
                            let encoding = res.headers['content-encoding'];
                            let decompress;
                            switch(encoding) {
                                case 'gzip':
                                    decompress = zlib.gunzip;
                                    break;
                                case 'br':
                                    decompress = zlib.brotliDecompress;
                                    break;
                                default:
                                    callback(new Error(`unsupported Content-Encoding: ${encoding}`));
                                    return;
                            }
                            decompress(responseBody, callback);
                            return;
                        }
                        callback(null, responseBody.toString('utf8'));
                    });
                } else if(res.statusCode >= 300 && res.statusCode < 400) {
                    if(numRedirects > 0) {
                        let newURL = new URL(res.headers.location, url);
                        performFetch(newURL, callback, numRedirects - 1);
                    } else {
                        callback(new Error('too many redirects'));
                    }
                } else {
                    callback(new HTTPError(res));
                }
            } catch(e) {
                callback(e);
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
        let matchThisURL = requestURL.searchParams.get('_url') ?? fetchThisURL;

        logger.debug(`fetching URL ${fetchThisURL}`);
        performFetch(fetchThisURL, function(error, html) {
            try {
                if(error != null) {
                    if(error instanceof HTTPError && (error.statusCode == 404 || error.statusCode == 410)) {
                        logger.debug(`failed to fetch URL ${fetchThisURL} - status = ${error.statusCode}`);
                        response.writeHead(400, 'Page Not Found', {
                            'Content-Type': 'application/json'
                        });
                        response.end('{}');
                    } else {
                        logger.error(error.toString());
                        response.writeHead(500, 'Internal Server Error', {
                            'Content-Type': 'application/json'
                        });
                        response.end('{}');
                    }
                } else {
                    logger.debug(`successfully fetched ${fetchThisURL}`);
                    let [document] = parseDOM(html);

                    logger.debug(`successfully parsed DOM for ${fetchThisURL}`);

                    let actualDocument;

                    while(document != null) {
                        // XXX just the first one?
                        if(document.nodeType == 1 && document.tagName == 'html') { // XXX MAGIC NUMBER
                            actualDocument = document;
                            break;
                        }
                        document = document.nextSibling;
                    }

                    if(!actualDocument) {
                        logger.debug(`no document node found for ${fetchThisURL}`);
                        response.writeHead(200, 'OK', {
                            'Content-Type': 'application/json'
                        });
                        response.end('{}');
                        return;
                    }

                    let extractors = [];

                    $tw.modules.forEachModuleOfType('$:/plugin/hoelzro/url-metadata-extractor', (_, module) => extractors.push(module));

                    logger.debug("available extractors:", extractors.map(e => e.name));

                    let extractorPatterns = extractors.map(e => e.pattern);

                    logger.debug(`matching extractors against ${matchThisURL}`);

                    let bestMatch = match(extractorPatterns, matchThisURL);
                    let bestExtractor = extractors[bestMatch];

                    logger.debug(`${bestExtractor.name} is best extractor for ${matchThisURL}`);

                    let result = bestExtractor.extract(fetchThisURL, actualDocument);
                    if(!(result instanceof Promise)) {
                        result = Promise.resolve(result);
                    }

                    result.then(function(metadata) {
                        logger.debug(`got metadata for ${fetchThisURL}:`, metadata);
                        response.writeHead(200, 'OK', {
                            'Content-Type': 'application/json'
                        });
                        metadata.url_extractor = bestExtractor.name ?? '';
                        response.end(JSON.stringify(metadata));
                    });
                }
            } catch(e) {
                logger.error(e);
                response.writeHead(500, 'Internal Server Error', {
                    'Content-Type': 'application/json'
                });
                response.end('{}');
            }
        });
    };
})();
