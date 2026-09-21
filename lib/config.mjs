const required = ["XMR_WALLET_RPC_URL", "XMR_WALLET_RPC_USER", "XMR_WALLET_RPC_PASSWORD", "XMR_BURN_ADDRESS", "XMR_BURN_POLICY_COMMITMENT", "XMR_BURN_VERIFIER_PATH"];
const text = (env, key, fallback = "") => String(env[key] ?? fallback).trim();

export function loadConfig(env = process.env) {
  const launchEnabled = env.XMR_LAUNCH_ENABLED === "true";
  const missing = required.filter((key) => !text(env, key));
  const config = {
    port: Number(env.PORT || 8788), network: text(env, "XMR_NETWORK", "mainnet"), launchEnabled,
    launchId: text(env, "XMR_LAUNCH_ID", "xmr-burn-receipts-v1"), rate: BigInt(text(env, "XMR_RATE", "1000")),
    minBurnAtomic: BigInt(text(env, "XMR_MIN_BURN_ATOMIC", "100000000000")), cap: BigInt(text(env, "XMR_CAP", "100000000")),
    minConfirmations: Number(env.XMR_MIN_CONFIRMATIONS || 20), rpcUrl: text(env, "XMR_WALLET_RPC_URL"),
    rpcUser: text(env, "XMR_WALLET_RPC_USER"), rpcPassword: text(env, "XMR_WALLET_RPC_PASSWORD"),
    burnAddress: text(env, "XMR_BURN_ADDRESS"), policyCommitment: text(env, "XMR_BURN_POLICY_COMMITMENT").toLowerCase(),
    verifier: text(env, "XMR_BURN_VERIFIER", "disabled"), verifierPath: text(env, "XMR_BURN_VERIFIER_PATH"), verifierArgs: text(env, "XMR_BURN_VERIFIER_ARGS").split(/\s+/).filter(Boolean),
    stagingAcknowledged: env.XMR_STAGING_ACKNOWLEDGED === "true",
    futureToken: { symbol: text(env, "FUTURE_TOKEN_SYMBOL", "ASH"), reference: text(env, "FUTURE_TOKEN_REFERENCE") },
    dataFile: text(env, "XMR_DATA_FILE", "./data/receipts.json"),
  };
  const validCommitment = /^[a-f0-9]{64}$/.test(config.policyCommitment);
  const validFutureMint = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(config.futureToken.reference);
  const commonReady = launchEnabled && missing.length === 0 && validCommitment;
  const mainnetReady = commonReady && config.network === "mainnet" && config.verifier === "monero-burn-v1" && validFutureMint;
  const stagenetReady = commonReady && config.network === "stagenet" && config.stagingAcknowledged && config.verifier === "monero-burn-stagenet-v0";
  config.launchReady = mainnetReady || stagenetReady;
  config.productionReady = mainnetReady;
  config.blockers = [
    ...(missing.length ? [`Missing production configuration: ${missing.join(", ")}.`] : []),
    ...(launchEnabled && config.network === "mainnet" && config.verifier !== "monero-burn-v1" ? ["An audited monero-burn-v1 verifier is required."] : []),
    ...(launchEnabled && config.network === "stagenet" && config.verifier !== "monero-burn-stagenet-v0" ? ["The stagenet verifier must be monero-burn-stagenet-v0."] : []),
    ...(config.policyCommitment && !validCommitment ? ["Burn policy commitment must be a SHA-256 hex digest."] : []),
    ...(!["mainnet", "stagenet"].includes(config.network) ? ["XMR_NETWORK must be mainnet or stagenet."] : []),
    ...(config.network === "stagenet" && !config.stagingAcknowledged ? ["Set XMR_STAGING_ACKNOWLEDGED=true only for non-production stagenet testing."] : []),
    ...(config.network === "mainnet" && !validFutureMint ? ["Future $ASH token mint is not configured or invalid; receipts cannot yet be mapped to a claim mint."] : []),
    ...(!launchEnabled ? ["Launch is disabled."] : []),
  ];
  return config;
}

export function publicConfig(config) {
  return { launchId: config.launchId, network: config.network, launchEnabled: config.launchEnabled, launchReady: config.launchReady, productionReady: config.productionReady,
    rate: config.rate.toString(), minBurnAtomic: config.minBurnAtomic.toString(), cap: config.cap.toString(), minConfirmations: config.minConfirmations,
    futureToken: config.futureToken, burnAddress: config.productionReady ? config.burnAddress : null, blockers: config.blockers };
}
