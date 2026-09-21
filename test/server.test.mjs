import test from "node:test";
import assert from "node:assert/strict";
import { server } from "../server.mjs";

test("status endpoints expose a fail-closed launch state", async (t) => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => server.close()); const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/xmr/config`); const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.productionReady, false); assert.equal(data.burnAddress, null);
});

test("serves the launch console with no active claim capability", async (t) => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => server.close()); const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`); const page = await response.text();
  assert.equal(response.status, 200); assert.match(page, /ASHMINT/); assert.match(page, /never asks for a seed phrase/);
});

test("accepts explicitly simulated testnet receipts only at the testnet endpoint", async (t) => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve)); t.after(() => server.close()); const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/xmr/testnet/receipts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txid: "d".repeat(64), recipient: "test-recipient", burnAtomic: "100000000000" }) });
  const body = await response.json(); assert.equal(response.status, 201); assert.equal(body.receipt.simulated, true);
});
