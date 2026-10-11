# Benchmark protocol

Source: University of Bologna 2DPackLib BENG set. The files in `benchmarks/2dpacklib` are downloaded from the maintainers and remain attributed to their original authors.

Run `node benchmarks/run.mjs`. The harness parses the published standard format, expands item demand, runs a first-fit decreasing shelf baseline, and reports item count, area lower bound, bins used, utilization, and runtime. ScrapForm's defect- and grain-aware workshop planner is a stricter problem, so the baseline is presented as packing evidence rather than an optimality claim.
