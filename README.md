# ScrapForm

ScrapForm converts measured rectangular plywood offcuts into validated fabrication layouts for three parameterized workshop products. It validates boundary, overlap, kerf, thickness, grain, and part-count constraints before enabling SVG, DXF, or CSV export.

The Exchange panel turns a validated batch into a maker-review offer with editable price, maker cost, delivery, marketplace fee and lead-time assumptions. Its contribution margin is calculated from those assumptions, while the exported JSON carries the independently validated stock assignment for every part. It deliberately does not simulate demand, checkout, or completed orders.

The application is not a static mock. Editing inventory, defects, thickness, grain, product dimensions, kerf, or batch quantity reruns placement and all validation checks. Exports are disabled whenever even one required part is infeasible.

## AWS open-source core

ScrapForm uses the Apache-2.0 [AWS Amplify JavaScript](https://github.com/aws-amplify/amplify-js) runtime as part of its working core, not as a decorative import. Amplify's browser key-value storage implementation persists and restores the complete measured workspace. Amplify Hub carries the planner's `queued`, `running`, and `completed` lifecycle events; completed runs are written to a bounded audit ledger with an input fingerprint, model version, part counts, utilization, runtime, and validation status. The header and Solve Ledger surface those states during the demo.

This credential-free public build deliberately uses Amplify's local-first browser storage so judges can exercise the complete workflow on GitHub Pages. The storage boundary is injected and tested, and can be replaced by the authenticated API in `infra/` without changing solver or UI code. Clearing site data clears the local workspace; it is not represented as cross-device cloud sync. See `docs/AWS_OPEN_SOURCE.md` for the exact dependency and verification path.

## Local development

```sh
npm install
npm run dev
npm test
npm run build
```

The browser planner is deterministic and works without cloud credentials. `infra/template.yaml` is an optional authenticated AWS job API for later deployment; the public demo does not claim that blocked account infrastructure is active. Its SQS worker runs the placement algorithm again server-side and stores placements, infeasibility, utilization, economics, units and validation status in DynamoDB. See `docs/DEPLOYMENT.md`, `docs/BENCHMARKS.md`, and `docs/DEMO.md`.
