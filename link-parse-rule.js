/*\
module-type: wikirule

\*/

(function(){

exports.name = 'firstclasslink';
exports.types = {inline: true};

exports.init = function(parser) {
    this.parser = parser;
    // Regexp to match
    this.matchRegExp = /~?(?:file|http|https|mailto|ftp|irc|news|data|skype):[^\s<>{}\[\]`|"\\^]+(?:\/|\b)/mg;
};

let canonicalizeURL = require('$:/plugins/hoelzro/first-class-urls/canonicalize.js')
let lookupURLTiddler = require('$:/plugins/hoelzro/first-class-urls/url-check.js');
let hash = require('$:/plugins/hoelzro/first-class-urls/sha1.js');

exports.parse = function() {
    // Move past the match
    this.parser.pos = this.matchRegExp.lastIndex;
    // Create the link unless it is suppressed
    if(this.match[0].substr(0,1) === '~') {
        return [{type: 'text', text: this.match[0].substr(1)}];
    } else {
        let location = canonicalizeURL(this.match[0]);
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
    }
};

})();
