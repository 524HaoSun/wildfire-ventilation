# CAVE Workbench Readability Audit

## Audit scope

Reviewed **Challenge, Design, Run, and Analyse** at **1440×810** and **1920×1080**. The present implementation fits the stage by compressing several screens rather than preserving a reliable minimum reading size. The correction must prioritise legibility, complete chart anatomy, and one dominant research plate per screen.

## Cross-screen findings

- Header, shared-context strip, provenance notes, chart legends, axis ticks, sensor labels, badges, and supporting descriptions fall below a comfortable reading size, especially at 1440×810.
- The page behaves like a fixed 16:9 composition that is visually scaled down. This preserves geometry but shrinks text and chart marks together.
- Charts frequently leave large blank regions below the plotted area while the plot itself, legend, axes, and Tooltip are compressed into the upper third.
- Supporting ledgers use dense equal-height cells even where the content needs natural height and wrapping.
- Minimum targets: body/supporting copy **12–13 px**, chart ticks/legends **11–12 px**, labels/buttons **12 px**, primary metrics **18–24 px**, and page titles **18–22 px** at the rendered viewport.

## Challenge

- The main PM₂.₅ chart has sufficient outer area but its plotted field is vertically shallow; labels and ticks are small while unused space remains below.
- Event-card descriptions, location chips, slider notes, and footer metrics are undersized.
- The selected event card is tall but does not use its space to improve text hierarchy.
- Required change: increase plot height, enlarge axes/legend/Tooltip, use a more readable event ledger, and allow secondary text to wrap naturally.

## Design

- The section drawing is legible in overall form, but sensor IDs, dimension labels, environmental notes, control labels, and predicted-response metrics are too small.
- The control column compresses several labels and units into narrow rows.
- Warm ambient fills compete with measured evidence and reduce linework contrast.
- Required change: preserve the section as the dominant plate, enlarge annotations and controls, cool neutral architectural surfaces, and give the prediction ledger enough row height.

## Run

- The spatial replay is squeezed into a narrow vertical strip and visibly cropped; it cannot communicate the occupied volume.
- The response chart occupies most of the width yet uses only a shallow upper plotting area, leaving excessive blank space.
- Sensor rack labels and units are tiny, while each sensor cell contains large unused space.
- Required change: make the building replay the dominant field, widen it substantially, place the chart as a readable supporting ledger, increase chart plot height, and consolidate sensor readings into a compact horizontal or two-column evidence strip.

## Analyse

- All three evidence plots are too short, with small axes, legends, parameter tables, badges, residual labels, and Tooltip text.
- The top diagnostic row gives equal status to three compressed cards; none is large enough to be read comfortably.
- Guidance copy, phase activation rules, trade-off derivations, and strategy labels are small despite ample lower-page whitespace at 1920×1080.
- Required change: use a readable diagnostic sequence or wider editorial plate, enlarge each plot and its supporting table, allow Guidance content natural height, and retain the recommendation as the dominant conclusion.

## Accepted visual-review constraints

- Each screen grants visual majority to one research plate; controls and diagnostics become subordinate ledgers.
- Run is led by the occupied building volume, not by a dashboard-sized chart.
- Analyse uses broader editorial rows and fewer equalised cards.
- Warm colour is reserved for measured hazard evidence; neutral workbench structure returns to mineral paper, teal process marks, and green-black linework.
