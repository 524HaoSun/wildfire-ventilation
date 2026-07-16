# CAVE Experiment Workbench — Reference-Led Design Specification

## Ground-truth reference

The supplied workbench reference image is the visual reference for information density, panel structure, chart treatment, typography rhythm, and the architectural CAVE cross-section. The written build brief and its later four-screen amendments are authoritative whenever there is any conflict, especially for colour tokens, type roles, provenance chips, screen structure, physics, and numeric values.

## Chosen design philosophy

**Instrumented Architectural Modernism** treats the interface as a live laboratory protocol sheet rather than a dashboard. Every control, chart, numeral, sensor and annotation should feel measured, traceable and physically connected to the experiment.

### Design movement

The direction combines Swiss information design, mid-century scientific instrumentation, and contemporary architectural section drawings.

### Core principles

1. Dense but legible information hierarchy, with no decorative UI chrome.
2. Thin technical linework and square-edged panels that read like a calibrated instrument console.
3. Hazard colour is semantic only; smoke orange is never used as decoration.
4. Every numeric statement is visibly tied to provenance and computation.

### Colour philosophy

The interface uses warm paper and white panels to evoke printed laboratory protocols, charcoal ink for authority, deep teal for controlled airflow and model output, and smoke orange only for measured hazard. The AQ ramp is restricted to chart fills and zone tints.

### Layout paradigm

The shell is a wide, fixed-density four-screen workbench optimized for 1440×810 and 1920×1080 screen sharing. Screens use asymmetric instrument bands, architectural drawing fields, and pinned analysis panels rather than centered marketing grids.

### Signature elements

The shared hand-built CAVE section is the primary signature. Secondary motifs are mono provenance chips attached directly to data-bearing objects and fine dimension/registration ticks that align panels like a technical drawing set.

### Interaction philosophy

Controls behave like calibrated laboratory hardware: immediate state feedback, restrained 200 ms transitions, direct manipulation for sensor placement and target-window selection, and keyboard shortcuts for the four-stage demonstration path.

### Animation

Airflow markers drift along fixed leakage paths at a speed proportional to total air exchange. Sensor pulses are brief and minute-synchronised. Value changes use a 200 ms fade/translate response, while sensor-tile severity reordering completes within 300 ms. All non-essential motion stops under `prefers-reduced-motion`.

### Typography system

**Geist Variable** carries every product heading, control, body sentence and tabular hero numeral. Its compact shapes and strong small-size rendering provide a professional software-interface baseline without turning the workbench into a generic dashboard. **Geist Mono** is restricted to timestamps, units, station identifiers, sensor coordinates, provenance chips and uppercase instrument labels. **Instrument Serif** remains exclusive to the entering-page statement; it never enters the operational screens. Product type follows a 10/12/14/18/24 scale, with 9 px reserved only for nonessential coordinate ticks at the 1600×900 master stage.

### Brand essence

An evidence-led experiment workbench for researchers designing, replaying and analysing wildfire-smoke studies in CAVE. **Precise, calm, accountable.**

### Brand voice

Headlines describe the scientific action; CTAs name the next protocol step; microcopy uses calm first-person plural. Example lines: “We reproduce the measured profile as the external boundary condition.” “Generate experiment plan.”

### Wordmark and logo

The wordmark uses a compact “CAVE /” construction with a nested-chamber line mark: two offset rectangular envelopes joined by one controlled airflow vector. It must never be rendered as the brand name in an unmodified default font.

### Signature brand colour

**Airflow teal `#2E7E8C`** is the ownable brand colour, reserved for controlled process, active focus and model prediction.

## File-level implementation rule

Every page, component and stylesheet begins with a brief comment naming its role in the Instrumented Architectural Modernism system. When deciding between alternatives, prefer the option that reinforces the experiment-workbench framing rather than a wildfire dashboard aesthetic.

## Style Decisions

Open workbench fields must carry protocol context rather than generic whitespace: registration ticks, calibration traces, provenance, sensor coordinates or computation notes. Comparative graphics use calibrated scientific linework and contained measurement scales, with heavy fills avoided unless they behave as instrument scales. Future-work, AI and roadmap content is excluded from the product; the workbench ends with an actionable, rule-based ventilation decision.

The CAVE signature is strengthened through a nested-chamber section drawing, sensor registration marks, airflow vectors and dimensional annotations rather than decorative branding. Nested dashboard cards are demoted in favour of protocol-sheet hierarchy: primary experiment surfaces remain uninterrupted fields, while supporting evidence uses ruled ledgers, phase strips and aligned annotations. Wildfire atmosphere is semantic evidence only: it appears on the boot threshold, measured Challenge events and Run’s outer CAVE chamber, and is excluded from Design, Analyse, plots and all internal-building geometry.

## Finesse 16:9 Redesign Contract

The redesign uses two deliberately different registers. The **entering page is a brand surface**: cinematic, quiet and sparse, built around one large serif statement, a sectional CAVE silhouette and one explicit entry action. The **workbench is a product/workflow surface**: aligned, dense and operational, with no hero typography or decorative spectacle inside the experiment screens.

The application is composed inside a strict **16:9 presentation stage**. At desktop sizes the stage always preserves that ratio, is centered against a dark theatre surround and uses a protected internal inset. At smaller sizes the stage becomes a minimum-width operational canvas rather than reflowing into an unrelated mobile website. This preserves demonstration choreography and keeps all four screens comparable.

### Brief Amendments

Workbench pages visibly sit inside one centered 16:9 instrument stage with a discernible outer frame and protected inset; they never read as a generic full-browser dashboard. Nested workbench groups use dividers, tints, ledger rows, registration ticks and annotation before additional bordered cards. Extend plates share a visible research timeline geometry and unvalidated provenance language, with asymmetrical protocol emphasis rather than three equal marketing-style roadmap cards.

Typography changes to **Instrument Serif** for entering-page display language, **Geist Variable** for all product headings, controls, body copy and large numerals, and **Geist Mono** only for values, timestamps, units and provenance. This removes the presentation-like Manrope treatment and establishes a proven software-interface baseline. Product text uses a compact but readable 10/12/14/18/24 scale; no key label may drop below 9 px at the 1600×900 master stage.

The primary stage uses one soft warm instrument substrate with subordinate tonal regions. Borders become dividers rather than boxes: major panels receive a one-pixel hairline, nested groups use tint and spacing instead of repeated rectangles. Radii remain restrained at 4–6 px, shadows are hue-tinted and subtle, and airflow teal remains the only active accent. Smoke orange remains strictly measured data.

The entering page’s core move is a **threshold aperture**: a dark field with the CAVE section glowing behind a translucent vertical veil, while the title and evidence briefing sit on a measured baseline. Motion is limited to a slow aperture reveal and one drifting airflow trace. The Enter action resolves directly to Challenge; returning to the threshold is always available from the workbench brand mark.

Each workbench screen must fit inside the 16:9 stage without document scrolling at 1440×810 and 1920×1080. Challenge uses a compact evidence rail plus one dominant event plot. Design uses a narrow control rail, dominant 3D scene field and concise model ledger. Run uses one replay strip, the same selected 3D building and a disciplined sensor rail. Analyse remains a 2×2 scientific plate; its fourth panel combines four-strategy evidence with an explicit rule-based Ventilation Guidance recommendation, a three-phase action timeline, trade-off indicators and an honest model-method statement.

## Product-level Information Architecture

Every workbench screen uses exactly three semantic levels. **Workflow context** answers where the user is and what evidence is active. **Primary task surface** contains the one action that advances the experiment: select evidence, configure the building, run the replay, inspect the fit or choose the next research programme. **Supporting evidence** contains provenance, parameters and diagnostics in compact ledgers that never compete with the primary task.

Challenge follows “choose event → define boundary → send to design”. Design follows “choose building → tune envelope → verify predicted response”. Run follows “orient the same building → replay boundary → inspect live sensors”. Analyse follows “fit transport → quantify exposure → compare strategies → act on ventilation guidance”. These verb-led paths are visible in page headings and action labels.

The application has exactly four lifecycle screens: **01 Challenge → 02 Design → 03 Run → 04 Analyse**. Screen 5, Extend, roadmap rails, future-work cards and all machine-learning language are prohibited.

The three Test Building options are not tabs over one illustration. They are independent deterministic scene definitions with separate geometry, camera bounds, volume, floor count, envelope assumptions, sensor coordinates and airflow paths. The centre viewport is the source of spatial truth; the left rail changes conditions and the right rail explains the currently selected object or model. Model switching may not reset the measured event, envelope controls or analysis state.

## 3D Interaction Contract

The viewport uses procedural WebGL geometry so the application remains offline-capable. Pointer drag orbits the camera, wheel or pinch zooms, and compact controls provide isometric, front, top and reset views. Hover highlights selectable sensors; click pins a sensor and updates the right ledger. Loading and WebGL fallback states are explicit. Motion is limited to airflow particles and camera interpolation, both disabled or simplified under reduced-motion preferences.

## User-directed visual rebase — Editorial Research Atlas

The July review supersedes the compact software-dashboard treatment. The interface must feel like a **carefully typeset architectural research atlas**, not a dense control console. Information is edited before it is arranged: fewer simultaneous labels, larger margins, stronger grouping, and one dominant visual field per screen.

### Typography correction

**Times New Roman** is the sole typeface throughout the application. It carries page titles, panel titles, case names, measurements, explanatory prose, timestamps, units, identifiers, provenance, charts, controls and SVG annotations. Hierarchy is created through weight, case, size, tracking and italic scientific nuance rather than mixing type families. All sans-serif and monospaced font-family overrides are removed.

### Spatial correction

The 16:9 stage keeps a deliberate outer frame, but internal padding increases and the global header becomes quieter. Challenge becomes a 280 px evidence index beside one generous plot. Design becomes a 270 px control folio beside a single large spatial plate, with prediction evidence reduced to a concise bottom or side ledger rather than a third competing column. Run gives the building most of the screen and turns sensors into a calm vertical instrument rack. Analyse uses two broad editorial rows instead of four equally compressed cards.

### Building realism contract

Single-room is a recognisable insulated test cell with wall thickness, slab, ceiling, glazed window, door, supply diffuser, return grille and tripod-mounted instruments. Two-storey is a cutaway dwelling with floor slab, stair, internal partitions, windows, doors, roof construction and independent upstairs/downstairs sensor positions. Bus is a proportioned single-deck transit cabin with rounded body, wheel assemblies, continuous glazing bands, front/rear geometry, seating modules, doors and distributed monitoring points.

The 2D drawings are not iconography. They use architectural section conventions: material poche, structural line weights, dimension strings, realistic floor and ceiling depths, equipment labels and fewer but physically plausible sensor locations. The 3D views use opaque materials, believable wall thickness and equipment geometry; translucent boxes, floating spheres and toy-like colours are prohibited. Sensors use tripod, wall-probe or ceiling-drop mounts and are labelled through a restrained selection overlay rather than glowing bubbles.

### Entering-page guarantee

The entering page appears on every ordinary root load. Query links used for review may bypass it only with an explicit `direct=1` parameter. The workbench wordmark always returns to the entering page, and the entry action remains the clearest interaction on the threshold.

### Accepted review amendments

The July system redesign replaces the uneven warm-yellow palette and event-specific background washes with a **Mineral Research Atlas** system: cool mineral paper, deep green-black ink, calibrated teal for active process, and ember only for measured exposure risk. New York and both London cases share one surface language; selection is communicated by a quiet teal registration rule rather than different card colours.

No essential operational label may fall below 9 px at the 1440×810 stage. Panel eyebrows, chart ticks, provenance chips, evidence-strip text, control labels and scene annotations use sentence case and sufficient contrast. Large numerals are capped so that evidence supports—rather than overwhelms—titles and interpretation.

The four screens behave as edited research spreads rather than equal-weight dashboards: one dominant field, subordinate ledgers, restrained dividers, uniform panels and consistent selected states. Gradients and atmospheric colour washes are excluded from Event Explorer and workbench panels.

Workbench chrome is subordinate to the atlas. A live clock, sentinel language and simultaneous operations-console phrases are prohibited; the header keeps only identity, lifecycle and a quiet edition mark, while the evidence strip carries the active case, target window and modelled ACH.

Serif hierarchy must remain dominant inside every workbench screen. Times New Roman carries the scientific action, case names, interpretation and primary measurements; mono is reserved for units, timestamps, identifiers, provenance and calculation traces.

Run must present the same selected building as a believable occupied experimental volume rather than a generic WebGL box. The cutaway model retains opaque wall thickness, door and window construction, ceiling ductwork, service rails, luminaires, equipment cabinets, work surfaces, floor-edge structure and tripod instruments. Airflow particles are secondary diagnostic marks, not decorative animation.

The operational identity always combines the “CAVE /” wordmark with the nested-chamber line symbol; the mark is never reduced to text-only typography. Airflow teal remains reserved for controlled process, active focus, model prediction and decisive protocol actions, while rules, tints and neutral ink carry secondary structure.

Atlas hierarchy is serif-first. Times New Roman carries every screen’s scientific action, interpretation, case name and primary measurement; mono labels are restricted to provenance, identifiers, units and calculation traces. Equal-weight compartments are avoided when one edited primary field and subordinate evidence can establish a clearer research-plate rhythm.

Run geometry must read as an architectural cutaway before it reads as procedural rendering. Opaque wall thickness, floor and ceiling depth, real openings, service equipment and physically mounted instruments are mandatory visual signals for every selected building type.

The July typography correction supersedes all earlier split-family specifications: every visible glyph, including compact provenance, timestamps, sensor identifiers, chart labels and controls, uses Times New Roman. The operational identity pairs “CAVE /” with a visible nested-chamber instrument stamp, while Ventilation Guidance remains the dominant edited conclusion and the three upper analyses remain subordinate evidence plates.

The Analyse conclusion is a **decision brief rather than a diagram**. Ventilation Guidance owns the dominant lower field; its recommendation, numbered operational phases and trade-offs use open tonal folios with no decorative connector lines or absolute-positioned annotations. Strategy comparison remains supporting evidence and uses calibrated bar ticks, explicit values and one restrained teal registration mark for the recommendation.

Nested rectangles are further reduced on Analyse: the three upper analyses read as lightly ruled evidence plates rather than equal dashboard cards. Workbench badge colour follows a strict semantic rule—teal for model and process, ember for exposure or operational risk, and cool mineral neutrals for all other provenance and structure; pale gold chrome is excluded.

### Evidence-driven interaction architecture

Interaction must reveal **causal evidence**, not decorate the atlas. A single shared time cursor and selected sensor persist across Challenge, Design, Run and Analyse. Selecting an operational phase changes the highlighted event interval and cursor; hovering a protection strategy previews its predicted indoor curve, while clicking locks that comparison until explicitly cleared.

Ventilation rules remain inspectable and bounded. The “What changes this recommendation?” sheet exposes the smoke threshold, heat-conflict threshold and minimum fresh-air target as labelled research assumptions. Adjustments update the recommendation, phase language, rule trace and trade-offs immediately, while a reset restores the documented defaults.

Trade-off figures behave as evidence disclosures. Each metric opens a compact derivation containing current inputs, comparison baseline, calculation statement and provenance. The editable Decision Note is a research annotation—not a testimonial or generated conclusion—and is exported with the selected event, locked strategy, active phase, shared cursor, sensor and modelling limitations.

Scrolling through Analyse is a state transition. The scroll position activates four editorial chapters—characterisation, parameter fit, dose and ventilation decision—and changes the active lifecycle rail, evidence emphasis, shared cursor position and narrative caption. Motion is subordinate to those state changes, keyboard navigation provides the same transitions, and reduced-motion mode removes interpolation without removing the changed state.

### Entering hero visual amendments

The entering hero is always an architectural CAVE section or cutaway: the nested research hall and test volume are reinforced by construction line weights, dimension strings, registration marks, sensor locations and measured airflow vectors. Photoreal rendering supplies material depth, but it is overlaid as section evidence rather than presented as a generic cinematic science image.

Threshold copy names the protocol action. The title describes reproducing wildfire-smoke conditions and testing indoor response, while the single CTA advances directly to the Challenge protocol. The evidence strip reads as dataset provenance—measured event, date, pollutant and peak—not as a terminal, sentinel or operations-console status. Teal remains controlled process; ember appears only in the measured exposure field.
