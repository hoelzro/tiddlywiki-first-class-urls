/*\
module-type: wikirule

\*/

// XXX convince user to disable prettylink rule
(function(){
exports.name = 'prettyfirstclasslink';
exports.types = {inline: true};

exports.init = function(parser) {
    this.parser = parser;
    // Regexp to match
    this.matchRegExp = /\[\[(.*?)(?:\|(.*?))?\]\]/mg;
};

let canonicalizeURL = require('$:/plugins/hoelzro/first-class-urls/canonicalize.js')
let lookupURLTiddler = require('$:/plugins/hoelzro/first-class-urls/url-check.js');
let hash = require('$:/plugins/hoelzro/first-class-urls/sha1.js');

exports.parse = function() {
    // Move past the match
    this.parser.pos = this.matchRegExp.lastIndex;
    // Process the link
    var text = this.match[1],
        link = this.match[2] || text;
    if($tw.utils.isLinkExternal(link)) {
        let location = canonicalizeURL(link);
        let matchingURLTiddler = lookupURLTiddler(location);
        if(matchingURLTiddler == null) {
            // XXX should lookupURLTiddler handle this?
            let urlHash = hash(location);
            matchingURLTiddler = `Link: ${urlHash}`;
        }

        return [{
            type: 'link',
            attributes: {
                to: { type: 'string', value: matchingURLTiddler }
            },
            children: [{
                type: 'text',
                text: '🔗'
            }]
        }, {
            type: 'element',
            tag: 'a',
            attributes: {
                href: {type: 'string', value: location},
                'class': {type: 'string', value: 'tc-tiddlywiki-external'},
                target: {type: 'string', value: '_blank'},
                rel: {type: 'string', value: 'noopener noreferrer'}
            },
            children: [{
                type: 'text',
                text: matchingURLTiddler ?? location,
            }]
        }];
    } else {
        return [{
            type: "link",
            attributes: {
                to: {type: "string", value: link}
            },
            children: [{
                type: "text", text: text
            }]
        }];
    }
};

})();
