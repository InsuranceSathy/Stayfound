/**
 * Verifies this deployment's Dodo configuration before it takes real money.
 *
 *   npm run dodo:check
 *
 * The check that matters is the **brand**. Dodo has no brand field on a
 * checkout session — a checkout is branded by whichever brand its *product*
 * belongs to, and `brand_id` is set once, when the product is created. Omit it
 * there and Dodo silently defaults the product to the business's primary brand,
 * which for this account is NumberHill. Nothing fails: the payment succeeds,
 * the customer just sees the wrong company at checkout and on their statement.
 * That is invisible from our side, so it is asserted here instead.
 *
 * Also checks that each product's price and billing period match lib/plans.ts,
 * since Dodo charges what its product says rather than what our pricing page
 * displays.
 *
 * Read-only — it creates and changes nothing.
 */

const KEY = process.env.DODO_API_KEY;
const BRAND = process.env.DODO_BRAND_ID;
const ENVIRONMENT = process.env.DODO_ENVIRONMENT === "live" ? "live" : "test";
const HOST =
  ENVIRONMENT === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

// Mirrors lib/plans.ts. Duplicated because this is a plain .mjs script and
// cannot import the TypeScript module — a mismatch is exactly what it reports.
//
// Yearly is `optional`: the account launched with monthly products only, and
// the pricing page hides the interval toggle until all three yearly products
// exist. Missing yearly is a note; missing monthly is a failure.
const EXPECTED = [
  { plan: "SOLO", interval: "MONTHLY", usd: 29, period: "Month" },
  { plan: "TEAMS", interval: "MONTHLY", usd: 149, period: "Month" },
  { plan: "AGENCIES", interval: "MONTHLY", usd: 499, period: "Month" },
  { plan: "SOLO", interval: "YEARLY", usd: 290, period: "Year", optional: true },
  { plan: "TEAMS", interval: "YEARLY", usd: 1490, period: "Year", optional: true },
  { plan: "AGENCIES", interval: "YEARLY", usd: 4990, period: "Year", optional: true },
];

if (!KEY) {
  console.error("DODO_API_KEY is not set — nothing to check.");
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`${HOST}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

console.log(`\nDodo ${ENVIRONMENT} — ${HOST}`);

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log(`  ✗ ${msg}`);
};

// --- the brand ------------------------------------------------------------
let brandName = "(unknown)";
if (!BRAND) {
  fail("DODO_BRAND_ID is not set, so the brand of each product can't be checked.");
} else {
  try {
    const brand = await get(`/brands/${BRAND}`);
    brandName = brand.name;
    console.log(`brand: ${brand.name} (${BRAND})`);
    console.log(`  statement descriptor: ${brand.statement_descriptor ?? "—"}`);
    if (brand.enabled === false) fail("this brand is disabled in Dodo.");
    if (brand.verification_status && brand.verification_status !== "Success") {
      fail(`brand verification is "${brand.verification_status}", not Success.`);
    }
    // Cosmetic, but they're what the customer sees on the checkout page and in
    // the receipt — worth flagging while they're still easy to fix.
    if (!brand.url) console.log("  note: brand has no website url set.");
    if (!brand.image) console.log("  note: brand has no logo set.");
    if (!brand.support_email) console.log("  note: brand has no support email set.");
  } catch (err) {
    fail(`couldn't read brand ${BRAND}: ${err.message}`);
  }
}

// --- the products ---------------------------------------------------------
console.log("\nproducts:");
let yearlySet = 0;
for (const { plan, interval, usd, period, optional } of EXPECTED) {
  const varName = `DODO_PRODUCT_${plan}_${interval}`;
  const id = process.env[varName];

  if (!id) {
    if (optional) console.log(`  · ${varName} is not set (yearly plan not offered)`);
    else fail(`${varName} is not set.`);
    continue;
  }
  if (optional) yearlySet++;

  let product;
  try {
    product = await get(`/products/${id}`);
  } catch (err) {
    fail(`${varName} (${id}) could not be fetched: ${err.message}`);
    continue;
  }

  const notes = [];
  if (BRAND && product.brand_id !== BRAND) {
    notes.push(
      `WRONG BRAND — belongs to ${product.brand_id}, not ${brandName} (${BRAND})`,
    );
  }
  if (!product.is_recurring) notes.push("not a subscription product");
  const price = product.price ?? {};
  if (price.currency === "USD" && price.price !== usd * 100) {
    notes.push(`price is ${price.price / 100} USD, expected ${usd}`);
  }
  if (price.payment_frequency_interval && price.payment_frequency_interval !== period) {
    notes.push(`billed per ${price.payment_frequency_interval}, expected ${period}`);
  }

  const summary = `${plan} ${interval}  ${id}  ${JSON.stringify(product.name)}  ${
    price.price != null ? price.price / 100 : "?"
  } ${price.currency ?? ""}`;

  if (notes.length) {
    problems++;
    console.log(`  ✗ ${summary}`);
    for (const n of notes) console.log(`      ${n}`);
  } else {
    console.log(`  ✓ ${summary}`);
  }
}

// The toggle appears only when all three yearly products exist, so a partial
// set is dead config that silently does nothing.
if (yearlySet > 0 && yearlySet < 3) {
  fail(
    `only ${yearlySet} of 3 yearly products are set — the pricing page hides the yearly toggle until all three exist.`,
  );
}

// --- the rest of the wiring ----------------------------------------------
console.log("\nwiring:");
if (process.env.DODO_WEBHOOK_SECRET) {
  console.log("  ✓ DODO_WEBHOOK_SECRET is set");
} else {
  fail("DODO_WEBHOOK_SECRET is not set — the webhook fails closed without it.");
}
console.log(
  process.env.NEXT_PUBLIC_BILLING_CHECKOUT_ENABLED === "1"
    ? "  ✓ checkout is OPEN — the pricing page sells these plans"
    : "  · checkout is closed (NEXT_PUBLIC_BILLING_CHECKOUT_ENABLED is not 1)",
);

console.log(
  problems === 0
    ? "\nAll good.\n"
    : `\n${problems} problem(s) found. Brand is set when a product is created — a product on the wrong brand has to be recreated.\n`,
);
process.exit(problems === 0 ? 0 : 1);
