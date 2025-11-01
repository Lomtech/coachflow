
// Create Stripe Price for Coach's Tier

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
    const { coachId, name, price, description } = JSON.parse(event.body);

    if (!coachId || !name || !price || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get coach's Stripe account
    const { data: coach } = await supabase
      .from('coaches')
      .select('stripe_account_id')
      .eq('id', coachId)
      .single();

    if (!coach || !coach.stripe_account_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Coach Stripe account not found' })
      };
    }

    // Create product on connected account
    const product = await stripe.products.create({
      name: name,
      description: description,
    }, {
      stripeAccount: coach.stripe_account_id
    });

    // Create price on connected account
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price * 100, // Convert to cents
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
    }, {
      stripeAccount: coach.stripe_account_id
    });

    // Check if tier already exists
    const { data: existingTier } = await supabase
      .from('tiers')
      .select('id')
      .eq('coach_id', coachId)
      .single();

    let tier;

    if (existingTier) {
      // Update existing tier
      const { data, error } = await supabase
        .from('tiers')
        .update({
          name,
          price,
          description,
          stripe_price_id: stripePrice.id,
          stripe_product_id: product.id
        })
        .eq('id', existingTier.id)
        .select()
        .single();

      if (error) throw error;
      tier = data;
    } else {
      // Create new tier
      const { data, error } = await supabase
        .from('tiers')
        .insert({
          coach_id: coachId,
          name,
          price,
          description,
          stripe_price_id: stripePrice.id,
          stripe_product_id: product.id
        })
        .select()
        .single();

      if (error) throw error;
      tier = data;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tier })
    };
  } catch (error) {
    console.error('Error creating tier price:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
