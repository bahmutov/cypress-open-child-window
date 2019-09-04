// enables intelligent code completion for Cypress commands
// https://on.cypress.io/intelligent-code-completion
/// <reference types="Cypress" />

const normalVisit = () => cy.visit('index.html')

Cypress.Commands.add('openWindow', (url, features) => {
  const w = Cypress.config('viewportWidth')
  const h = Cypress.config('viewportHeight')
  if (!features) {
    features = `width=${w}, height=${h}`
  }
  console.log('openWindow %s "%s"', url, features)

  return new Promise(resolve => {
    if (window.top.aut) {
      console.log('window exists already')
      window.top.aut.close()
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/open
    window.top.aut = window.top.open(url, 'aut', features)

    // letting page enough time to load and set "document.domain = localhost"
    // so we can access it
    setTimeout(() => {
      cy.state('document', window.top.aut.document)
      cy.state('window', window.top.aut)
      resolve()
    }, 500)
  })
})

it('counts clicks', () => {
  // cy.visit('/')
  cy.openWindow('/')
  cy.contains('Page body')

  cy.get('button')
    .click()
    .click()
  cy.get('#clicked').should('have.text', '2')
})
