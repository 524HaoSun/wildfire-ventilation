# Root-domain blank-page recovery

## Production evidence

Production URL: <https://caveworkbench-ditoofhq.manus.space/>

On 2026-07-15, the parameter-free production root was controlled by `https://caveworkbench-ditoofhq.manus.space/sw.js`. Browser inspection reported an active Service Worker, cache storage named `cave-workbench-v2`, and an HTML shell that loaded `/assets/index-BRtSFIXc.js`.

Direct network inspection showed that `/assets/index-BRtSFIXc.js` returned HTTP 404 while the controlled page still executed it from Cache Storage. The root HTML itself returned `Cache-Control: no-cache, no-store, must-revalidate`, but `/sw.js` returned `Cache-Control: max-age=7776000`. The old worker used cache-first handling for every GET request and cached `/`, hashed JavaScript, CSS, and the brand mark. Therefore, normal deployments could not reliably replace the cached HTML shell or deleted hashed bundles for existing visitors.

## Root cause

The blank page was not primarily a React rendering or entry-animation failure. A persistent cache-first Service Worker kept serving obsolete HTML and JavaScript after new deployments. Earlier preview and version-query checks could pass while real returning visitors remained on the stale application bundle.

## Recovery implementation

`client/public/sw.js` is now a one-time retirement worker. On activation it deletes every cache whose name starts with `cave-workbench`, claims existing clients, unregisters itself, and navigates controlled windows to their current URL so the browser retrieves the current no-store HTML from the network. It no longer has a fetch handler.

`client/src/App.tsx` no longer registers a Service Worker. On application mount it unregisters any remaining registrations and removes legacy CAVE caches as a second cleanup path.

## Acceptance rule

The repair is accepted only after publishing and validating repeated cold loads of the parameter-free production root, followed by mouse entry, keyboard entry, direct `?screen=1` navigation, and navigation through Challenge, Design, Run, and Analyse.

## Published migration verification

Checkpoint `71272ee9` was published on 2026-07-15. Before the retirement worker updated, the production root remained controlled by `/sw.js`, Cache Storage still contained `cave-workbench-v2`, the entry control was the obsolete `BUTTON`, and the controlled page loaded stale `/assets/index-BRtSFIXc.js`.

Calling the browser's standards-based `ServiceWorkerRegistration.update()` fetched the newly published retirement worker. Its activation navigated the controlled page, after which inspection returned: no Service Worker registrations, `navigator.serviceWorker.controller === null`, no Cache Storage entries, the entry control rendered as the new native `A` link, and the current application script was `/assets/index-CTbUjxcs.js`.

Three subsequent parameter-free loads of <https://caveworkbench-ditoofhq.manus.space/> rendered the complete Entering page and preserved the native Enter workbench link without restoring the old cache or blank stage. On the third load, a real mouse click on Enter workbench navigated directly to `?screen=1` and rendered Challenge. A separate return to the parameter-free root followed by the Enter key produced the same successful `?screen=1` Challenge state. Direct navigation to `?screen=1` also rendered Challenge without passing through the entry sequence. From that state, the published navigation successfully mounted Design (`?screen=2`), Run (`?screen=3`, including the WebGL building canvas) and Analyse (`?screen=4`). The complete root-domain acceptance matrix passed after the old Service Worker and `cave-workbench-v2` cache were removed.
