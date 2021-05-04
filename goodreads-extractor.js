/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectAll, selectOne } = require('css-select');
    let { getText } = require('domutils');

    exports.pattern = 'goodreads.com/book/show/*';
    exports.name = 'goodreads';

    exports.extract = function(url, dom) {
        let metadata = {};

        let matchers = [
            ['title', '#bookTitle', elems => getText(elems[0]).trim()],
            ['title', 'meta[property="og:title"]', elems => elems[0].attribs.content],
            ['goodreads_authors', 'div#bookAuthors a.authorName span[itemprop="name"]', elems => $tw.utils.stringifyList(elems.map(e => getText(e)))],
            ['description', 'div#descriptionContainer div#description span[id^="freeText"]:not([id^="freeTextContainer"])', elems => getText(elems[0]).trim()],
            ['description', 'div#descriptionContainer div#description span[id^="freeText"]', elems => getText(elems[0]).trim()],
            ['isbn', 'meta[property="books:isbn"]', elems => elems[0].attribs.content],
            ['isbn', '#bookDataBox .infoBoxRowItem[itemprop="isbn"]', elems => getText(elems[0]).trim()],
            ['goodreads_series', '#bookSeries', elems => getText(elems[0]).trim()],
        ];

        for(let [metadataField, selector, extractContent] of matchers) {
            if(metadata.hasOwnProperty(metadataField)) {
                continue;
            }

            let matchingElements = selectAll(selector, dom);
            if(matchingElements.length > 0) {
                metadata[metadataField] = extractContent(matchingElements);
            }
        }

        return metadata;
    };
})();
