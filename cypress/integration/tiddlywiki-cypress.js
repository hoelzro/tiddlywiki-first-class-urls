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

        cy.route({
            method: 'GET',
            url: '/plugins/hoelzro/first-class-urls/**',
            status: 404,
            response: ''
        });
    },

    mockMetadata(url, fields) {
        cy.route({
            method: 'GET',
            delay: 1000, // XXX play with this
            url: '/plugins/hoelzro/first-class-urls/fetch?url=' + url,
            status: 200,
            response: JSON.stringify(fields)
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

    getTiddler(title) {
        return cy.window().then(win => {
            function something(resolve) {
                let tiddler = win.$tw.wiki.getTiddler(title);
                console.log('returning tiddler', title, tiddler);

                if(tiddler != null) {
                    resolve(tiddler);
                } else {
                    setTimeout(something, 200, resolve);
                }
            }

            return new Promise(something);
        });
    },

    editTitlebarControls: {
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
