export async function walletRpc(config, method, params) {
  const authorization = `Basic ${Buffer.from(`${config.rpcUser}:${config.rpcPassword}`).toString("base64")}`;
  const response = await fetch(config.rpcUrl, { method: "POST", headers: { "content-type": "application/json", authorization },
    body: JSON.stringify({ jsonrpc: "2.0", id: "xmr-burn-receipts", method, params }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Monero wallet RPC request failed.");
  const payload = await response.json();
  if (payload.error) throw new Error(`Monero wallet RPC rejected request: ${payload.error.message || "unknown error"}`);
  return payload.result;
}
