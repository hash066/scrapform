# ScrapForm

ScrapForm converts measured rectangular plywood offcuts into validated fabrication layouts for three parameterized workshop products. It validates boundary, overlap, kerf, thickness, grain, and part-count constraints before enabling SVG, DXF, or CSV export.

The Exchange panel turns a validated plan into a maker-review listing with editable cost and price assumptions, recovered material, utilization, and the complete part schedule. It deliberately does not simulate checkout or completed orders.

## Local development

```sh
npm install
npm run dev
npm test
npm run build
```

The browser planner is deterministic and works without cloud access. `infra/template.yaml` adds the authenticated AWS job API used for persisted project runs. See `docs/DEPLOYMENT.md`, `docs/BENCHMARKS.md`, and `docs/DEMO.md`.
