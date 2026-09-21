# $ASH XMR receipt launch checklist

The receipt phase and the later Solana `$ASH` claim phase are deliberately separate. Do not set `XMR_LAUNCH_ENABLED=true` until every receipt-phase item is independently approved.

## Receipt phase

1. Provision a dedicated self-hosted Monero wallet-RPC verification endpoint over TLS. It must not hold an unlocked spend wallet.
2. Supply an audited Monero unspendability policy, burn address, SHA-256 policy commitment, and the reviewed `monero-burn-v1` executable.
3. Store the RPC credentials outside the repository and mount the append-only receipt data on durable encrypted storage with backups and monitoring.
4. Set the exact rate, minimum, cap, confirmations, launch ID, and final `$ASH` mint reference in the production environment.
5. Run `node scripts/preflight.mjs`, deploy behind TLS/reverse proxy, run the test suite, perform a staging rehearsal, and obtain operational sign-off.

## Later $ASH claim phase

Before claims open, publish and independently verify the actual Solana `$ASH` mint, mint authority revocation or multisig ownership, total claim allocation, Merkle snapshot root, claim authority/program, exact window, and a claim-contract audit. This service records receipts; it does not yet mint or distribute SPL tokens.

## Non-negotiable properties

- Never collect a seed phrase, spend key, wallet password, or store a claimant's transaction key.
- Never substitute a payment proof for the audited unspendability check.
- Never use STAMP's Solana mint for `$ASH`.
- Do not describe future receipts as tokens, balances, guaranteed redemption, or a live Solana claim before the claim system is deployed and audited.
