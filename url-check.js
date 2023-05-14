/*\
module-type: library

\*/

// XXX location is expected to be a canonicalized URL
module.exports = function(location) {
    let source = function(iter) {
      iter(null, location);
    };
    let [tiddler] = $tw.wiki.filterTiddlers('[listed[location]has[url_tiddler]!has[draft.of]]', null, source);

    return tiddler;
};
