# ScrapForm: from plywood offcuts to verified maker inventory

## Problem

Small fabrication workshops accumulate usable plywood offcuts, but converting irregular stock into something manufacturable takes measurement, layout work, verification and quoting. Without that workflow, material with real value stays on a shelf or becomes waste.

## Build

ScrapForm begins with measured stock: width, height, thickness, grain and rectangular defects. A constrained placement engine lays out every product part with kerf allowance, then a separate validator checks boundaries, overlap, excluded defects, material compatibility and complete part counts. The same validated placements drive a live Three.js assembly, cut layouts and downloadable SVG, DXF and CSV fabrication files.

The Exchange adds a startup wedge for small makers. Price, cost, shipping, channel fee, quantity and lead time are explicit assumptions. ScrapForm calculates batch contribution, recovered mass using a disclosed 650 kg/m3 plywood-density assumption, and utilization, then exports a traceable maker offer. It does not simulate checkout, claim completed orders or make unsupported structural claims.

## Where AWS fits

The deployment stack targets Mumbai. CloudFront serves the application over HTTPS from a private S3 origin. Cognito isolates editable workspaces. API Gateway accepts bounded scenario jobs; DynamoDB stores user-owned state and versioned results; SQS buffers compute; and the Lambda worker performs the same placement and validation workflow before persisting results. CloudWatch captures operations, worker concurrency controls cost, and AWS Budgets monitors the planned US$20 allocation.

The AWS account is currently awaiting service activation, so the identical production frontend is available through GitHub Pages while the checked-in SAM stack remains ready for deployment.

## Links

- Live app: https://hash066.github.io/scrapform/
- Demo video: https://hash066.github.io/scrapform/demo.mp4
- Source: https://github.com/hash066/scrapform
- Geometry and worker tests: `npm test`
- Reproducible packing benchmark: `npm run benchmark`
