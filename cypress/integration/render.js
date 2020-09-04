describe('Render functionality', function() {
    it("Displays the site's title rather than link text when rendering a link", function() {
        cy.server();
        cy.route({
          method: 'PUT',
          url: '/recipes/default/tiddlers/**',
          status: 204,
          headers: {
            etag: '"default/' + encodeURIComponent('$:/StoryList') + '/1:"' // XXX dynamically determine this based on URL
          },
          response: ''
        });

        cy.visit('http://localhost:9091');

        // Add a URL tiddler
        cy.window().then(win => {
            win.$tw.wiki.addTiddler(new win.$tw.Tiddler({
                title: 'Link: Example Domain',
                type: 'text/vnd.tiddlywiki',
                created: '20200902023415000',
                modified: '20200902023415000',
                location: 'https://example.com',
                url_tiddler: 'true',
            }));
        });

        // Add a new tiddler that links to that URL
        cy.get('div.tc-page-controls button[aria-label="new tiddler"]').click(); 
        cy.get('div.tc-tiddler-edit-frame iframe.tc-edit-texteditor').its('0.contentDocument').should('exist').its('body').should('not.be.undefined').then(cy.wrap).find('textarea').type('Example link: https://example.com');
        cy.get('div.tc-tiddler-edit-frame span.tc-tiddler-controls button[aria-label="ok"]').click();

        cy.get('div.tc-tiddler-frame[data-tiddler-title="New Tiddler"]').find('div.tc-tiddler-body a').contains('Example Domain').should('have.attr', 'href', 'https://example.com');
        cy.get('div.tc-tiddler-frame[data-tiddler-title="New Tiddler"]').find('div.tc-tiddler-body a').contains('🔗').should('have.attr', 'href', '#Link%3A%20Example%20Domain');
    });
});
