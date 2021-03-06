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
            ['title', 'meta[property="og:title"]', elems => elems[0].attribs.content.trim()],
            ['goodreads_authors', 'div#bookAuthors a.authorName span[itemprop="name"]', elems => $tw.utils.stringifyList(elems.map(e => getText(e).trim()))],
            ['description', 'div#descriptionContainer div#description span[id^="freeText"]:not([id^="freeTextContainer"])', elems => getText(elems[0]).trim()],
            ['description', 'div#descriptionContainer div#description span[id^="freeText"]', elems => getText(elems[0]).trim()],
            ['isbn', 'meta[property="books:isbn"]', elems => elems[0].attribs.content.trim()],
            ['isbn', '#bookDataBox .infoBoxRowItem[itemprop="isbn"]', elems => getText(elems[0]).trim()],
            ['goodreads_series', '#bookSeries', elems => getText(elems[0]).trim()],
            ['goodreads_rating', 'span[itemprop="ratingValue"]', elems => getText(elems[0]).trim()],
            ['goodreads_pages', 'meta[property="books:page_count"]', elems => elems[0].attribs.content.trim()],
            ['goodreads_pages', 'span[itemprop="numberOfPages"]', elems => getText(elems[0]).trim().replace(/\s+pages$/, '')],
            ['goodreads_original_title', '#bookDataBox .infoBoxRowTitle:contains("Original Title") ~ .infoBoxRowItem', elems => getText(elems[0]).trim()],
            ['goodreads_location', '#bookDataBox .infoBoxRowTitle:contains("URL") ~ .infoBoxRowItem', elems => getText(elems[0]).trim()],
            ['goodreads_genres', 'a.bookPageGenreLink[href^="/genres/"]', elems => $tw.utils.stringifyList(Array.from(new Set(elems.map(e => getText(e)))).sort())],
        ];

        for(let [metadataField, selector, extractContent] of matchers) {
            if(metadata.hasOwnProperty(metadataField)) {
                continue;
            }

            let matchingElements = selectAll(selector, dom);
            if(matchingElements.length > 0) {
                let value = extractContent(matchingElements);
                if(value !== null && value !== '') {
                    metadata[metadataField] = value;
                }
            }
        }

        if('goodreads_original_title' in metadata && metadata.goodreads_original_title == metadata.title) {
            delete metadata.goodreads_original_title;
        }

        return metadata;
    };
})();
