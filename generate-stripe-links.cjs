const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createLink(name, priceCents, interval) {
  const product = await stripe.products.create({ name });
  const priceData = {
    product: product.id,
    unit_amount: priceCents,
    currency: 'usd'
  };
  if (interval) {
    priceData.recurring = { interval };
  }
  const price = await stripe.prices.create(priceData);
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }]
  });
  console.log(`${name}: ${paymentLink.url} | PriceID: ${price.id}`);
}

async function run() {
  await createLink('Starter', 999, 'month');
  await createLink('Pro Starter', 1999, 'month');
  await createLink('Operator OS', 9900, 'month');
  await createLink('Launch Sprint', 250000, null);
  await createLink('Enterprise Deployment', 4999, 'month');
}

run().catch(console.error);
