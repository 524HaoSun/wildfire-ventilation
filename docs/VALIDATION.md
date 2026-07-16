# Validation and Self-check Report

**Author:** Manus AI  
**Validation date:** 15 July 2026  
**Scope:** Static React application, deterministic scientific engine, CAVE facility fidelity, responsive interaction and production bundle.

## Automated results

The final verification ran `pnpm test`, `pnpm exec tsc --noEmit` and `pnpm build` sequentially. Vitest reported **1 passing test file and 10 passing tests**. TypeScript completed without errors, and Vite plus esbuild completed the production build. The build emitted only a non-blocking chunk-size advisory for the client bundle.

| Verification area | Result | Acceptance evidence |
|---|---:|---|
| Measured event anchors | Pass | New York and London evidence anchors remain derived from the embedded arrays. |
| Particle mass balance | Pass | Minute Euler integration returns finite results and the protection comparison remains monotonic. |
| Gas challenge contract | Pass | CO₂ and NOx modes use zero particle filtration and zero deposition. |
| Dual temperature state | Pass | Independent exterior and interior setpoints persist as separate state fields. |
| CO₂ tracer fit | Pass | Seeded fits retain the calibrated 95% interval coverage requirement. |
| Ventilation guidance | Pass | Acute-smoke and heat-conflict branches retain explicit thresholds and rule traces. |
| Type safety | Pass | `tsc --noEmit` completed with zero errors. |
| Production build | Pass | Vite and esbuild completed and emitted the production bundle. |
| Source hygiene | Pass | Runtime source contains no CDN or external scientific-data request. |

## Facility and monitoring fidelity

The CAVE views now expose the **206 m² test area, approximately 9 m clear height, −5…43 °C exterior range, 10…28 °C interior range and independently controlled internal/external HVAC conditions** documented by UCL.[1] The product treats these as facility capabilities rather than measured event data.

| Requirement | Result | Implementation |
|---|---:|---|
| True facility context | Pass | Draggable technical section places the chosen test article inside the CAVE hall. |
| Three test articles | Pass | Single-room, Two-storey and Bus use distinct section and procedural 3D geometry. |
| Independent HVAC | Pass | Section, 3D scene, control rail and plan sheet distinguish hall and interior systems. |
| Challenge agents | Pass | PM₂.₅, CO₂ and NOx are explicit experiment modes. |
| Monitoring array | Pass | S1–S3 PM₂.₅, S4 NOx, S5–S6 CO₂, S7 temperature and S8 RH are used consistently. |
| Plan sheet | Pass | Downloadable facility plan summarises geometry, setpoints, challenge and instrumentation. |
| Provenance | Pass | Measured, modelled, reconstructed and illustrative values remain visibly distinguished. |

## Visual and interaction review

All four lifecycle screens were inspected at **1920×1080** and **1440×810**. Challenge, Design, Run and Analyse remain full-screen without panel overlap or page scrolling. The compact Design breakpoint preserves both temperature controls; the Run screen displays the migrated S1–S8 monitoring contract; and the Analyse screen retains complete guidance phases, strategy curves, trade-offs and method statement.

The 3D viewport retains drag-to-orbit, wheel zoom, camera presets and sensor picking. The technical section retains keyboard-focusable, draggable sensor nodes. Startup remains skippable, and non-essential motion respects `prefers-reduced-motion`.

## Entering-page transition regression

The deployed blank-screen failure was reproduced with the entry page stuck in `boot-leaving`. The transition timer was created inside `beginEnter`, but `setLeaving(true)` changed the callback dependency, causing the keyboard-listener effect to clean up and cancel that same timer before `onEnter` could set the parent `entered` state.

The repair makes `beginEnter` reference-stable, stores the current parent callback in a ref and guards repeated entry requests with an immediate ref latch. The timer now clears its own handle before invoking the current callback. Browser verification confirmed that both keyboard activation and the visible entry action resolve to `?screen=1`, unmount the threshold page and mount the Challenge workbench after the 680 ms exit transition.

| Startup acceptance path | Result | Evidence |
|---|---:|---|
| Ordinary root load shows threshold | Pass | The cinematic entering page remains the default root state. |
| Enter key completes transition | Pass | Challenge mounts after the exit animation; `boot-leaving` no longer persists. |
| Workbench navigation | Pass | Direct screen routes 1–4 mount Challenge, Design, Run and Analyse. |
| Return path | Pass | The CAVE brand control still restores the entering page. |

## Residual considerations

The current scientific solver is intentionally a **single-zone screening model** rather than CFD or a digital twin. Gas-agent selections establish protocol and monitoring semantics, but gas-specific dose and reactive-chemistry models are out of scope. The 3D CAVE hall is a truthful facility-context abstraction rather than a survey-grade BIM model. Operational application therefore still requires CAVE measurements to validate parameter estimates, transport assumptions and protection-strategy performance.

## References

[1]: https://www.ucl.ac.uk/engineering/civil-environmental-geomatic-engineering/facilities-cege/controlled-active-ventilation-environment "UCL — Controlled Active Ventilation Environment"
