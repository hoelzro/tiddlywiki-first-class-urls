/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectAll, selectOne } = require('css-select');
    let { getText } = require('domutils');

    exports.pattern = 'goodreads.com/book/show/*';
    exports.name = 'goodreads';

    exports.extract = function(url, dom) {
        let openGraphMetaTags = selectAll('meta[name^="og:"], meta[property^="og:"]', dom);

        let metadata = {};

        for(let meta of openGraphMetaTags) {
            switch(meta.attribs.property) {
                case 'og:title':
                    metadata.title = meta.attribs.content;
                    break;
            }
        }

        let authorElements = selectAll('div#bookAuthors a.authorName span[itemprop="name"]', dom);
        metadata.goodreads_authors = $tw.utils.stringifyList(authorElements.map(e => getText(e)));

        let descriptionElement = selectOne('div#descriptionContainer div#description span[id^="freeText"]:not([id^="freeTextContainer"])', dom);

        metadata.description = getText(descriptionElement).trim();

        return metadata;
    };
})();
