import { config } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { MetaConnector } from '../connectors/meta/index';
import { TikTokConnector } from '../connectors/tiktok/index';
import { GoogleConnector } from '../connectors/google/index';
import { PinterestConnector } from '../connectors/pinterest/index';
import { ShopifyConnector } from '../connectors/shopify/index';

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

async function testConnectors() {
  console.log('🔌 Testing connectors...\n');

  const rootEnvPath = path.join(process.cwd(), '.env');
  const configEnvPath = path.join(process.cwd(), 'config', '.env');
  if (existsSync(rootEnvPath)) {
    config({ path: rootEnvPath });
  } else if (existsSync(configEnvPath)) {
    config({ path: configEnvPath });
  } else {
    config();
  }

  const results: Array<{ name: string; ok: boolean; message: string }> = [];

  const metaAppId = getEnv('META_APP_ID');
  const metaAppSecret = getEnv('META_APP_SECRET');
  const metaAccessToken = getEnv('META_ACCESS_TOKEN');
  const metaBusinessId = getEnv('META_BUSINESS_ID');
  if (metaAppId && metaAppSecret && metaAccessToken && metaBusinessId) {
    const meta = new MetaConnector(metaAppId, metaAppSecret, metaAccessToken);
    const ok = await meta.connect(metaBusinessId, metaAccessToken);
    results.push({ name: 'meta', ok, message: ok ? 'connected' : 'failed' });
  } else {
    results.push({ name: 'meta', ok: false, message: 'missing env vars' });
  }

  const tiktokAppId = getEnv('TIKTOK_APP_ID');
  const tiktokAppSecret = getEnv('TIKTOK_APP_SECRET');
  const tiktokAccessToken = getEnv('TIKTOK_ACCESS_TOKEN');
  const tiktokAdvertiserId = getEnv('TIKTOK_ADVERTISER_ID');
  if (tiktokAppId && tiktokAppSecret && tiktokAccessToken && tiktokAdvertiserId) {
    const tiktok = new TikTokConnector(tiktokAppId, tiktokAppSecret, tiktokAccessToken);
    const ok = await tiktok.connect(tiktokAdvertiserId, tiktokAccessToken);
    results.push({ name: 'tiktok', ok, message: ok ? 'connected' : 'failed' });
  } else {
    results.push({ name: 'tiktok', ok: false, message: 'missing env vars' });
  }

  const googleClientId = getEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = getEnv('GOOGLE_CLIENT_SECRET');
  const googleAccessToken = getEnv('GOOGLE_ACCESS_TOKEN');
  const googleCustomerId = getEnv('GOOGLE_CUSTOMER_ID');
  if (googleClientId && googleClientSecret && googleAccessToken && googleCustomerId) {
    const google = new GoogleConnector(googleClientId, googleClientSecret, googleAccessToken);
    const ok = await google.connect(googleCustomerId, googleAccessToken);
    results.push({ name: 'google', ok, message: ok ? 'connected' : 'failed' });
  } else {
    results.push({ name: 'google', ok: false, message: 'missing env vars' });
  }

  const pinterestAppId = getEnv('PINTEREST_APP_ID');
  const pinterestAppSecret = getEnv('PINTEREST_APP_SECRET');
  const pinterestAccessToken = getEnv('PINTEREST_ACCESS_TOKEN');
  const pinterestAdAccountId = getEnv('PINTEREST_AD_ACCOUNT_ID');
  if (pinterestAppId && pinterestAppSecret && pinterestAccessToken && pinterestAdAccountId) {
    const pinterest = new PinterestConnector(pinterestAppId, pinterestAppSecret, pinterestAccessToken);
    const ok = await pinterest.connect(pinterestAccessToken);
    results.push({ name: 'pinterest', ok, message: ok ? 'connected' : 'failed' });
  } else {
    results.push({ name: 'pinterest', ok: false, message: 'missing env vars' });
  }

  const shopifyApiKey = getEnv('SHOPIFY_API_KEY');
  const shopifyApiSecret = getEnv('SHOPIFY_API_SECRET');
  const shopifyAccessToken = getEnv('SHOPIFY_ACCESS_TOKEN');
  const shopifyShopDomain = getEnv('SHOPIFY_SHOP_DOMAIN');
  if (shopifyApiKey && shopifyApiSecret && shopifyAccessToken && shopifyShopDomain) {
    const shopify = new ShopifyConnector(
      shopifyApiKey,
      shopifyApiSecret,
      shopifyShopDomain,
      shopifyAccessToken
    );
    const ok = await shopify.connect(shopifyAccessToken);
    results.push({ name: 'shopify', ok, message: ok ? 'connected' : 'failed' });
  } else {
    results.push({ name: 'shopify', ok: false, message: 'missing env vars' });
  }

  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.message}`);
  });

  if (failed.length > 0) {
    console.error('\n❌ Connector tests failed or skipped due to missing env vars');
    process.exit(1);
  }

  console.log('\n✅ All connectors tested successfully');
  process.exit(0);
}

testConnectors().catch((error) => {
  console.error('Connector tests failed:', error);
  process.exit(1);
});