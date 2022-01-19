/*\
module-type: $:/plugin/hoelzro/url-metadata-extractor

\*/

(function() {
    let { selectAll } = require('css-select');

    exports.pattern = 'github.com/*/*';
    exports.name = 'github';

    exports.extract = function(url, dom) {
        let metaTags = selectAll('meta', dom);

        // XXX primary_language
        let metadata = {};
        for(let meta of metaTags) {
            if(meta.attribs.name == 'twitter:description') {
                metadata.description = meta.attribs.content.trim();
                metadata.description = metadata.description.replace(/[.]\s*Contribute to \w+\/\w+ development by creating an account on GitHub[.]\s*$/, '');
            } else if(meta.attribs.name == 'twitter:title') {
                [, metadata.github_author, metadata.github_project] = meta.attribs.content.trim().match(new RegExp('(\\w+)/(\\S+):\\s'));
            }
        }

        if(['description', 'github_author', 'github_project'].every(k => k in metadata)) {
            metadata.description = metadata.description.replace(new RegExp(`^.*${metadata.github_author}/${metadata.github_project}:\\s*`), '');
        }

        metadata.title = metadata.github_project;

        return metadata;
    };
})();
