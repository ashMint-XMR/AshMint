import { spawn } from "node:child_process";

export async function verifyBurnPolicy(config, proof) {
  const input = JSON.stringify({ version: "monero-burn-v1", policyCommitment: config.policyCommitment, burnAddress: config.burnAddress, ...proof });
  return await new Promise((resolve, reject) => {
    const child = spawn(config.verifierPath, config.verifierArgs, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let output = ""; let done = false;
    const finish = (error, result) => { if (!done) { done = true; clearTimeout(timer); error ? reject(error) : resolve(result); } };
    const timer = setTimeout(() => { child.kill("SIGKILL"); finish(new Error("Burn-policy verifier timed out.")); }, 15_000);
    child.on("error", () => finish(new Error("Burn-policy verifier could not be started.")));
    child.stdout.on("data", (chunk) => { output += chunk; if (output.length > 16_384) finish(new Error("Burn-policy verifier response too large.")); });
    child.on("close", (code) => {
      if (code !== 0) return finish(new Error("Burn-policy verifier rejected the proof."));
      try {
        const result = JSON.parse(output);
        if (result.version !== config.verifier || result.verified !== true || result.txid !== proof.txid || result.burnAtomic !== proof.receivedAtomic) throw new Error("Burn-policy verifier returned an invalid result.");
        finish(null, result);
      } catch (error) { finish(error); }
    });
    child.stdin.end(input);
  });
}
