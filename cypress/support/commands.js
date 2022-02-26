const { cyan } = require("colorette")

Cypress.Commands.add('login', ($email, $password) => {
    cy.contains('Email').click();
    cy.get('input[name="email"]').type($email);
    cy.contains('Password').click();
    cy.get('input[name="password"]').type($password);
    cy.get('[data-cy="submit"]').click();
})
