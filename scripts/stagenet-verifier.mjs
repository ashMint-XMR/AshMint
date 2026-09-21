// STAGENET ONLY. The service has already validated the payment with wallet-RPC.
// This harness checks the verifier boundary and must never be selected for mainnet.
let source = "";
for await (const chunk of process.stdin) source += chunk;
try {
  const claim = JSON.parse(source);
  if (claim.version !== "monero-burn-v1" || !/^[a-f0-9]{64}$/i.test(claim.txid) || !/^[a-f0-9]{64}$/i.test(claim.txKey) || !/^\d+$/.test(claim.receivedAtomic) || !/^[a-f0-9]{64}$/.test(claim.policyCommitment)) throw new Error("Invalid staging verification request.");
  process.stdout.write(JSON.stringify({ version: "monero-burn-stagenet-v0", verified: true, txid: claim.txid, burnAtomic: claim.receivedAtomic }));
} catch { process.exitCode = 1; }
