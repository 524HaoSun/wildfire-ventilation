# CAVE Product-level UX and 3D Audit

## Scope

The application was reviewed at **1440×810** and **1920×1080** across the entering page and all five workflow screens. The 16:9 stage itself is stable, but the product surface still relies on fixed-height compositions and an inconsistent density model.

## Cross-screen findings

The workbench hierarchy is too flat. Header, status strip, page title, panels, nested cards, provenance tags and microcopy often compete at similar visual weights. The next revision must establish three levels only: workflow context, primary task surface, supporting evidence. Secondary facts should move into compact ledgers or contextual drawers instead of occupying equal panels.

Typography is visually weak because the current Manrope/mono mix is too light at small sizes and too close to a presentation mock-up. The replacement system must use a proven software UI sans with robust small-size rendering, clear tabular numerals and a calmer technical mono. Instrument Serif can remain on the entering page only.

The entering image is attractive but architecturally ambiguous and overly dark. Product screens use a faint hall photograph behind line drawings; this reduces clarity and makes the 2D section feel decorative. The new visual system should use high-quality controlled-environment imagery only at the entering threshold and use clean 3D geometry inside the product.

## Screen findings

### Challenge

The measured-event chart dominates correctly, but the desktop composition leaves an excessively tall unused region below the chart metadata at 1920×1080. The selected-window profile and anchor band should form one bottom evidence dock. The left event list should use the full available height with clearer case grouping and selection feedback.

### Design

This screen has the largest functional gap. The Single-room, Two-storey and Bus controls change only text state; the central view remains the same single-storey elevation. The fixed 2D section also leaves a large unused evidence field beneath it. Replace the centre with a true interactive 3D viewport and a compact model-specific specification rail. Each model must have distinct geometry, materials, sensor coordinates, airflow paths, volume, floor count and camera framing.

### Run

The upper cave view and lower chart communicate the flow, but the sensor array uses only the right half-height and leaves an uninstrumented blank area. The selected 3D building should persist here, with live sensor markers and the same camera orientation. Playback controls need clearer disabled/active states, scrubbing feedback and current-time context.

### Analyse

The 2×2 plate is the clearest screen, but large white regions inside plots make the lower half feel unfinished. The redesign should enlarge charts inside their regions, align key results to a consistent right-side result column and allow tooltips/crosshairs on all plots.

### Extend

The timeline is logically clearer than before, but the three research regions still read as empty brochure columns at large sizes. Their diagrams should occupy more of the vertical field, with milestones, dependencies and outputs attached to the timeline rather than isolated near the top.

## Interaction requirements

Each building selector must switch to a separately authored 3D model. The viewport must support pointer drag orbit, wheel/pinch zoom, reset view, isometric/front/top presets, hover and click selection of sensors, model loading feedback, and keyboard-accessible preset controls. Switching model must update camera framing, volume, envelope parameters, sensor labels, airflow paths and numerical model context without resetting unrelated experiment settings.

## Technical direction

Use a client-side Three.js scene with `@react-three/fiber` and `@react-three/drei`. Geometry should be deterministic and procedural so the app remains offline-capable and avoids external model downloads. Canvas rendering must pause when off-screen and respect reduced motion. The 2D scientific charts and calculation engine remain unchanged except for layout integration.
