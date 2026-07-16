# Attachment Review — Real CAVE Facility Addendum

**Author:** Manus AI  
**Review date:** 15 July 2026

The attachment is internally coherent and its central facility claims are confirmed by UCL’s official CAVE facility page. UCL describes a **206 m², 9 m-high** climate- and ventilation-controlled main laboratory that represents an exterior environment; full-scale buildings or vehicles are placed inside to represent independent interior environments. The official page states exterior capability of **−5 °C to 43 °C**, interior capability of **10 °C to 28 °C**, independent HVAC/environmental control, and high-resolution monitoring of temperature, humidity, airflow, CO₂, VOCs, particulate matter and NOx.[1]

## Extracted requirements

| Priority | Requirement | Implementation implication |
|---|---|---|
| Critical | The hall is one tall external volume; storeys belong only to the internal test building. | Redraw/enrich the signature facility view and remove any visual ambiguity that the hall is multi-storey. |
| Critical | Use 206 m², 9 m, exterior −5…43 °C and interior 10…28 °C throughout. | Correct controls, readouts, plan sheet, labels and tooltips. |
| Critical | Show independent exterior and interior HVAC systems. | Add distinct supply/return/injection paths and mode-dependent internal HVAC states. |
| Critical | Preserve three internal states: single-room, two-storey with slab/stair, and double-decker bus. | Keep the existing procedural models and improve their facility context. |
| High | Make S1–S8 and the pollutant/thermal monitoring story legible. | Add typed sensor labels/legend and Run logging behaviour. |
| High | Replace challenge-agent priority with PM, CO₂ and NOx; CO is secondary. | Update state types, segmented controls and labels without changing measured evidence. |
| High | Replace the Screen 4 method statement with the supplied transparency wording. | Add MODEL PREDICTION and ILLUSTRATIVE provenance where appropriate. |
| High | Add a facility block to the Screen 2 plan sheet. | Update the export/plan UI and offline text export. |
| Binding | Keep smoke limited to the entering page, Challenge and the external hall in Run. | Do not add smoke to Design, internal buildings or Analyse. |
| Binding | Stay fully offline and respect reduced motion. | Use procedural Three.js/CSS/SVG only; no runtime network assets. |

## Initial implementation gaps

The current project already has separate Single-room, Two-storey and Bus geometry, an outer hall wireframe, 8 selectable sensors, orbit/zoom camera controls, rule-based ventilation guidance and offline assets. The principal gaps are the **external temperature slider still using −10…40 °C**, no explicit internal-temperature control/readout, challenge agents still prioritising CO instead of NOx, limited hall/HVAC annotations in the 3D view, and stale Screen 4/plan-sheet copy. Sensor picking exists, but Design does not yet provide literal 3D node dragging; the addendum’s monitoring requirement can be met by adding typed S1–S8 labels and a clear draggable/interactive affordance or by implementing constrained drag where practical.

## Potential ambiguity

The addendum requests a 22.0 m internal clear span while the cited UCL page confirms plan area and height but does not state that span in its text. The project will treat **22.0 m** as an addendum-supplied schematic dimension and mark the drawing as an illustrative facility section rather than presenting it as a directly measured value. The phrase “world’s first” is supported more cautiously by UCL’s news wording, which calls CAVE “the first facility of its kind in terms of its advanced capabilities.”[2]

## References

[1]: https://www.ucl.ac.uk/engineering/civil-environmental-geomatic-engineering/facilities-cege/controlled-active-ventilation-environment "UCL Engineering — Controlled Active Ventilation Environment"
[2]: https://www.ucl.ac.uk/news/2023/aug/world-first-facility-answer-questions-air-quality-pollution-airborne-infections "UCL News — World-first facility to answer questions on air quality"
