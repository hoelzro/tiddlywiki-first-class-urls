/*\
title: $:/plugins/hoelzro/first-class-urls/import-handler.js
type: application/javascript
module-type: startup

\*/

(function() {
    exports.name = "commands";
    exports.platforms = ["browser"];
    exports.after = ["load-modules"];
    exports.synchronous = false;

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

    exports.startup = function() {
        $tw.wiki.addEventListener('change', function(changes) {
            // XXX transform all modified plugin-type: import tiddlers?
            if('$:/Import' in changes && changes['$:/Import'].modified) {
                let importTiddler = $tw.wiki.getTiddler('$:/Import');
                let status = importTiddler.getFieldString('status');
                if(status == 'pending' && importTiddler.getFieldString('already-imported') == '') {
                    let importData = $tw.wiki.getTiddlerData('$:/Import');
                    let promiseTitles = [];
                    let promises = [];
                    for(let title in importData.tiddlers) {
                        let text = importData.tiddlers[title].text;
                        if(text.startsWith('http://') || text.startsWith('https://')) {
                            let p = doRequest(text);

                            promiseTitles.push(title);
                            promises.push(p);
                        }
                    }

                    // XXX error handling
                    Promise.all(promises).then(function(results) {
                        let newImportData = Object.create(null);
                        newImportData.tiddlers = Object.create(null);

                        for(let i = 0; i < results.length; i++) {
                            let title = promiseTitles[i];
                            let result = results[i];

                            if('title' in result) {
                                title = result.title;
                            } else {
                                result.title = title;
                            }

                            newImportData.tiddlers[title] = result;
                        }

                        // XXX you could have fun race condition/conflict shit here
                        let importTiddler = $tw.wiki.getTiddler('$:/Import');
                        $tw.wiki.addTiddler(new $tw.Tiddler(importTiddler, {
                            'already-imported': 'true', // XXX shitty field name, but whatever
                            text: JSON.stringify(newImportData, null, $tw.config.preferences.jsonSpaces)
                        }));
                    });
                }
            }
        });
    };
})();
