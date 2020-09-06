// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

chai.Assertion.addMethod('tw_field', function(fieldName, fieldValue) {
    let obj = this._obj;
    // poor man's check for "is this a tiddler?"
    new chai.Assertion('fields' in obj && 'cache' in obj && 'hasField' in obj);

    this.assert(
        fieldName in obj.fields,
        `expected field ${fieldName} to be present`,
        `expected field ${fieldName} to not be present`);

    if(fieldValue != undefined) {
        // XXX string decoding?
        this.assert(
            obj.fields[fieldName] == fieldValue,
            `expected field ${fieldName} to be #{exp} but got #{act}`,
            `expected field ${fieldName} not to be #{exp} but got #{act}`,
            obj.fields[fieldName],
            fieldValue);
    }
});
