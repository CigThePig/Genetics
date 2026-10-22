# Measurements

Generated from archived seed reports; see evidence.md and tooling.md for methods and limits. No significance claim is implied.

## Seven paired 36,000-tick seeds

Seeds 2, 3, 7, 19, 73, 101, 2026. Means below give each seed equal weight; displacement values are means of seed-level medians, not pooled individual means. Spatial statistics include qualifying regions only.

| Variant                       | Species | Seeds | Max natal displacement (tiles) | First conception displacement (tiles) | Excess G_ST |
| ----------------------------- | ------- | ----- | ------------------------------ | ------------------------------------- | ----------- |
| Baseline                      | square  | 7     | 71.4                           | 26.8                                  | 0.0213      |
| Baseline                      | circle  | 7     | 63.9                           | 27.2                                  | 0.0160      |
| Two communities + local water | square  | 7     | 61.8                           | 22.8                                  | 0.0121      |
| Two communities + local water | circle  | 7     | 70.8                           | 22.9                                  | 0.0164      |
| Range experiment (rejected)   | square  | 7     | 74.6                           | 28.2                                  | 0.0102      |
| Range experiment (rejected)   | circle  | 7     | 70.3                           | 21.1                                  | 0.0158      |

## Canonical 108,000-tick runs

S/C/T/O = squares/circles/triangles/octagons. Depth is maximum pedigree depth across all observed individuals, not completed non-overlapping generations.

| Seed | Variant                       | Final S/C/T/O | Depth S/C/T/O | Square excess G_ST | Circle excess G_ST |
| ---- | ----------------------------- | ------------- | ------------- | ------------------ | ------------------ |
| 1    | Baseline                      | 102/139/0/0   | 9/10/2/3      | 0.0646             | 0.0545             |
| 1    | Two communities + local water | 62/74/0/6     | 9/10/2/8      | 0.0050             | 0.0146             |
| 1    | Range experiment (rejected)   | 79/120/0/0    | 9/9/1/4       | 0.0878             | 0.0337             |
| 42   | Baseline                      | 64/90/0/0     | 9/9/1/1       | 0.0962             | 0.0893             |
| 42   | Two communities + local water | 59/110/0/3    | 9/9/2/8       | 0.0506             | 0.0405             |
| 42   | Range experiment (rejected)   | 36/99/0/5     | 8/9/4/7       | 0.0461             | 0.0378             |
| 1337 | Baseline                      | 24/156/0/0    | 8/9/1/2       | 0.0149             | 0.0804             |
| 1337 | Two communities + local water | 63/157/0/0    | 8/10/4/1      | 0.0595             | 0.0225             |
| 1337 | Range experiment (rejected)   | 55/100/0/0    | 9/9/3/2       | 0.0587             | 0.0410             |

## Pedigree mixing at 30 minutes

Expected pedigree contributions use half of each parent, not realized neutral allele ancestry. Mixed genealogical ancestry does not itself prove genetic homogenization.

| Seed | Variant                       | Species | Mixed living descendants | Mean minority contribution | First disjoint-community conception (s) |
| ---- | ----------------------------- | ------- | ------------------------ | -------------------------- | --------------------------------------- |
| 1    | Two communities + local water | square  | 62/62                    | 0.403                      | 195.7                                   |
| 1    | Two communities + local water | circle  | 74/74                    | 0.362                      | 236.3                                   |
| 42   | Two communities + local water | square  | 40/59                    | 0.217                      | 726.8                                   |
| 42   | Two communities + local water | circle  | 87/110                   | 0.200                      | 209.3                                   |
| 1337 | Two communities + local water | square  | 63/63                    | 0.412                      | 89.0                                    |
| 1337 | Two communities + local water | circle  | 151/157                  | 0.250                      | 209.9                                   |
| 1    | Range experiment (rejected)   | square  | 79/79                    | 0.351                      | 265.0                                   |
| 1    | Range experiment (rejected)   | circle  | 120/120                  | 0.361                      | 236.7                                   |
| 42   | Range experiment (rejected)   | square  | 27/36                    | 0.234                      | 97.5                                    |
| 42   | Range experiment (rejected)   | circle  | 97/99                    | 0.333                      | 192.9                                   |
| 1337 | Range experiment (rejected)   | square  | 55/55                    | 0.335                      | 211.4                                   |
| 1337 | Range experiment (rejected)   | circle  | 100/100                  | 0.409                      | 214.1                                   |

## Size/density exploration (seed 42, 36,000 ticks)

Single-seed exploratory comparisons; terrain changes with dimensions. The 128/16 case also changes the predator fraction and is not a pure density ablation.

| Dimensions, total/predator founders | Final S/C/T/O | Predator births T/O |
| ----------------------------------- | ------------- | ------------------- |
| 180 × 240, 80/8                     | 64/81/1/2     | 1/2                 |
| 240 × 320, 80/8                     | 82/83/2/2     | 2/2                 |
| 240 × 320, 128/16                   | 134/126/2/6   | 2/6                 |

## Travel causes (baseline, seven 600-second seeds)

Shares use measured path length; resource search keys are intent categories rather than inferred motivations.

| Species | Intent                 | Travel share |
| ------- | ---------------------- | ------------ |
| square  | seek:water-rendezvous  | 47.6%        |
| square  | seek:observed-resource | 20.8%        |
| square  | wander                 | 15.3%        |
| square  | graze                  | 7.6%         |
| square  | seek:mate-contact      | 5.0%         |
| square  | mate                   | 0.6%         |
| circle  | seek:water-rendezvous  | 46.9%        |
| circle  | seek:observed-resource | 18.8%        |
| circle  | wander                 | 16.4%        |
| circle  | graze                  | 9.6%         |
| circle  | seek:mate-contact      | 5.5%         |
| circle  | mate                   | 0.6%         |

## Node performance

Alternating order, seed 42, 2400 warmup + 1200 measured ticks per trial; default 80 founders. Different behavior trajectories can change actor counts. Shared execution host, not device certification.

GC before/after deltas were noisy (including negative deltas) and are not used as retained-memory evidence. Initial serialized JSON size is a snapshot-size metric, not heap usage.

| Variant  | Trials | Init ms | Mean tick ms | p50   | p95   | p99   | Initial JSON bytes |
| -------- | ------ | ------- | ------------ | ----- | ----- | ----- | ------------------ |
| default  | 3      | 84.6    | 2.327        | 2.168 | 3.185 | 4.363 | 8532918            |
| original | 3      | 76.5    | 2.533        | 2.415 | 3.470 | 4.776 | 8516817            |

## Browser performance

Headless Chromium/SwiftShader on a shared host; 12-second windows after 7,200 warmup ticks. Touch viewport is not physical-phone hardware. Control uses one community and disables the local-water repair in the same instrumented application. Poor rendering performance exists in both modes; no 60 FPS certification is claimed.

| Mode    | Layout  | Speed | TPS   | FPS  | Frame p50 ms | p95   | p99   | Frames >50 ms |
| ------- | ------- | ----- | ----- | ---- | ------------ | ----- | ----- | ------------- |
| Control | Desktop | 1     | 59.8  | 13.1 | 33.4         | 266.6 | 300.0 | 47/158        |
| Control | Desktop | 2     | 119.7 | 6.3  | 166.6        | 333.3 | 399.9 | 54/77         |
| Control | Touch   | 1     | 59.8  | 16.9 | 33.3         | 200.0 | 233.3 | 60/203        |
| Control | Touch   | 2     | 119.8 | 11.6 | 83.3         | 200.0 | 216.6 | 79/139        |
| Default | Desktop | 1     | 59.9  | 12.4 | 33.3         | 316.6 | 350.0 | 43/153        |
| Default | Desktop | 2     | 119.8 | 6.2  | 149.9        | 350.0 | 383.3 | 51/75         |
| Default | Touch   | 1     | 59.9  | 16.3 | 33.3         | 200.0 | 216.7 | 57/199        |
| Default | Touch   | 2     | 119.8 | 10.1 | 100.0        | 216.6 | 233.3 | 76/122        |
