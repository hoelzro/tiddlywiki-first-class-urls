/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectOne, selectAll } = require('css-select');
    let { getText } = require('domutils');

    exports.pattern = '**';
    exports.name = 'fallback';

    exports.extract = function(url, dom) {
        let titleElement = selectOne('title', dom);
        let twitterCardMetaTags = selectAll('meta[name^="twitter:"], meta[property^="twitter:"]', dom);
        let openGraphMetaTags = selectAll('meta[name^="og:"], meta[property^="og:"]', dom);

        if(titleElement == null) {
            return {};
        }

        let metadata = {
            title: getText(titleElement),
        };

        for(let meta of twitterCardMetaTags.concat(openGraphMetaTags)) {
            let name = meta.attribs.name ?? meta.attribs.property;

            switch(name) {
                case 'twitter:title':
                case 'og:title':
                    metadata.title = meta.attribs.content;
                    break;
                case 'twitter:description':
                case 'og:description':
                    metadata.description = meta.attribs.content;
                    break;
            }
        }

        return metadata;
    };
})();
