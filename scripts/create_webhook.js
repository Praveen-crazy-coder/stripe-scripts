require("dotenv").config();
const Stripe = require("stripe");

const sandboxStripe = Stripe(process.env.SANDBOX_KEY);
const webhookEndpointUrl = "https://tap.test4.joindeleteme.com/integration/api/external/stripe-event-handler";

(async () => {
  try {
    const CheckoutWebhookEventHandler = await sandboxStripe.webhookEndpoints.create(
        {
          enabled_events: ['checkout.session.completed'],
          url: webhookEndpointUrl
        });

    const InvoiceWebhookEventHandler = await sandboxStripe.webhookEndpoints.create(
        {
          enabled_events: ['invoice.finalized'],
          url: webhookEndpointUrl // ✅ FIXED: typo here, was `webhookEndpointUr`
        });

    console.log("Checkout Webhook:", CheckoutWebhookEventHandler.id);
    console.log("Invoice Webhook:", InvoiceWebhookEventHandler.id);
  } catch (error) {
    console.error("Error creating webhook:", error);
  }
})();
