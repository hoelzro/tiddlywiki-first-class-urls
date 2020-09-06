/*\
module-type: startup

\*/

(function() {
    exports.name = 'url-tiddler-cache-invalidator';
    exports.platforms = ['browser'];
    exports.after = ['load-modules'];
    exports.synchronous = true;

    // XXX you *could* look for tiddlers that contain the location of the URL tiddler to know what to invalidate
    exports.startup = function() {
        let currentURLTiddlers = new Set($tw.wiki.filterTiddlers('[has[url_tiddler]]'));

        // XXX we only really care if…
        //   * a URL tiddler was changed
        //   * its title was changed
        //   * there are backlinks to it
        $tw.wiki.addEventListener('change', function(changes) {
            for(let title of Object.keys(changes)) {
                let tiddler = $tw.wiki.getTiddler(title);

                // XXX if it *was* a URL tiddler and was deleted, we don't know
                //     that here - but I don't know how to handle that situation
                //     anyway, so let's just skip everything
                if(!tiddler) {
                    if(currentURLTiddlers.has(title)) {
                        // XXX how do we _really_ handle this? like, it's fine if it's a pending URL tiddler
                        currentURLTiddlers.delete(title);
                    }
                    continue;
                }

                if(!tiddler.fields.url_tiddler) {
                    if(currentURLTiddlers.has(title)) {
                        currentURLTiddlers.delete(title);
                    }
                    continue;
                }

                if(!currentURLTiddlers.has(title)) {
                    currentURLTiddlers.add(title);
                }
            }
        });
    };
})();
