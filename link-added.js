/*\
module-type: library

\*/

(function() {
    let hash = require('$:/plugins/hoelzro/first-class-urls/sha1.js');
    let canonicalizeURL = require('$:/plugins/hoelzro/first-class-urls/canonicalize.js')
    let weHaveURLTiddler = require('$:/plugins/hoelzro/first-class-urls/url-check.js');
    let logger = require('$:/plugins/hoelzro/first-class-urls/logger.js');

    const ALREADY_HAVE_URL = Symbol('ALREADY_HAVE_URL');
    const NO_METADATA_TITLE = Symbol('NO_METADATA_TITLE');

    function doRequest(url, httpRequest) {
        logger.log('url: ', url);
        // XXX what about timeouts?
        return new Promise(function(resolve, reject) {
            httpRequest({
                url: '/plugins/hoelzro/first-class-urls/fetch?url=' + encodeURIComponent(url),
                callback: function(error, responseText) {
                    if(error != null) {
                        reject(error);
                    } else {
                        try {
                            let responseJSON = JSON.parse(responseText);
                            resolve(responseJSON);
                        } catch(e) {
                            reject(e);
                        }
                    }
                }
            });
        });
    }

    module.exports = function(wiki, links, extraFields, httpRequest) {
        extraFields = extraFields ?? {};
        let promises = [];

        for(let link of links) {
            let canonicalURL = canonicalizeURL(link);
            let p;

            if(weHaveURLTiddler(canonicalURL)) {
                p = Promise.resolve(ALREADY_HAVE_URL);
            } else {
                let urlHash = hash(canonicalURL);
                let placeholderTitle = `Link: ${urlHash}`;
                logger.debug(`temporary title for ${canonicalURL} while we fetch metadata: ${placeholderTitle}`);

                let tiddler = new $tw.Tiddler({
                    title: placeholderTitle,
                    type: 'text/vnd.tiddlywiki',
                    location: link, // XXX or canonicalURL?
                    url_tiddler: 'true',
                    url_tiddler_pending_fetch: 'true'
                }, wiki.getCreationFields(), wiki.getModificationFields());

                wiki.addTiddler(tiddler);

                p = doRequest(link, httpRequest ?? $tw.utils.httpRequest).then(function(metadata) {
                    if('title' in metadata) {
                        let title = wiki.generateNewTitle(metadata.title.replace(/[\[\]\{\}\|]/, ''));
                        let text = link;
                        if('description' in metadata) {
                            text += '\n\n' + metadata.description;
                        }
                        logger.debug(`Successful fetch for ${canonicalURL}; adding tiddler ${title}`);
                        // XXX set field for latest fetch time?
                        wiki.addTiddler(new $tw.Tiddler(
                            extraFields,
                            tiddler,
                            { text },
                            metadata,
                            {
                                title: title,
                                url_tiddler_pending_fetch: null,
                                location: link // XXX or canonicalURL?
                            }
                        ));
                        logger.debug(`Deleting ${placeholderTitle}`);
                        wiki.deleteTiddler(placeholderTitle);

                        return title;
                    } else {
                        return NO_METADATA_TITLE;
                    }
                }, function(error) {
                    // XXX handle the error
                    // XXX add error data, plus things like "# attempted fetches" and "last attempt time" to tiddler?
                    throw error;
                });
            }

            promises.push(p);
        }

        return Promise.all(promises);
    };

    module.exports.onLinksAdded = module.exports;
    module.exports.NO_METADATA_TITLE = NO_METADATA_TITLE;
    module.exports.ALREADY_HAVE_URL = ALREADY_HAVE_URL;
})();
