/*\
title: $:/plugins/hoelzro/first-class-urls/html-extractor.js
type: application/javascript
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectOne } = require('css-select');
    let { getText } = require('domutils');

    exports.extract = function(url, dom) {
        let titleElement = selectOne('title', dom);
        return {
            title: getText(titleElement),
            location: url,
        };
    };
})();
