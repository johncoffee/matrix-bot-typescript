describe('get weather', () => {

  it('should take a screenshot', () => {
    cy.pause()
    cy.visit('/nb/værvarsel/daglig-tabell/2-2618425/Danmark/Region Hovedstaden/København/København', {
      failOnStatusCode: true
    })
    cy.get('.daily-weather-list__headers')
      .first().scrollIntoView()
    cy.screenshot({
      capture: "viewport"
    })
  })

})