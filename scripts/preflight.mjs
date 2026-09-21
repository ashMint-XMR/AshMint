import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../lib/config.mjs";

const config = loadConfig();
const issues = [...config.blockers];
const placeholders = Object.entries(process.env).filter(([key, value]) => key.startsWith("XMR_") || key.startsWith("ASH_") || key.startsWith("SOLANA_") || key.startsWith("FUTURE_"))
  .filter(([, value]) => /SET_AFTER|SET_IN|example\.com|replace-me/i.test(String(value))).map(([key]) => `${key} contains a placeholder.`);
issues.push(...placeholders);
if (!path.isAbsolute(config.dataFile)) issues.push("XMR_DATA_FILE must be an absolute path in production.");
if (config.verifierPath) { try { await fs.access(config.verifierPath); } catch { issues.push("XMR_BURN_VERIFIER_PATH is not readable on this host."); } }
const claimRequired = ["SOLANA_RPC_URL", "ASH_MINT_ADDRESS", "ASH_CLAIM_AUTHORITY", "ASH_CLAIM_MERKLE_ROOT", "ASH_CLAIM_START_AT", "ASH_CLAIM_END_AT"];
const missingClaim = claimRequired.filter((key) => !String(process.env[key] || "").trim());
if (missingClaim.length) issues.push(`Claim phase is not configured: ${missingClaim.join(", ")}.`);
if (issues.length) { console.error("PRODUCTION PREFLIGHT FAILED\n- " + [...new Set(issues)].join("\n- ")); process.exitCode = 1; }
else console.log("PRODUCTION PREFLIGHT PASSED — obtain independent operational and security approval before enabling claims.");
