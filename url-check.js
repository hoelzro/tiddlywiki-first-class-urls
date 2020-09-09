/*\
module-type: library

\*/

// XXX location is expected to be a canonicalized URL
module.exports = function(location) {
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

    let [tiddler] = $tw.wiki.filterTiddlers('[field:location<location>has[url_tiddler]!has[draft.of]]', fauxWidget);
    return tiddler;
};
