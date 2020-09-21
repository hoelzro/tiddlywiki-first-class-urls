let assert = require('assert');
let match = require('../match.js');

function permute(values) {
    if(values.length == 1) {
        return [values];
    }

    let results = [];

    let first = values[0];
    let rest = values.slice(1);
    for(let subPerm of permute(rest)) {
        for(let insertIndex = 0; insertIndex <= subPerm.length; insertIndex++) {
            let result = subPerm.slice(0);
            result.splice(insertIndex, 0, first);
            results.push(result);
        }
    }


    return results;
}

function testBasic() {
    let url = 'https://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';
    let patterns = [
        'github.com/*/*/issues/*',
    ];

    let bestMatch = match(patterns, url);
    assert.strictEqual(bestMatch, 0);
}

function testSchemeDoesntMatter() {
    let httpsUrl = 'https://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';
    let patterns = [
        'github.com/*/*/issues/*',
    ];

    let bestMatch = match(patterns, httpsUrl);
    assert.strictEqual(bestMatch, 0);

    let httpUrl = 'http://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';

    bestMatch = match(patterns, httpUrl);
    assert.strictEqual(bestMatch, 0);
}

function testWWWStripped() {
    let url = 'https://www.github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';
    let patterns = [
        'github.com/*/*/issues/*',
    ];
    let bestMatch = match(patterns, url);
    assert.strictEqual(bestMatch, 0);

    url = 'https://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';
    patterns = [
        'www.github.com/*/*/issues/*',
    ];
    bestMatch = match(patterns, url);
    assert.strictEqual(bestMatch, 0);
}

function testTrailingSlashDoesntMatter() {
    let url = 'https://www.github.com/hoelzro/tiddlywiki-first-class-urls/issues/47/';
    let patterns = [
        'github.com/*/*/issues/*',
    ];
    let bestMatch = match(patterns, url);
    assert.strictEqual(bestMatch, 0);

    url = 'https://www.github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';
    patterns = [
        'github.com/*/*/issues/*/',
    ];
    bestMatch = match(patterns, url);
    assert.strictEqual(bestMatch, 0);
}

// XXX what about github.com/* vs github.com/**?
function testSpecificity() {
    let patterns = [
        'github.com/*/*/issues/*',
        'github.com/**/issues/*',
        'github.com/**',
    ];

    let mostSpecificPattern = 'github.com/*/*/issues/*';

    let url = 'https://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';

    for(let perm of permute(patterns)) {
        let bestMatch = match(perm, url)
        assert.notStrictEqual(bestMatch, null);
        assert.strictEqual(perm[bestMatch], mostSpecificPattern);
    }
}

function testSpecificityTie() {
    let patterns = [
        'github.com/*/*/issues/*',
        'github.com/**/issues/*',
        'github.com/**',
        'github.com/*/*/issues/*', // repeat the first pattern to effect a specificity tie
    ];

    let mostSpecificPattern = 'github.com/*/*/issues/*';

    let url = 'https://github.com/hoelzro/tiddlywiki-first-class-urls/issues/47';

    for(let perm of permute(patterns)) {
        let firstIndex = perm.indexOf(mostSpecificPattern);
        let secondIndex = perm.lastIndexOf(mostSpecificPattern);

        let bestMatch = match(perm, url)
        assert.strictEqual(bestMatch, firstIndex);
    }
}

// XXX what about URL query? URL fragment?

let tests = [
    testBasic,
    testSchemeDoesntMatter,
    testWWWStripped,
    testTrailingSlashDoesntMatter,
    testSpecificity,
    testSpecificityTie,
];

for(let test of tests) {
    test();
}
