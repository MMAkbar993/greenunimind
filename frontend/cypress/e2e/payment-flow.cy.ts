describe('Complete Payment Flow E2E Tests', () => {
  let teacherEmail: string;
  let studentEmail: string;
  let courseId: string;

  beforeEach(() => {
    // Generate unique emails for each test
    const timestamp = Date.now();
    teacherEmail = `teacher${timestamp}@test.com`;
    studentEmail = `student${timestamp}@test.com`;

    // Mock Stripe for testing
    cy.intercept('POST', '**/create-payment-intent', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          clientSecret: 'pi_test_client_secret',
          paymentIntentId: 'pi_test_123',
        },
      },
    }).as('createPaymentIntent');

    cy.intercept('POST', '**/stripe-connect/create-account', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          accountId: 'acct_test_123',
          isConnected: true,
          isVerified: false,
        },
      },
    }).as('createStripeAccount');

    cy.intercept('GET', '**/stripe-connect/account-status', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          isConnected: true,
          isVerified: true,
          canReceivePayments: true,
          accountId: 'acct_test_123',
        },
      },
    }).as('getAccountStatus');

    cy.intercept('POST', '**/invoices/generate/**', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          invoiceId: 'in_test_123',
          invoiceUrl: 'https://invoice.stripe.com/test',
          pdfUrl: 'https://invoice.stripe.com/test.pdf',
        },
      },
    }).as('generateInvoice');
  });

  describe('Teacher Stripe Connect Setup', () => {
    it('should complete Stripe Connect onboarding flow', () => {
      // Teacher signup
      cy.visit('/signup');
      cy.get('[data-testid="role-teacher"]').click();
      cy.get('[data-testid="first-name"]').type('John');
      cy.get('[data-testid="last-name"]').type('Doe');
      cy.get('[data-testid="email"]').type(teacherEmail);
      cy.get('[data-testid="password"]').type('password123');
      cy.get('[data-testid="confirm-password"]').type('password123');
      cy.get('[data-testid="signup-button"]').click();

      // Navigate to Stripe Connect setup
      cy.url().should('include', '/teacher/dashboard');
      cy.get('[data-testid="stripe-connect-setup"]').click();

      // Complete Stripe Connect setup
      cy.url().should('include', '/teacher/stripe-connect');
      cy.get('[data-testid="connect-stripe-button"]').click();
      cy.wait('@createStripeAccount');

      // Verify account creation success
      cy.get('[data-testid="stripe-status"]').should('contain', 'Connected');
      cy.get('[data-testid="account-id"]').should('contain', 'acct_test_123');
    });

    it('should display account status correctly', () => {
      // Login as teacher with existing Stripe account
      cy.login(teacherEmail, 'password123', 'teacher');
      cy.visit('/teacher/stripe-connect');

      cy.wait('@getAccountStatus');
      cy.get('[data-testid="stripe-status"]').should('contain', 'Verified');
      cy.get('[data-testid="can-receive-payments"]').should('contain', 'Yes');
    });
  });

  describe('Course Creation and Payment Setup', () => {
    beforeEach(() => {
      cy.login(teacherEmail, 'password123', 'teacher');
    });

    it('should create a course with payment enabled', () => {
      cy.visit('/teacher/courses/create');

      // Fill course details
      cy.get('[data-testid="course-title"]').type('Test Course for Payment');
      cy.get('[data-testid="course-description"]').type('A comprehensive test course');
      cy.get('[data-testid="course-price"]').type('99.99');
      cy.get('[data-testid="course-category"]').select('Programming');

      // Upload course thumbnail
      cy.get('[data-testid="course-thumbnail"]').selectFile('cypress/fixtures/course-thumbnail.jpg');

      // Add course content
      cy.get('[data-testid="add-lecture-button"]').click();
      cy.get('[data-testid="lecture-title"]').type('Introduction to Testing');
      cy.get('[data-testid="lecture-description"]').type('Learn the basics of testing');

      // Save course
      cy.get('[data-testid="save-course-button"]').click();

      // Verify course creation
      cy.url().should('include', '/teacher/courses');
      cy.get('[data-testid="course-card"]').should('contain', 'Test Course for Payment');
      cy.get('[data-testid="course-price"]').should('contain', '$99.99');

      // Store course ID for later tests
      cy.url().then((url) => {
        const urlParts = url.split('/');
        courseId = urlParts[urlParts.length - 1];
      });
    });
  });

  describe('Student Purchase Flow', () => {
    beforeEach(() => {
      // Ensure course exists
      cy.createTestCourse(teacherEmail, 'Test Course for Payment', 99.99).then((id) => {
        courseId = id;
      });
    });

    it('should complete full purchase flow with payment', () => {
      // Student signup
      cy.visit('/signup');
      cy.get('[data-testid="role-student"]').click();
      cy.get('[data-testid="first-name"]').type('Jane');
      cy.get('[data-testid="last-name"]').type('Student');
      cy.get('[data-testid="email"]').type(studentEmail);
      cy.get('[data-testid="password"]').type('password123');
      cy.get('[data-testid="confirm-password"]').type('password123');
      cy.get('[data-testid="signup-button"]').click();

      // Browse and select course
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').contains('Test Course for Payment').click();

      // Verify course details
      cy.get('[data-testid="course-title"]').should('contain', 'Test Course for Payment');
      cy.get('[data-testid="course-price"]').should('contain', '$99.99');

      // Start enrollment process
      cy.get('[data-testid="enroll-button"]').click();

      // Verify payment form
      cy.url().should('include', '/checkout');
      cy.get('[data-testid="payment-amount"]').should('contain', '$99.99');
      cy.get('[data-testid="course-name"]').should('contain', 'Test Course for Payment');

      // Fill payment details (using Stripe test card)
      cy.get('[data-testid="card-number"]').type('4242424242424242');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvc"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('Jane Student');

      // Submit payment
      cy.get('[data-testid="pay-button"]').click();
      cy.wait('@createPaymentIntent');

      // Verify payment success
      cy.url().should('include', '/payment/success');
      cy.get('[data-testid="payment-success"]').should('be.visible');
      cy.get('[data-testid="course-access"]').should('contain', 'You now have access');

      // Verify course enrollment
      cy.visit('/student/courses');
      cy.get('[data-testid="enrolled-course"]').should('contain', 'Test Course for Payment');
    });

    it('should handle payment failure gracefully', () => {
      // Mock payment failure
      cy.intercept('POST', '**/create-payment-intent', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Your card was declined.',
        },
      }).as('failedPayment');

      cy.login(studentEmail, 'password123', 'student');
      cy.visit(`/courses/${courseId}`);
      cy.get('[data-testid="enroll-button"]').click();

      // Fill payment details with declined card
      cy.get('[data-testid="card-number"]').type('4000000000000002');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvc"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('Jane Student');

      cy.get('[data-testid="pay-button"]').click();
      cy.wait('@failedPayment');

      // Verify error handling
      cy.get('[data-testid="payment-error"]').should('contain', 'Your card was declined');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
    });
  });

  describe('Real-time Payment Tracking', () => {
    beforeEach(() => {
      cy.login(teacherEmail, 'password123', 'teacher');
    });

    it('should display real-time payment notifications', () => {
      cy.visit('/teacher/real-time-dashboard');

      // Mock WebSocket connection
      cy.window().then((win) => {
        // Simulate real-time payment notification
        win.dispatchEvent(new CustomEvent('payment-notification', {
          detail: {
            type: 'payment_completed',
            data: {
              amount: 99.99,
              courseTitle: 'Test Course for Payment',
              studentName: 'Jane Student',
              timestamp: new Date().toISOString(),
            },
          },
        }));
      });

      // Verify notification appears
      cy.get('[data-testid="payment-notification"]').should('be.visible');
      cy.get('[data-testid="notification-amount"]').should('contain', '$99.99');
      cy.get('[data-testid="notification-course"]').should('contain', 'Test Course for Payment');
    });

    it('should update earnings in real-time', () => {
      cy.visit('/teacher/real-time-dashboard');

      // Check initial earnings
      cy.get('[data-testid="total-earnings"]').invoke('text').as('initialEarnings');

      // Simulate real-time earnings update
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('earnings-update', {
          detail: {
            amount: 69.99, // 70% of $99.99
            timestamp: new Date().toISOString(),
          },
        }));
      });

      // Verify earnings updated
      cy.get('[data-testid="total-earnings"]').should('not.contain', '@initialEarnings');
      cy.get('[data-testid="earnings-update-indicator"]').should('be.visible');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate invoice after successful payment', () => {
      // Complete a purchase first
      cy.completePurchase(studentEmail, courseId);

      // Login as teacher and check invoices
      cy.login(teacherEmail, 'password123', 'teacher');
      cy.visit('/teacher/invoices');

      cy.wait('@generateInvoice');

      // Verify invoice appears
      cy.get('[data-testid="invoice-list"]').should('contain', 'Test Course for Payment');
      cy.get('[data-testid="invoice-amount"]').should('contain', '$99.99');
      cy.get('[data-testid="invoice-status"]').should('contain', 'Paid');

      // Test invoice download
      cy.get('[data-testid="download-invoice"]').first().click();
      cy.get('[data-testid="invoice-pdf"]').should('have.attr', 'href').and('include', 'invoice.stripe.com');
    });

    it('should allow resending invoice email', () => {
      cy.intercept('POST', '**/invoices/resend/**', {
        statusCode: 200,
        body: { success: true, message: 'Invoice email resent successfully' },
      }).as('resendInvoice');

      cy.login(teacherEmail, 'password123', 'teacher');
      cy.visit('/teacher/invoices');

      cy.get('[data-testid="resend-invoice"]').first().click();
      cy.wait('@resendInvoice');

      cy.get('[data-testid="success-message"]').should('contain', 'Invoice email resent');
    });
  });

  describe('Payout Management', () => {
    beforeEach(() => {
      cy.login(teacherEmail, 'password123', 'teacher');
    });

    it('should display available balance and allow payout request', () => {
      cy.intercept('GET', '**/teacher/earnings/**', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            availableBalance: 69.99,
            pendingBalance: 0,
            totalEarnings: 69.99,
          },
        },
      }).as('getEarnings');

      cy.intercept('POST', '**/payouts/request', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            payoutId: 'po_test_123',
            amount: 69.99,
            status: 'pending',
          },
        },
      }).as('requestPayout');

      cy.visit('/teacher/payouts');
      cy.wait('@getEarnings');

      // Verify balance display
      cy.get('[data-testid="available-balance"]').should('contain', '$69.99');

      // Request payout
      cy.get('[data-testid="request-payout-button"]').click();
      cy.get('[data-testid="payout-amount"]').clear().type('69.99');
      cy.get('[data-testid="confirm-payout"]').click();
      cy.wait('@requestPayout');

      // Verify payout request success
      cy.get('[data-testid="payout-success"]').should('be.visible');
      cy.get('[data-testid="payout-status"]').should('contain', 'Pending');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/create-payment-intent', {
        forceNetworkError: true,
      }).as('networkError');

      cy.login(studentEmail, 'password123', 'student');
      cy.visit(`/courses/${courseId}`);
      cy.get('[data-testid="enroll-button"]').click();

      cy.get('[data-testid="card-number"]').type('4242424242424242');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvc"]').type('123');
      cy.get('[data-testid="cardholder-name"]').type('Jane Student');

      cy.get('[data-testid="pay-button"]').click();
      cy.wait('@networkError');

      // Verify error handling
      cy.get('[data-testid="network-error"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should prevent duplicate enrollments', () => {
      // Complete initial purchase
      cy.completePurchase(studentEmail, courseId);

      // Try to purchase again
      cy.login(studentEmail, 'password123', 'student');
      cy.visit(`/courses/${courseId}`);

      // Should show already enrolled status
      cy.get('[data-testid="already-enrolled"]').should('be.visible');
      cy.get('[data-testid="enroll-button"]').should('not.exist');
      cy.get('[data-testid="access-course"]').should('be.visible');
    });
  });
});

// Custom commands for reusable actions
Cypress.Commands.add('login', (email: string, password: string, role: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', `/${role}`);
});

Cypress.Commands.add('createTestCourse', (teacherEmail: string, title: string, price: number) => {
  return cy.request({
    method: 'POST',
    url: '/api/courses',
    headers: {
      Authorization: `Bearer ${Cypress.env('teacherToken')}`,
    },
    body: {
      title,
      description: 'Test course description',
      price,
      category: 'Programming',
    },
  }).then((response) => response.body.data._id);
});

Cypress.Commands.add('completePurchase', (studentEmail: string, courseId: string) => {
  cy.login(studentEmail, 'password123', 'student');
  cy.visit(`/courses/${courseId}`);
  cy.get('[data-testid="enroll-button"]').click();
  cy.get('[data-testid="card-number"]').type('4242424242424242');
  cy.get('[data-testid="card-expiry"]').type('12/25');
  cy.get('[data-testid="card-cvc"]').type('123');
  cy.get('[data-testid="cardholder-name"]').type('Test Student');
  cy.get('[data-testid="pay-button"]').click();
  cy.url().should('include', '/payment/success');
});
