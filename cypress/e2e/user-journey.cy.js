describe("Coffee Paradise - Automated Headless E2E Integration Test", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Automated Cypress Tester",
    email: `cypress_user_${timestamp}@example.com`,
    password: "Password123!",
    id: null,
  };

  beforeEach(() => {
    // Intercept all API endpoints to validate network contracts and DB operations
    cy.intercept("POST", "/api/register").as("registerApi");
    cy.intercept("POST", "/api/login").as("loginApi");
    cy.intercept("POST", "/create-checkout-session").as("stripeSessionApi");
    cy.intercept("POST", "/api/orders").as("saveOrderApi");
    cy.intercept("GET", "/api/orders").as("getOrdersApi");
  });

  it("Full User Journey: Register -> Login -> Catalog -> Checkout -> Stripe Handling & DB Writes", () => {
    // ------------------------------------------------------------------------
    // STAGE 1: REGISTER NEW USER (register.html -> DB write to PostgreSQL)
    // ------------------------------------------------------------------------
    cy.visit("/register.html");
    cy.get("#reg-name").should("be.visible").type(testUser.name);
    cy.get("#reg-email").should("be.visible").type(testUser.email);
    cy.get("#reg-password").should("be.visible").type(testUser.password);
    cy.get("#reg-btn").click();

    // Verify DB insert returned status 200 and generated user ID
    cy.wait("@registerApi").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.success).to.be.true;
      expect(interception.response.body.user).to.have.property("id");
      expect(interception.response.body.user.email).to.eq(testUser.email);

      // Save user ID for subsequent assertions
      testUser.id = interception.response.body.user.id;
    });

    // Automatically redirected to catalog.html after successful registration
    cy.url().should("include", "catalog.html");

    // ------------------------------------------------------------------------
    // STAGE 2: MEMBER LOGIN (login.html -> DB read & authentication)
    // ------------------------------------------------------------------------
    // Clear localStorage to simulate fresh login session
    cy.clearLocalStorage();
    cy.visit("/login.html");

    cy.get("#email").should("be.visible").type(testUser.email);
    cy.get("#password").should("be.visible").type(testUser.password);
    cy.get("#login-btn").click();

    // Verify DB verification returned user details
    cy.wait("@loginApi").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.success).to.be.true;
      expect(interception.response.body.user.id).to.eq(testUser.id);
    });

    // Confirm session is stored in localStorage and redirected
    cy.url().should("include", "catalog.html");
    cy.window().then((win) => {
      const user = JSON.parse(win.localStorage.getItem("currentUser") || "{}");
      expect(user.id).to.eq(testUser.id);
      expect(user.email).to.eq(testUser.email);
    });

    // ------------------------------------------------------------------------
    // STAGE 3: BROWSE CATALOG & ADD ITEMS TO CART (catalog.html)
    // ------------------------------------------------------------------------
    // Add "Espresso Blend Supreme" to cart
    cy.contains("h3", "Espresso Blend Supreme")
      .parents(".group")
      .contains("Add to Cart")
      .click();

    // Verify item is stored in localStorage cart
    cy.window().then((win) => {
      const cart = JSON.parse(win.localStorage.getItem("cart") || "[]");
      expect(cart).to.have.length.at.least(1);
      expect(cart[0].name).to.eq("Espresso Blend Supreme");
      expect(Number(cart[0].price)).to.eq(14.5);
    });

    // Click "Go to Checkout"
    cy.contains("Go to Checkout").click();
    cy.url().should("include", "checkout.html");

    // ------------------------------------------------------------------------
    // STAGE 4: CHECKOUT & STRIPE HANDLING (checkout.html)
    // ------------------------------------------------------------------------
    cy.get("#cart-list").should("contain", "Espresso Blend Supreme");
    cy.get("#total-amount").should("contain", "RM 14.50");

    // Intercept Stripe session creation and mock the redirect URL to test the full return flow
    cy.intercept("POST", "/create-checkout-session", (req) => {
      expect(req.body.items).to.be.an("array").that.is.not.empty;
      expect(req.body.items[0].name).to.eq("Espresso Blend Supreme");
      expect(req.body.userId).to.eq(testUser.id);

      req.reply({
        statusCode: 200,
        body: {
          url: `/orders.html?session_id=cs_test_mock_${Date.now()}&user_id=${testUser.id}`,
        },
      });
    }).as("mockStripeSession");

    // Initiate payment
    cy.get("#pay-btn").click();
    cy.wait("@mockStripeSession");

    // ------------------------------------------------------------------------
    // STAGE 5: STRIPE RETURN & ORDER DB WRITE (orders.html)
    // ------------------------------------------------------------------------
    cy.url().should("include", "orders.html");

    // Verify order was inserted into PostgreSQL orders table
    cy.wait("@saveOrderApi").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.success).to.be.true;
      expect(interception.response.body.order).to.have.property("order_number");
      expect(interception.response.body.order.user_id).to.eq(testUser.id);
      expect(Number(interception.response.body.order.total_amount)).to.eq(14.5);
    });

    // Verify cart was wiped from localStorage after order completion
    cy.window().then((win) => {
      expect(win.localStorage.getItem("cart")).to.be.null;
    });

    // Verify orders container exists and renders
    cy.get("#orders-container").should("be.visible");
  });
});

