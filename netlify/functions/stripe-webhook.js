
// Stripe Webhook Handler - Processes payments and creates accounts

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' })
    };
  }

  try {
    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function handleCheckoutCompleted(session) {
  const { metadata, customer_email, customer, subscription } = session;

  if (metadata.type === 'coach_subscription') {
    // Coach subscription completed
    const { plan, name } = metadata;

    // Create Stripe Connect Account
    const account = await stripe.accounts.create({
      type: 'express',
      email: customer_email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Create Supabase user (auth)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customer_email,
      email_confirm: true,
      user_metadata: {
        name,
        plan
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    // Create coach record in database
    const { error: dbError } = await supabase
      .from('coaches')
      .insert({
        id: authData.user.id,
        email: customer_email,
        name,
        stripe_customer_id: customer,
        stripe_account_id: account.id,
        stripe_account_onboarded: false,
        plan,
        subscription_id: subscription
      });

    if (dbError) {
      console.error('Error creating coach record:', dbError);
      throw dbError;
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.URL}/dashboard.html`,
      return_url: `${process.env.URL}/dashboard.html?onboarded=true`,
      type: 'account_onboarding',
    });

    // Send onboarding email
    await sendOnboardingEmail(customer_email, name, accountLink.url);

  } else if (metadata.type === 'customer_subscription') {
    // Customer subscription to coach's membership
    const { coachId, tierId, customerId } = metadata;

    const { error } = await supabase
      .from('customers')
      .insert({
        user_id: customerId,
        coach_id: coachId,
        tier_id: tierId,
        email: customer_email,
        stripe_customer_id: customer,
        stripe_subscription_id: subscription,
        subscription_status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      console.error('Error creating customer record:', error);
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  // Update customer subscription status
  const { error } = await supabase
    .from('customers')
    .update({ subscription_status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  // Update customer subscription status
  const { error } = await supabase
    .from('customers')
    .update({
      subscription_status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function sendOnboardingEmail(email, name, onboardingUrl) {
  try {
    await resend.emails.send({
      from: 'CoachFlow <onboarding@coachflow.de>',
      to: email,
      subject: 'Willkommen bei CoachFlow! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Willkommen bei CoachFlow!</h1>
            </div>
            <div class="content">
              <p>Hallo ${name},</p>
              
              <p>herzlichen Glückwunsch! Deine Zahlung war erfolgreich und dein CoachFlow-Account ist bereit.</p>
              
              <h3>Nächste Schritte:</h3>
              <ol>
                <li><strong>Girokonto verbinden:</strong> Klicke auf den Button unten, um dein Girokonto mit Stripe Connect zu verbinden. So erhältst du Zahlungen direkt von deinen Kunden.</li>
                <li><strong>Dashboard einrichten:</strong> Erstelle dein Membership-Tier und lade deine ersten Inhalte hoch.</li>
                <li><strong>Link teilen:</strong> Teile deinen Membership-Link mit deinen Kunden!</li>
              </ol>
              
              <a href="${onboardingUrl}" class="button">Jetzt Girokonto verbinden</a>
              
              <p>Oder kopiere diesen Link: <br><code>${onboardingUrl}</code></p>
              
              <p><strong>Dein Dashboard:</strong><br>
              <a href="${process.env.URL}/dashboard.html">${process.env.URL}/dashboard.html</a></p>
              
              <p>Bei Fragen sind wir jederzeit für dich da!</p>
              
              <p>Viel Erfolg mit CoachFlow!<br>
              Dein CoachFlow Team</p>
            </div>
            <div class="footer">
              <p>CoachFlow - Die SaaS-Plattform für Coaches</p>
              <p><a href="${process.env.URL}">www.coachflow.de</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('Onboarding email sent to:', email);
  } catch (error) {
    console.error('Error sending onboarding email:', error);
  }
}
