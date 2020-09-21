/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectOne } = require('css-select');
    let { getText } = require('domutils');

    exports.pattern = '**';

    exports.extract = function(url, dom) {
        let titleElement = selectOne('title', dom);
        return {
            title: getText(titleElement),
            location: url,
        };
    };
})();
