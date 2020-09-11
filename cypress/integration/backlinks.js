let twCypress = require('./tiddlywiki-cypress');

describe('Backlinks functionality', function() {
    it("Contains backlinks to URL tiddlers even when referenced by URL", function() {
        twCypress.makeServer();
        cy.visit('http://localhost:9091');

        // Add a URL tiddler
        twCypress.addTiddler({
            title: 'Link: Example Domain',
            type: 'text/vnd.tiddlywiki',
            created: '20200902023415000',
            modified: '20200902023415000',
            location: 'https://example.com',
            url_tiddler: 'true',
        });

        // Add some tiddlers that link to that URL tiddler
        let tiddlerData = [
            [ 'Tiddler 1', 'https://example.com' ],
            [ 'Tiddler 2', '[[Link: Example Domain]]' ],
            [ 'Tiddler 3', '[[Example|https://example.com]]' ],
            [ 'Tiddler 4', '[[Example|Link: Example Domain]]' ],
            [ 'Tiddler 5', 'http://exmaple.com' ],
        ];

        for(let [title, text] of tiddlerData) {
            twCypress.addTiddler({
                title,
                text,

                type: 'text/vnd.tiddlywiki',
                created: '20200902023415000',
                modified: '20200902023415000',
            });
        }

        cy.window().then(win => win.$tw.wiki.filterTiddlers('[[Link: Example Domain]] +[backlinks[]]'))
            .should('include', 'Tiddler 1')
            .should('include', 'Tiddler 2')
            .should('include', 'Tiddler 3')
            .should('include', 'Tiddler 4')
            .should('not.include', 'Tiddler 5');
    });
});
