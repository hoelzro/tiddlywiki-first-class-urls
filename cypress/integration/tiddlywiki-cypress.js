module.exports = {
    makeServer() {
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
    },

    addTiddler(fields) {
        cy.window().then(win => {
            win.$tw.wiki.addTiddler(new win.$tw.Tiddler(fields));
        });
    },

    editor() {
        return cy.get('div.tc-tiddler-edit-frame iframe.tc-edit-texteditor').its('0.contentDocument').should('exist').its('body').should('not.be.undefined').then(cy.wrap).find('textarea');
    },

    getStoryListTiddlerBodyElement(title) {
        return cy.get(`div.tc-tiddler-frame[data-tiddler-title="${title}"]`).find('div.tc-tiddler-body');
    },

    editToolbarControls: {
        save() {
            return cy.get('div.tc-tiddler-edit-frame span.tc-tiddler-controls button[aria-label="ok"]');
        }
    },

    pageControls: {
        newTiddler() {
            return cy.get('div.tc-page-controls button[aria-label="new tiddler"]'); 
        }
    }
};
