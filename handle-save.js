/*\
module-type: startup

\*/

(function() {
    exports.name = 'handle-save';
    exports.platforms = ['browser'];
    exports.after = ['load-modules'];
    exports.synchronous = true;

    let onLinksAdded = require('$:/plugins/hoelzro/first-class-urls/link-added.js');

    function extractLinks(tree, links) {
        // XXX better detection?
        if(tree.type == 'element' && tree.tag == 'a') {
            links.push(tree.attributes.href.value);
        }
        for(let child of (tree.children ?? [])) {
            extractLinks(child, links);
        }
    }

    exports.startup = function() {
        $tw.wiki.addEventListener('change', function(changes) {
            for(let [title, change] of Object.entries(changes)) {
                let tiddler = $tw.wiki.getTiddler(title);

                // XXX improve?
                if(!tiddler) {
                    continue;
                }

                if(tiddler.isDraft()) {
                    continue;
                }

                if(change.faked) {
                    continue;
                }

                let tree = $tw.wiki.parseTiddler(title).tree;

                let links = []
                for(let node of tree) {
                    extractLinks(node, links);
                }

                onLinksAdded($tw.wiki, links).then(function(results) {
                    console.log('good');
                }, function() {
                    console.log('bad');
                });
            }
        });
    };
})();
