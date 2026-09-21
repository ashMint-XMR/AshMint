# AshMint

**A verifiable XMR receipt protocol for a future `$ASH` migration.**

AshMint is designed as a non-custodial receipt system: a user broadcasts from their own Monero wallet, presents transaction proof material, and receives a deterministic, cap-limited receipt. The service never signs a Monero transaction and never stores a claimant transaction key.

> Status: local practice and stagenet integration scaffolding are implemented. Mainnet claims are deliberately fail-closed pending the reviewed burn-policy verifier, operated Monero infrastructure, a real `$ASH` mint, and release approval.

## Features

- Responsive receipt console with allocation preview and public receipt ledger.
- Same-origin API with strict browser security headers and request limits.
- Exact atomic-unit arithmetic; no floating-point receipt accounting.
- Monero `check_tx_key` integration boundary.
- Pluggable verifier process with a narrow JSON contract.
- Atomic cap and duplicate transaction enforcement.
- Explicit practice, stagenet, and mainnet readiness states.
- Production template, Docker image, preflight checks, CI, and security/runbook documentation.

## Quick start

```sh
npm test
npm start
```

Open `http://localhost:8788`. The default interface runs a local practice flow and cannot broadcast or validate a real XMR transaction.

## Repository map

| Path | Purpose |
| --- | --- |
| `server.mjs` | API and static web server |
| `lib/` | configuration, RPC, verifier, and ledger components |
| `public/` | receipt console UI |
| `scripts/` | preflight and stagenet harnesses |
| `docs/` | architecture and security model |
| `.env*.example` | local, stagenet, and production templates |

## Environments

Use `.env.stagenet.example` only for non-production stagenet experiments. Use `.env.production.example` solely as a secret-manager template. Follow [the production readiness checklist](./PRODUCTION_READINESS.md) and run `npm run preflight` before any release.

See [architecture](./docs/ARCHITECTURE.md) and [security model](./docs/SECURITY.md) for design boundaries.

## Vercel

The Vercel deployment serves the UI and the local practice API through `api/xmr/[...path].js`. Vercel's ephemeral filesystem is not a production receipt ledger: do not enable receipt collection there until the store is replaced with managed durable storage and all mainnet preflight requirements are satisfied.

## API

- `GET /api/xmr/config` — public launch configuration and fail-closed status.
- `GET /api/xmr/health` — liveness and readiness.
- `GET /api/xmr/receipts` — append-only receipt ledger.
- `POST /api/xmr/receipts` — `{ "txid", "txKey", "recipient" }`; accepts only after RPC payment-proof and audited burn-policy verification. `txKey` is never persisted.
