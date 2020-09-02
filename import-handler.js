/*\
module-type: startup

\*/

(function() {
    exports.name = "import-handler";
    exports.platforms = ["browser"];
    exports.after = ["load-modules"];
    exports.synchronous = true;

    const ALREADY_HAVE_URL = Symbol('ALREADY_HAVE_URL');
    const NO_METADATA_TITLE = Symbol('NO_METADATA_TITLE');

    let hash = require('$:/plugins/hoelzro/first-class-urls/sha1.js');

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

    function canonicalizeURL(url) {
        return url;
    }

    function weHaveURLTiddler(location) {
        // XXX it would be nice if I could pass location in via a variable or something
        return $tw.wiki.filterTiddlers('[field:location[' + location + ']has[url_tiddler]]').length > 0;
    }

    function onLinksAdded(wiki, links) {
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
                }, wiki.getCreationFields());

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
    }

    exports.startup = function() {
        $tw.wiki.addEventListener('change', function(changes) {
            // XXX transform all modified plugin-type: import tiddlers?
            if('$:/Import' in changes && changes['$:/Import'].modified) {
                let importTiddler = $tw.wiki.getTiddler('$:/Import');
                let status = importTiddler.getFieldString('status');
                let newImportFields = Object.create(null);
                if(status == 'pending' && importTiddler.getFieldString('already-imported') == '') {
                    let importData = $tw.wiki.getTiddlerData('$:/Import');

                    let links = [];
                    let promiseTitles = [];

                    for(let title in importData.tiddlers) {
                        let text = importData.tiddlers[title].text;
                        if(text.startsWith('http://') || text.startsWith('https://')) {
                            let canonicalURL = canonicalizeURL(text);
                            if(weHaveURLTiddler(canonicalURL)) {
                                newImportFields['selection-' + title] = 'unchecked';
                                newImportFields['message-' + title] = 'You already have this URL in your wiki';
                            } else {
                                links.push(text);
                                promiseTitles.push(title);
                            }
                        }
                    }

                    $tw.wiki.addTiddler(new $tw.Tiddler(importTiddler, {
                        'already-imported': 'true', // XXX shitty field name, but whatever (also, doesn't illustrate the state change properly)
                    }, newImportFields));

                    let addedTiddlers = {};

                    let fauxWikiForImport = {
                        addTiddler(tiddler) {
                            if(tiddler.fields.url_tiddler_pending_fetch) {
                                return $tw.wiki.addTiddler(tiddler);
                            } else {
                                addedTiddlers[tiddler.fields.title] = tiddler;
                            }
                        },

                        deleteTiddler(title) {
                            $tw.wiki.deleteTiddler(title);
                        },

                        generateNewTitle(title) {
                            return $tw.wiki.generateNewTitle(title);
                        },

                        getCreationFields() {
                            return $tw.wiki.getCreationFields();
                        }
                    };

                    // XXX error handling
                    onLinksAdded(fauxWikiForImport, links).then(function(results) {
                        let oldImportData = $tw.wiki.getTiddlerData('$:/Import'); // XXX this might have been deleted
                        let newImportData = Object.create(null);
                        newImportData.tiddlers = Object.create(null);

                        for(let oldTitle of promiseTitles) {
                            delete(oldImportData.tiddlers[oldTitle]);
                        }

                        Object.assign(newImportData.tiddlers, oldImportData.tiddlers);
                        for(let [title, tiddler] of Object.entries(addedTiddlers)) {
                            let fields = {};
                            for(let field of Object.keys(tiddler.fields)) {
                                fields[field] = tiddler.getFieldString(field);
                            }
                            // XXX do we run the risk of blowing shit away?
                            newImportData.tiddlers[title] = fields;
                        }
                        $tw.wiki.addTiddler(new $tw.Tiddler(
                            $tw.wiki.getTiddler('$:/Import'),
                            { text: JSON.stringify(newImportData) }));
                    }, function(error) {
                        $tw.utils.error(error);
                    });
                }
            }
        });
    };
})();
