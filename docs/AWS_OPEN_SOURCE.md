# AWS open-source integration

## What is running in the public build

ScrapForm depends on `aws-amplify` v6, the Apache-2.0 AWS Amplify JavaScript project. `src/amplifyWorkspace.ts` uses two exports from `aws-amplify/utils`:

- `defaultStorage` is the durable browser key-value implementation behind workspace recovery and the solve-run ledger.
- `Hub` is the event bus behind the visible queued, running, and completed solver states.

This is application behavior, not branding. Removing the runtime removes measured-inventory recovery, reproducible run history, and the UI's solve lifecycle. The geometric solver and its independent validator remain deterministic domain code.

## Persisted records

`scrapform.workspace.v1` stores schema version, save time, measured stocks and defects, product dimensions, saw kerf, batch quantity, and editable commercial assumptions. `scrapform.solve-runs.v1` stores the latest 20 solve records. Each record includes:

- an FNV-1a input fingerprint;
- queued and completion timestamps;
- solver model version;
- requested and placed part counts;
- utilization and measured browser runtime;
- explicit `PASSED` or `FAILED` validation status.

No customer identity, credentials, orders, or payment data are stored. The public build is local-first and does not claim cross-device sync.

## Reproduce it

1. Run `npm install && npm test && npm run dev`.
2. Change a measured offcut width. The header changes from `saving` to `saved`, and the Solve Ledger advances through the Amplify Hub lifecycle.
3. Reload the page. The edited width is restored by Amplify storage.
4. Remove stock until the product is infeasible. Exports are disabled and the failed run is recorded as `infeasible / FAILED`, rather than fabricated as a success.
5. Inspect Application Storage in browser developer tools to audit the two versioned records.

The storage adapter is constructor-injected in tests. `src/amplifyWorkspace.test.ts` proves snapshot round-trip, input fingerprinting, and solve-ledger persistence without relying on global browser storage.

## Cloud path

The optional SAM template in `infra/template.yaml` defines a Cognito-authenticated HTTP API, SQS worker, and DynamoDB job state for cross-device deployment. The hackathon account was service-blocked, so those resources are intentionally not represented as deployed. The public GitHub Pages build remains fully functional through the AWS-maintained open-source runtime.

Primary source: [AWS Amplify JavaScript repository](https://github.com/aws-amplify/amplify-js).
