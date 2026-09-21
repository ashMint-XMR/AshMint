# Security model

## In scope

- Claimants submit a transaction ID, transaction key, and future-recipient identifier.
- The server checks payment evidence using an authenticated self-hosted Monero wallet RPC.
- Transaction keys are accepted only in memory for the request and never written to the receipt ledger.
- Receipt IDs are unique; cap accounting occurs in the store's serialized write section.

## Required external controls

`check_tx_key` proves a payment to an address, not irreversible unspendability. Mainnet activation therefore requires a separately reviewed verifier and a published burn-policy commitment. TLS termination, secret storage, RPC network isolation, durable backups, monitoring, incident response, and an independent ledger rebuild are deployment requirements.

## Reporting

Do not report vulnerabilities in public issues. Before public operations exist, contact the project operator through the private channel published with the live release.
