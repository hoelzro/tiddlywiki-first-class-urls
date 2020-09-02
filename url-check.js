/*\
module-type: library

\*/

module.exports = function(location) {
    // XXX it would be nice if I could pass location in via a variable or something
    return $tw.wiki.filterTiddlers('[field:location[' + location + ']has[url_tiddler]]').length > 0;
};
