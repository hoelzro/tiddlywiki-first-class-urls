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

// XXX how to start with blank slate?
//       mock XHR for TW saves?
// XXX helpers for which tiddlers are visible, other TW things
// XXX fail tests if you see the TW exception banner ("Internal JavaScript Error")

describe('Import functionality', function() {
  it('Handles pastes appropriately', function() {
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

    cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

    // XXX helper function to get story list or something
    cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

    // XXX wait for server to respond?

    // XXX helper function to get element within tiddler
    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('button').contains('Import').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('a.tc-tiddlylink').contains('goquery').click();

    // XXX check fields on new tiddler
  });

  it('Should handle duplicate imports', function() {
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

    cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('button').contains('Import').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"] button[aria-label="close"]').click();

    cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', 'https://github.com/PuerkitoBio/goquery');

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"] div.tc-import td input[type=checkbox]');

    cy.get('div.tc-import td input[type=checkbox]').should('not.be.checked');
  });

  it('Should not blow away existing tiddlers with the same name', function() {
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

    // XXX helper function to get element within tiddler
    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('button').contains('Import').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('a.tc-tiddlylink').contains('goquery').click();

    cy.get('div.tc-search input[type="search"]').type('PuerkitoBio');

    cy.get('div.tc-search-results a.tc-tiddlylink').contains('PuerkitoBio').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="GitHub - PuerkitoBio/goquery: A little like that j-thing, only in Go."] div.tc-tiddler-body').contains('test tiddler content');
  });

  it('Should handle non-URL pastes', function() {
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

    cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', "Just some text, don't worry about it");

    // XXX helper function to get story list or something
    cy.window().then(win => win.$tw.wiki.getTiddler('$:/StoryList').fields.list).should('include', '$:/Import');

    // XXX wait for server to respond?

    // XXX helper function to get element within tiddler
    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('button').contains('Import').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="$:/Import"]').get('a.tc-tiddlylink').contains('Untitled').click();

    cy.get('div.tc-tiddler-frame[data-tiddler-title="Untitled"]').get('div.tc-tiddler-body').contains("Just some text, don't worry about it");

    // XXX check fields on new tiddler
  });
});
