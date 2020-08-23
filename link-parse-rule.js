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

        return [{
            type: 'set',
            attributes: {
                name: {type: 'string', value: 'location'},
                value: {type: 'string', value: location}
            },
            children: [{
                type: 'list',
                isBlock: false, // XXX are you sure?
                attributes: {
                    filter: {
                        type: 'string',
                        // XXX duplicated functionality from import-handler.js
                        value: '[field:location<location>has[url_tiddler]!has[draft.of]] ~[<location>]'
                    },
                    template: {
                        type: 'string',
                        value: '$:/plugins/hoelzro/first-class-urls/link-template'
                    }
                }
            }]
        }];
    }
};

})();
