# ScrapForm

ScrapForm converts measured rectangular plywood offcuts into validated fabrication layouts for three parameterized workshop products. It validates boundary, overlap, kerf, thickness, grain, and part-count constraints before enabling SVG, DXF, or CSV export.

The Exchange panel turns a validated batch into a maker-review offer with editable price, maker cost, delivery, marketplace fee and lead-time assumptions. Its contribution margin is calculated from those assumptions, while the exported JSON carries the independently validated stock assignment for every part. It deliberately does not simulate demand, checkout, or completed orders.

The application is not a static mock. Editing inventory, defects, thickness, grain, product dimensions, kerf, or batch quantity reruns placement and all validation checks. Exports are disabled whenever even one required part is infeasible.

## Local development

```sh
npm install
npm run dev
npm test
npm run build
```

The browser planner is deterministic and works without cloud access. `infra/template.yaml` adds the authenticated AWS job API used for persisted project runs. Its SQS worker runs the placement algorithm again server-side and stores placements, infeasibility, utilization, economics, units and validation status in DynamoDB. See `docs/DEPLOYMENT.md`, `docs/BENCHMARKS.md`, and `docs/DEMO.md`.
