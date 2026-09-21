# Architecture

AshMint is split into two independent phases:

```text
Monero wallet proof -> receipt verifier -> append-only receipt ledger
                                             |
                                             +-> later $ASH snapshot / claim distributor
```

## Current service

- `lib/rpc.mjs`: narrow authenticated Monero wallet-RPC client.
- `lib/verifier.mjs`: JSON stdin/stdout boundary for the reviewed burn-policy verifier.
- `lib/store.mjs`: serialized local receipt store for local and single-instance staging.
- `server.mjs`: same-origin HTTP API, static console, request limits, CSP headers.
- `public/`: user-facing receipt console and local practice workflow.

## Deployment states

| State | Claims | Meaning |
| --- | --- | --- |
| Practice | Local only | UI and receipt-flow exercise; no chain transaction. |
| Stagenet | Test XMR | Requires a dedicated stagenet wallet-RPC and test-only verifier. |
| Mainnet | Disabled by default | Requires reviewed burn policy, verifier, node operations, `$ASH` mint, and release approval. |

## Mainnet evolution

Before mainnet, replace the single-instance file store with PostgreSQL, add an independent indexer/rebuild tool, run multiple self-hosted Monero nodes, pin and attest verifier builds, and publish a Solana claim-distributor specification separately. The API must never hold a Monero spend key or Solana claim authority.
