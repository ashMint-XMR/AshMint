import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../lib/config.mjs";

test("production mode fails closed without an audited burn verifier", () => {
  const config = loadConfig({ XMR_LAUNCH_ENABLED: "true", XMR_WALLET_RPC_URL: "http://wallet", XMR_WALLET_RPC_USER: "user", XMR_WALLET_RPC_PASSWORD: "pass", XMR_BURN_ADDRESS: "4burn", XMR_BURN_POLICY_COMMITMENT: "a".repeat(64) });
  assert.equal(config.productionReady, false); assert.match(config.blockers.join(" "), /XMR_BURN_VERIFIER_PATH/);
});

test("stagenet can be launched only with its explicit test-only verifier", () => {
  const config = loadConfig({ XMR_NETWORK: "stagenet", XMR_STAGING_ACKNOWLEDGED: "true", XMR_LAUNCH_ENABLED: "true", XMR_WALLET_RPC_URL: "http://wallet", XMR_WALLET_RPC_USER: "user", XMR_WALLET_RPC_PASSWORD: "pass", XMR_BURN_ADDRESS: "5stage", XMR_BURN_POLICY_COMMITMENT: "a".repeat(64), XMR_BURN_VERIFIER: "monero-burn-stagenet-v0", XMR_BURN_VERIFIER_PATH: "node" });
  assert.equal(config.launchReady, true); assert.equal(config.productionReady, false);
});
