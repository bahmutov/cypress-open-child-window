// enables intelligent code completion for Cypress commands
// https://on.cypress.io/intelligent-code-completion
/// <reference types="Cypress" />

const normalVisit = () => cy.visit('index.html')

let originalWindow = null;

Cypress.Commands.add('openWindow', (url, features) => {
  if(!originalWindow){
    originalWindow = cy.state('window');
    originalWindow.APP_ID = 1; // depth 1
  }
  const w = Cypress.config('viewportWidth')
  const h = Cypress.config('viewportHeight')
  if (!features) {
    features = `width=${w}, height=${h}`
  }
  console.log('openWindow %s "%s"', url, features)

  return new Promise(resolve => {
    if (window.top.MyAltWindow && window.top.MyAltWindow.close) {
      console.log('window exists already')
      window.top.MyAltWindow.close()
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/open
    window.top.MyAltWindow = window.top.open(url, 'MyAltWindow', features)
    window.top.MyAltWindow.APP_ID = 2; // TODO: make this support n-many

    // letting page enough time to load and set "document.domain = localhost"
    // so we can access it
    setTimeout(() => {
      cy.state('document', window.top.MyAltWindow.document)
      cy.state('window', window.top.MyAltWindow)
      resolve()
    }, 500)
  })
})

/* toggle between 2 for now, could set this up to handle N-many windows */
Cypress.Commands.add('switchWindow', ()=>{
  return new Promise(resolve=>{
    if(cy.state('window').APP_ID === 1){
      // switch to our ALT window
      console.log('switching to alt popup window...')
      cy.state('document', originalWindow.top.MyAltWindow.document)
      cy.state('window', originalWindow.top.MyAltWindow)
      originalWindow.blur()
    }else{
      console.log('switching back to original window')
      // switch back to originalWindow
      cy.state('document', originalWindow.document)
      cy.state('window', originalWindow)
      originalWindow.top.MyAltWindow.blur()
    }
    window.blur();

    cy.state('window').focus()

    resolve();
  })
})

Cypress.Commands.add('closeWindow', ()=>{
  return new Promise(resolve=>{
    if(window.top.MyAltWindow && window.top.MyAltWindow.close){
      window.top.MyAltWindow.close() // close popup
      window.top.MyAltWindow = null
    }
    if(originalWindow){
      cy.state('document', originalWindow.document)
      cy.state('window', originalWindow)
    }
    cy.state('window').focus()
  resolve()
  })
})

it('counts clicks', () => {
  cy.visit('/')
  cy.get('#clicked').should('have.text', '0')
  
  cy.openWindow('/')
  cy.contains('Page body')

  cy.get('button')
    .click()
    .click()
  cy.get('#clicked').should('have.text', '2')
  
  cy.switchWindow()
  cy.get('#clicked').should('have.text', '0')
  
  cy.switchWindow()
  cy.get('#clicked').should('have.text', '2')
  
  cy.closeWindow()
  // continue testing in original window
  cy.get('button')
    .click()
  cy.get('#clicked').should('have.text', '1')
})
