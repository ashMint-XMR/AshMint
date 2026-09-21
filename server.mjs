import http from "node:http";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig, publicConfig } from "./lib/config.mjs";
import { walletRpc } from "./lib/rpc.mjs";
import { verifyBurnPolicy } from "./lib/verifier.mjs";
import { ReceiptStore } from "./lib/store.mjs";

const config = loadConfig(); const store = new ReceiptStore(config.dataFile); const requests = new Map();
const demoReceipts = [];
const here = path.dirname(fileURLToPath(import.meta.url));
const securityHeaders = { "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer", "content-security-policy": "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; connect-src 'self'" };
const send = (res, status, body) => { const data = JSON.stringify(body); res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...securityHeaders }); res.end(data); };
function limited(req) { const key = req.socket.remoteAddress || "unknown"; const now = Date.now(); const value = requests.get(key) || { at: now, count: 0 }; if (now - value.at > 60_000) { value.at = now; value.count = 0; } value.count += 1; requests.set(key, value); return value.count > 20; }
async function json(req) { const chunks = []; let size = 0; for await (const chunk of req) { size += chunk.length; if (size > 16_384) throw new Error("Request body is too large."); chunks.push(chunk); } return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
const txid = (value) => { if (!/^[a-f0-9]{64}$/i.test(String(value))) throw new Error("Invalid transaction ID."); return String(value).toLowerCase(); };

async function demoClaim(req, res) {
  const body = await json(req); const id = txid(body.txid);
  if (typeof body.recipient !== "string" || body.recipient.trim().length < 3 || body.recipient.length > 200) throw new Error("A test recipient is required.");
  const burned = BigInt(body.burnAtomic || 0);
  if (burned < config.minBurnAtomic) throw new Error("Test burn amount is below the minimum.");
  if (demoReceipts.some((item) => item.txid === id)) throw new Error("Test transaction already has a receipt.");
  const amount = (burned * config.rate) / 1_000_000_000_000n;
  const receipt = { txid: id, recipient: body.recipient.trim(), burnAtomic: burned.toString(), amount: amount.toString(), confirmations: config.minConfirmations, acceptedAt: new Date().toISOString(), simulated: true };
  demoReceipts.push(receipt); return send(res, 201, { receipt, warning: "Simulated local testnet receipt; no Monero transaction was checked." });
}

async function claim(req, res) {
  if (!config.launchReady) return send(res, 503, { error: "Launch is not ready.", blockers: config.blockers });
  const body = await json(req); const id = txid(body.txid);
  if (typeof body.txKey !== "string" || !/^[a-f0-9]{64}$/i.test(body.txKey)) throw new Error("A 32-byte transaction key is required.");
  if (typeof body.recipient !== "string" || body.recipient.trim().length < 3 || body.recipient.length > 200) throw new Error("A future-token recipient is required.");
  const result = await walletRpc(config, "check_tx_key", { txid: id, tx_key: body.txKey, address: config.burnAddress });
  const receivedAtomic = BigInt(result.received || 0);
  if (result.in_pool || Number(result.confirmations || 0) < config.minConfirmations) throw new Error("Transaction lacks required confirmations.");
  if (receivedAtomic < config.minBurnAtomic) throw new Error("Burn amount is below the launch minimum.");
  await verifyBurnPolicy(config, { txid: id, txKey: body.txKey, receivedAtomic: receivedAtomic.toString() });
  const amount = (receivedAtomic * config.rate) / 1_000_000_000_000n;
  const receipt = { txid: id, recipient: body.recipient.trim(), burnAtomic: receivedAtomic.toString(), amount: amount.toString(), confirmations: Number(result.confirmations), acceptedAt: new Date().toISOString() };
  await store.append(receipt, config); return send(res, 201, { receipt });
}

const server = http.createServer(async (req, res) => { try {
  if (limited(req)) return send(res, 429, { error: "Rate limit exceeded." }); const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname === "/api/xmr/config") return send(res, 200, publicConfig(config));
  if (req.method === "GET" && url.pathname === "/api/xmr/health") return send(res, 200, { ok: true, launchReady: config.launchReady, productionReady: config.productionReady });
  if (req.method === "GET" && url.pathname === "/api/xmr/receipts") { const data = await store.read(); return send(res, 200, data); }
  if (req.method === "POST" && url.pathname === "/api/xmr/receipts") return await claim(req, res);
  if (req.method === "GET" && url.pathname === "/api/xmr/testnet/receipts") return send(res, 200, { version: 1, receipts: demoReceipts, simulated: true });
  if (req.method === "POST" && url.pathname === "/api/xmr/testnet/receipts") return await demoClaim(req, res);
  if (req.method === "GET") {
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!/^(index\.html|app\.mjs|site\.css)$/.test(file)) return send(res, 404, { error: "Not found." });
    const source = await fs.readFile(path.join(here, "public", file));
    const mime = file.endsWith(".css") ? "text/css; charset=utf-8" : file.endsWith(".mjs") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8";
    res.writeHead(200, { "content-type": mime, "cache-control": "no-store", ...securityHeaders }); return res.end(source);
  }
  return send(res, 404, { error: "Not found." });
} catch (error) { return send(res, 400, { error: error.message || "Bad request." }); } });
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(config.port, () => console.log(`XMR receipt service listening on :${config.port}; launch-ready=${config.launchReady}; production-ready=${config.productionReady}`));
export { server, config };
