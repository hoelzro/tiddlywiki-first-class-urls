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

describe('My First Test', () => {
  it('Handles pastes appropriately', () => {
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
});
