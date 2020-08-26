/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectAll } = require('css-select');
    let { getText } = require('domutils');

    exports.extract = function(url, dom) {
        let metaTags = selectAll('meta[name^="twitter:"]', dom);
        for(let meta of metaTags) {
            console.log(meta.attribs.name, meta.attribs.content);
        }
        return {};
    };
})();
