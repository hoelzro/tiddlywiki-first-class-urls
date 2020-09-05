let twCypress = require('./tiddlywiki-cypress');

describe('Render functionality', function() {
    it("Displays the site's title rather than link text when rendering a link", function() {
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

        // Add a new tiddler that links to that URL
        twCypress.pageControls.newTiddler().click();
        twCypress.editor().type('Example link: https://example.com');
        twCypress.editToolbarControls.save().click();
        twCypress.getStoryListTiddlerBodyElement('New Tiddler').find('a').contains('Example Domain').should('have.attr', 'href', 'https://example.com');
        twCypress.getStoryListTiddlerBodyElement('New Tiddler').find('a').contains('🔗').should('have.attr', 'href', '#Link%3A%20Example%20Domain');
    });
});
