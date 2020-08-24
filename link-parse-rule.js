/*\
title: $:/plugins/hoelzro/first-class-urls/link-parse-rule.js
type: application/javascript
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

// XXX duplicated functionality
function canonicalizeURL(url) {
    return url;
}

exports.parse = function() {
    // Move past the match
    this.parser.pos = this.matchRegExp.lastIndex;
    // Create the link unless it is suppressed
    if(this.match[0].substr(0,1) === '~') {
        return [{type: 'text', text: this.match[0].substr(1)}];
    } else {
        let location = canonicalizeURL(this.match[0]);
        let fauxWidget = {
            getVariable(variableName, options) {
                if(variableName == 'location') {
                    return location;
                }
                if(options && 'defaultValue' in options) {
                    return options.defaultValue;
                } else {
                    return null;
                }
            }
        };

        let [matchingURLTiddler] = $tw.wiki.filterTiddlers('[field:location<location>has[url_tiddler]!has[draft.of]]', fauxWidget);
        if(matchingURLTiddler == null) {
            // XXX handle it
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
