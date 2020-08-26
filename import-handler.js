/*\
module-type: startup

\*/

(function() {
    exports.name = "import-handler";
    exports.platforms = ["browser"];
    exports.after = ["load-modules"];
    exports.synchronous = true;

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

    exports.startup = function() {
        $tw.wiki.addEventListener('change', function(changes) {
            // XXX transform all modified plugin-type: import tiddlers?
            if('$:/Import' in changes && changes['$:/Import'].modified) {
                let importTiddler = $tw.wiki.getTiddler('$:/Import');
                let status = importTiddler.getFieldString('status');
                let newImportFields = Object.create(null);
                if(status == 'pending' && importTiddler.getFieldString('already-imported') == '') {
                    let importData = $tw.wiki.getTiddlerData('$:/Import');
                    let promiseTitles = [];
                    let promises = [];
                    for(let title in importData.tiddlers) {
                        let text = importData.tiddlers[title].text;
                        if(text.startsWith('http://') || text.startsWith('https://')) {
                            let location = canonicalizeURL(text);
                            // XXX it would be nice if I could pass location in via a variable or something
                            if($tw.wiki.filterTiddlers('[field:location[' + location + ']has[url_tiddler]]').length > 0) {
                                newImportFields['selection-' + title] = 'unchecked';
                                newImportFields['message-' + title] = 'You already have this URL in your wiki';
                            } else {
                                let p = doRequest(text);

                                promiseTitles.push(title);
                                promises.push(p);
                            }
                        }
                    }

                    $tw.wiki.addTiddler(new $tw.Tiddler(importTiddler, {
                        'already-imported': 'true', // XXX shitty field name, but whatever (also, doesn't illustrate the state change properly)
                    }, newImportFields));

                    // XXX error handling
                    Promise.all(promises).then(function(results) {
                        let oldImportData = $tw.wiki.getTiddlerData('$:/Import'); // XXX this might have been deleted
                        let newImportData = Object.create(null);
                        newImportData.tiddlers = Object.create(null);

                        for(let oldTitle of promiseTitles) {
                            delete(oldImportData.tiddlers[oldTitle]);
                        }

                        for(let title in oldImportData.tiddlers) {
                            newImportData.tiddlers[title] = oldImportData.tiddlers[title];
                        }

                        for(let i = 0; i < results.length; i++) {
                            let title = promiseTitles[i];
                            let result = results[i];

                            if('title' in result) {
                                title = result.title;
                            } else {
                                result.title = title;
                            }

                            result.type = 'text/vnd.tiddlywiki'; // XXX type: url_tiddler?
                            result.url_tiddler = 'true';

                            // XXX theoretically we could overwrite an old import
                            //     datum if it happened to have the same title as
                            //     what the fetcher gave us
                            newImportData.tiddlers[title] = result;
                        }

                        // XXX you could have fun race condition/conflict shit here
                        let importTiddler = $tw.wiki.getTiddler('$:/Import');
                        $tw.wiki.addTiddler(new $tw.Tiddler(importTiddler, {
                            text: JSON.stringify(newImportData, null, $tw.config.preferences.jsonSpaces)
                        }));
                    });
                }
            }
        });
    };
})();
