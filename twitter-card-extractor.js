/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectAll } = require('css-select');
    let { getText } = require('domutils');

    exports.extract = function(url, dom) {
        let metaTags = selectAll('meta[name^="twitter:"]', dom);
        let metadata = {};
        for(let meta of metaTags) {
            if(meta.attribs.name == 'twitter:description') {
                metadata.description = meta.attribs.content;
            }
            console.log(meta.attribs.name, meta.attribs.content);
        }
        return metadata;
    };
})();
