let twCypress = require('../support/tiddlywiki-cypress');

function cyPaste(p, pasteType, pasteData) {
    let event = new Event('paste', { bubbles: true, cancelable: true });
    let items = [{
        kind: 'string',
        type: pasteType,
        getAsString(fn) {
            fn(pasteData)
        }
    }];
    event.clipboardData = {
        items: items
    };

    p.then(([elem]) => elem.dispatchEvent(event));
}

function cyDrop(p, dataType, data) {
    let event = new Event('drop', { bubbles: true, cancelable: true });
    event.dataTransfer = {
        types: [dataType],
        items: [{
            kind: 'string',
            type: dataType,
            getAsString(fn) {
                fn(data);
            }
        }],

        getData(type) {
            if(type == dataType) {
                return data;
            } else {
                return '';
            }
        }
    };
    event.dataTransfer.types = [dataType];

    p.then(([elem]) => elem.dispatchEvent(event));
}

// XXX helpers for which tiddlers are visible, other TW things
// XXX fail tests if you see the TW exception banner ("Internal JavaScript Error")
// XXX test delays with importing things - make sure we handle racy things ok

describe('Import functionality', function() {
    it('Handles pastes appropriately', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('goquery').click();

        // XXX check fields on new tiddler
    });

    it('Should handle duplicate imports', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

        // XXX wait for server to respond?
        cy.wait(5000);

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"] button[aria-label="close"]').click();

        // XXX wait for UI to settle?
        cy.wait(2000);

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"] div.tc-import td input[type=checkbox]');

        cy.get('div.tc-import td input[type=checkbox]').should('not.be.checked');

        cy.get('div.tc-import td:nth-child(3)').should('contain', 'goquery');
    });

    it('Should not blow away existing tiddlers with the same name', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cy.window().then(win => {
            win.$tw.wiki.addTiddler(new win.$tw.Tiddler({
                title: 'GitHub - PuerkitoBio/goquery: A little like that j-thing, only in Go.',
                type: 'text/vnd.tiddlywiki',
                text: 'test tiddler content'
            }));
        });

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('goquery').click();

        cy.get('div.tc-search input[type="search"]').type('PuerkitoBio');

        cy.get('div.tc-search-results a.tc-tiddlylink').contains('PuerkitoBio').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="GitHub - PuerkitoBio/goquery: A little like that j-thing, only in Go."] div.tc-tiddler-body').contains('test tiddler content');
    });

    it('Should handle non-URL pastes', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', "Just some text, don't worry about it");

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('Untitled').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="Untitled"]').find('div.tc-tiddler-body').contains("Just some text, don't worry about it");

        // XXX check fields on new tiddler
    });

    it('handles dragging a URL from the address bar (x-moz-url)', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/x-moz-url', 'https://github.com/PuerkitoBio/goquery\nPuerkitoBio/goquery: A little like that j-thing, only in Go.');

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();


        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('goquery').click();

        // XXX check fields on new tiddler
    });

    it('handles dragging a URL from the address bar (x-uri-list)', function() {
        twCypress.makeServer();

        twCypress.mockMetadata('https://github.com/PuerkitoBio/goquery', {
            title: 'goquery',
            description: 'A little like that j-thing, only in Go'
        });

        cy.visit('http://localhost:9091');

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/x-uri-list', 'https://github.com/PuerkitoBio/goquery\n#PuerkitoBio/goquery: A little like that j-thing, only in Go.');

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();


        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('goquery').click();

        // XXX check fields on new tiddler
    });

    it('handles installing a plugin', function() {
        twCypress.makeServer();

        cy.visit('http://localhost:9091');

        let testPlugin = JSON.stringify({
            "dependents": "",
            "description": "Test Plugin",
            "list": "readme",
            "name": "Test Plugin",
            "plugin-type": "plugin",
            "text": JSON.stringify({
                "tiddlers": {
                    "$:/plugins/hoelzro/test/readme": {
                        "text": "! A test plugin",
                        "title": "$:/plugins/hoelzro/test/readme"
                    },
                    "$:/plugins/hoelzro/test/noop": {
                        "text": "Does nothing",
                        "title": "$:/plugins/hoelzro/test/noop"
                    }
                }
            }),
            "title": "$:/plugins/hoelzro/test",
            "type": "application/json",
            "version": "5.1.22"
        });

        cyDrop(cy.get('div.tc-dropzone'), 'text/vnd.tiddler', testPlugin);

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX helper function to get element within tiddler
        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('$:/plugins/hoelzro/test').click();
    });

    it('handles links with no title', function() {
        twCypress.makeServer();

        cy.visit('http://localhost:9091');

        twCypress.mockMetadata('https://no-title.com/index.html', {
            description: 'no title'
        });

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://no-title.com/index.html');

        // XXX helper function to get story list or something
        cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

        // XXX wait for server to respond?
        cy.wait(5000);

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"] div.tc-import tr').should('have.length.greaterThan', 1);

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('button').contains('Import').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').find('a.tc-tiddlylink').contains('Untitled').click();

        twCypress.getTiddler('Untitled').should('have.property', 'fields').should('have.property', 'text', 'https://no-title.com/index.html');
    });

    // XXX handle multiple links, in either text/uri-list or text/x-moz-url format?
    // XXX handle tiddlers
});
