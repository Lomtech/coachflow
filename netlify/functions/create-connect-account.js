
// Create Stripe Connect Account for Coach

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
    const { coachId, email } = JSON.parse(event.body);

    if (!coachId || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Check if coach already has a Stripe account
    const { data: coach } = await supabase
      .from('coaches')
      .select('stripe_account_id')
      .eq('id', coachId)
      .single();

    let accountId = coach?.stripe_account_id;

    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Update coach record
      await supabase
        .from('coaches')
        .update({ stripe_account_id: accountId })
        .eq('id', coachId);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.URL}/dashboard.html`,
      return_url: `${process.env.URL}/dashboard.html?onboarded=true`,
      type: 'account_onboarding',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ accountLinkUrl: accountLink.url })
    };
  } catch (error) {
    console.error('Error creating connect account:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
