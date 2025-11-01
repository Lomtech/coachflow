
// Create Stripe Checkout Session for Coach Subscription

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { plan, email, name } = JSON.parse(event.body);

    if (!plan || !email || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Map plan to Stripe Price ID
    const priceIds = {
      basic: process.env.STRIPE_PRICE_BASIC,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      elite: process.env.STRIPE_PRICE_ELITE
    };

    const priceId = priceIds[plan];

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid plan' })
      };
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/?cancelled=true`,
      customer_email: email,
      metadata: {
        plan,
        name,
        type: 'coach_subscription'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id })
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
