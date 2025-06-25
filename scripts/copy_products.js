require("dotenv").config();
const Stripe = require("stripe");

const sourceStripe = Stripe(process.env.TEST_MODE_KEY);     // Source: production or test
const destStripe = Stripe(process.env.SANDBOX_KEY);         // Destination: test/sandbox

async function copyProducts() {
  try {
    const products = await fetchAllProducts(sourceStripe);
    console.log(`Found ${products.length} products.`);

    for (const product of products) {
      try {
        const newProduct = await createProduct(destStripe, product);
        console.log(`✅ Copied product: ${product.name}`);
      } catch (err) {
        console.error(`❌ Failed to copy product ${product.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Error copying products:", err);
  }
}

async function fetchAllProducts(stripeClient) {
  const allProducts = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const response = await stripeClient.products.list({
      limit: 100,
      expand: ["data.default_price"],
      ...(startingAfter && { starting_after: startingAfter }),
    });

    allProducts.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return allProducts;
}

async function createProduct(stripeClient, p) {
  const productParams = {
    name: p.name,
    active: p.active,
    metadata: p.metadata || {},
    images: p.images || [],
  };

  // Only include optional fields if they are non-empty
  if (p.description?.trim()) {
    productParams.description = p.description;
  }

  if (p.unit_label?.trim()) {
    productParams.unit_label = p.unit_label;
  }

  if (p.tax_code?.id) {
    productParams.tax_code = p.tax_code.id;
  }

  if (p.url?.trim()) {
    productParams.url = p.url;
  }

  if (p.default_price && typeof p.default_price === "object") {
    try {
      const defaultPriceParams = createPriceParams(p.default_price);
      if (defaultPriceParams) {
        productParams.default_price_data = defaultPriceParams;
      }
    } catch (e) {
      console.warn(`⚠️ Skipping default price for product ${p.name}: ${e.message}`);
    }
  }

  return await stripeClient.products.create(productParams);
}

function createPriceParams(price) {
  if (!price.currency || !price.unit_amount) {
    throw new Error("Missing required price fields (currency/unit_amount)");
  }

  const priceParams = {
    currency: price.currency,
    unit_amount: price.unit_amount,
  };

  if (price.recurring) {
    priceParams.recurring = {
      interval: price.recurring.interval,
      interval_count: price.recurring.interval_count,
    };
  }

  return priceParams;
}

copyProducts();
