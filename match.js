/*\
module-type: library

\*/

(function() {
    function parsePattern(pattern) {
        let pieces = [];
        let m;

        if(pattern.startsWith('www.')) {
            pattern = pattern.substring(4);
        }
        if(pattern.endsWith('/')) {
            pattern = pattern.substring(0, pattern.length - 1);
        }

        while((m = pattern.match(/([*][*]?)/)) != null) {
            if(m.index != 0) {
                pieces.push({
                    type: 'literal',
                    value: pattern.substring(0, m.index),
                });
            }

            if(m[1] == '*') {
                pieces.push({
                    type: 'wildcard',
                });
            } else if(m[1] == '**') {
                pieces.push({
                    type: 'double_wildcard',
                });
            } else {
                throw new Error('unhandled case');
            }

            pattern = pattern.substring(m.index + m[1].length);
        }

        if(pattern != '') {
            pieces.push({
                type: 'literal',
                value: pattern,
            });
        }

        return pieces;
    }

    function quoteMeta(s) {
        return s.replace(/[\[\]()\\.+*?{}^$|]/g, (m) => '\\' + m);
    }

    function piecesToRegexp(pieces) {
        let rePieces = [];

        for(let { type, value } of pieces) {
            switch(type) {
                case 'literal':
                    rePieces.push(quoteMeta(value));
                    break;
                case 'wildcard':
                    rePieces.push('([^/]+)');
                    break;
                case 'double_wildcard':
                    rePieces.push('(.+)');
                    break;
                default:
                    throw new Error('unhandled case');
            }
        }

        return new RegExp('^' + rePieces.join('') + '$');
    }

    function match(patterns, target) {
        let matchingPatterns = [];

        target = target.replace(new RegExp('^http[s]?://(?:www[.])?'), '');
        if(target.endsWith('/')) {
            target = target.substring(0, target.length - 1);
        }

        for(let index = 0; index < patterns.length; index++) {
            let patternPieces = parsePattern(patterns[index]);
            let regexp = piecesToRegexp(patternPieces)

            let m = target.match(regexp);
            if(m) {
                // specificity is basically just the number of characters
                // in the target string *not* matched by a wildcard
                let specificity = target.length;
                for(let capture of m.slice(1)) {
                    specificity -= capture.length;
                }

                matchingPatterns.push({ specificity, index });
            }
        }

        if(matchingPatterns.length == 0) {
            return null;
        }


        matchingPatterns.sort((a, b) => b.specificity - a.specificity);
        return matchingPatterns[0].index;
    }

    match.match = match;

    module.exports = match;
})();
