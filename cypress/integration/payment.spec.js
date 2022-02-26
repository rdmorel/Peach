describe('Highest priority tests', () => {

    beforeEach(() => {
        // goto baseUrl
        cy.visit('/');
        // verify redirect to login page
        cy.contains('Account Login');
        // login using fixture data
        cy.fixture('user.json').as('userData');
        cy.get('@userData').then(($user) =>{
            cy.login($user.email, $user.password);
        });
    });

    // Note: I'm combining test cases 1 and 2 and automating them both as a single test
    // because I make a habit of ensuring that all my automated tests clean up any data they create

    it('Schedule and Cancel Payment', () => {
        // setup dates
        const $today = new Date();
        let $months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let $monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let $thisMonth = $months[$today.getMonth()];
        let $nextMonth = $months[$today.getMonth() + 1];
        let $scheduledDate = $monthsAbbr[$today.getMonth() + 1] + ' 4';

        // schedule payment for the 4th of next month
        cy.contains('Make a payment').click();
        cy.get('.react-datepicker-wrapper').click();
        cy.get('.react-datepicker').within(() => {
            // if it's December, change the year too
            if ($thisMonth == 'December') {
                cy.get('input[class*="DatepickerStyles__InputYear"]').clear().type($today.getFullYear() + 1);
            }
            cy.contains($thisMonth).click();
            cy.contains($nextMonth).click();
            cy.get('.react-datepicker__day--004').eq(0).click();
        });

        // enter $3.33
        cy.get('[data-cy="radio-other_amount"]').click();
        cy.get('input[placeholder="0.00"]').type('3.33');
        // select payment method
        cy.get('div[class*="InlinePaymentSelection__SelectWrapper"]').click().within(() => {
            cy.contains('Bank Account').click();
        });
        // submit and confirm
        cy.get('[data-cy="submit"]').click();
        cy.get('[data-cy="modal-submit"]').click();
        // validate confirmation message
        cy.contains('Payment was successfully scheduled.');
        cy.get('[data-cy="submit"]').click();

        // validate payment appears on homepage
        cy.get('section[class*="InfoCardContainer"]').within(() => {
            cy.contains($scheduledDate).closest('[data-cy="loan-timeline-card"]').within(() => {
                cy.contains('- $3.33').eq(0).click();
                // save payment ID for future validation
                cy.contains('Payment ID').parent().within(() => {
                    cy.get('div').within(() => {
                        cy.get('span').invoke('text').then(($text) => {
                            cy.wrap($text).as('paymentId');
                        });
                    });
                });
                // cancel payment
                cy.contains('Cancel').click({force: true});
            });
        });
        cy.get('button:contains(Yes)').click();
        cy.get('[data-testid="modal-content"]').should('not.exist');

        // confirm payment no longer appears
        cy.get('section[class*="InfoCardContainer"]').within(($container) => {
            // if payments still exist on scheduled date, expand them
            if ($container.find(`div:contains(${$scheduledDate})`).length > 0) {
                // first check the payment that's already expanded before it gets closed by the .each() command
                cy.get('@paymentId').then(($paymentId) => {
                    cy.contains($paymentId).should('not.exist');
                });
                // toggle expand/collapse for all payments matching payment amount
                cy.get('span:contains(- $3.33)').each(($element) => {
                    cy.wrap($element).click();
                });
            };
        });
        // now that all payments are expanded, check none match payment ID
        cy.get('@paymentId').then(($paymentId) => {
            cy.contains($paymentId).should('not.exist');
        });
    });
});
