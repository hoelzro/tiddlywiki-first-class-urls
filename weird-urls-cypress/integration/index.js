let serverURL = `http://${Cypress.env('TIDDLYWIKI_HOST')}:9091`;
let targetURL = Cypress.env('TIDDLYWIKI_TARGET_URL');

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

// XXX do paste as well as drag and drop
describe(`testing ${targetURL}`, function() {
    it('shenanigans', function() {
        cy.visit(serverURL);

        cyPaste(cy.get('div.tc-site-subtitle'), 'text/plain', targetURL);

        cy.wait(5000);
    });
});
