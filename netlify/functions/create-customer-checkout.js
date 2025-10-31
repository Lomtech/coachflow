
// Create Stripe Checkout for Customer Subscription to Coach

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
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
    const { coachId, tierId, customerId, customerEmail } = JSON.parse(event.body);

    if (!coachId || !tierId || !customerId || !customerEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get coach data
    const { data: coach } = await supabase
      .from('coaches')
      .select('stripe_account_id, plan')
      .eq('id', coachId)
      .single();

    if (!coach || !coach.stripe_account_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coach Stripe account not found' })
      };
    }

    // Get tier data
    const { data: tier } = await supabase
      .from('tiers')
      .select('stripe_price_id')
      .eq('id', tierId)
      .single();

    if (!tier || !tier.stripe_price_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tier not found' })
      };
    }

    // Platform fee based on coach's plan (in percentage)
    const platformFees = {
      basic: 10,    // 10%
      premium: 7,   // 7%
      elite: 5      // 5%
    };

    const applicationFeePercent = platformFees[coach.plan] || 10;

    // Create Checkout Session with Connect
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tier.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/member-portal.html?coach=${coachId}&success=true`,
      cancel_url: `${process.env.URL}/member-portal.html?coach=${coachId}&cancelled=true`,
      customer_email: customerEmail,
      payment_intent_data: {
        application_fee_amount: null, // Will be calculated based on subscription
      },
      subscription_data: {
        application_fee_percent: applicationFeePercent,
        metadata: {
          coach_id: coachId,
          tier_id: tierId,
          customer_id: customerId
        }
      },
      metadata: {
        type: 'customer_subscription',
        coachId,
        tierId,
        customerId
      }
    }, {
      stripeAccount: coach.stripe_account_id
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id })
    };
  } catch (error) {
    console.error('Error creating customer checkout:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
