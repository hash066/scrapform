# Benchmark protocol

Source: University of Bologna 2DPackLib BENG set. The files in `benchmarks/2dpacklib` are downloaded from the maintainers and remain attributed to their original authors.

Run `npm run benchmark`. The harness parses the published standard format, expands item demand, runs a first-fit decreasing shelf baseline, and reports item count, the elementary area lower bound, bins used, utilization, and runtime. `gapToAreaLowerBound` is **not** an optimality gap and the area lower bound is **not** a published best-known solution. Runtime is local-machine evidence only.

ScrapForm's production planner adds measured defects, kerf, thickness and grain compatibility, making it a different and stricter problem. The BENG run demonstrates reproducible 2D packing behavior; it does not claim that ScrapForm is optimal or that benchmark sheets are real workshop inventory. The checked-in `report.json` records the exact algorithm label, source and generation timestamp.
