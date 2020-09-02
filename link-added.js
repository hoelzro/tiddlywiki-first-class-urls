/*\
module-type: library

\*/

(function() {
    let hash = require('$:/plugins/hoelzro/first-class-urls/sha1.js');
    let canonicalizeURL = require('$:/plugins/hoelzro/first-class-urls/canonicalize.js')
    let weHaveURLTiddler = require('$:/plugins/hoelzro/first-class-urls/url-check.js');

    function doRequest(url) {
        console.log('url: ', url);
        // XXX what about timeouts?
        return new Promise(function(resolve, reject) {
            $tw.utils.httpRequest({
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

    module.exports = function(wiki, links) {
        let promises = [];

        for(let link of links) {
            let canonicalURL = canonicalizeURL(link);
            let p;

            if(weHaveURLTiddler(canonicalURL)) {
                p = Promise.resolve(ALREADY_HAVE_URL);
            } else {
                let urlHash = hash(canonicalURL);
                let placeholderTitle = `Link: ${urlHash}`;

                let tiddler = new $tw.Tiddler({
                    title: placeholderTitle,
                    type: 'text/vnd.tiddlywiki',
                    url_tiddler: 'true',
                    url_tiddler_pending_fetch: 'true'
                }, wiki.getCreationFields(), wiki.getModificationFields());

                wiki.addTiddler(tiddler);

                p = doRequest(link).then(function(metadata) {
                    if('title' in metadata) {
                        let title = wiki.generateNewTitle(`Link: ${metadata.title}`);
                        // XXX set field for latest fetch time?
                        wiki.addTiddler(new $tw.Tiddler(
                            tiddler,
                            metadata,
                            {
                                title: title,
                                url_tiddler_pending_fetch: null,
                                location: link // XXX or canonicalURL?
                            }
                        ));
                        wiki.deleteTiddler(placeholderTitle);
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
})();
