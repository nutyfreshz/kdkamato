# Homepage scroll rescue

Starting production: 0ec9b69dacd3db30a66763abf032a561bc2fa6b3.
Implementation merged through PR #5: 2d491d1f7b106f798874b586490f13a6a609f742.

## Scope
User explicitly deferred visual QA and requested full-page vertical animation first.
Existing artwork and product functionality are preserved. No new artwork generated.

## Architecture
- HomePage mounts useHomeMotion after streamed content arrives.
- One homepage scroll subscription with requestAnimationFrame batching and cached measurements.
- Hero camera movement; Descent opaque vertical wipes; Manga/Knowledge/LAB spatial content and frame entrances.
- Training/Real Kendo native sticky takeover with opaque frames, natural #kendo anchor, separate compact layout.
- Portal spatial entrance on the same background surface.
- Removed old negative-margin overlap, gradient masks, crossfade handoff properties, transition fades and duplicate Descent scroll listener.

## Verification and remaining work
Final local production build and TypeScript passed; all app routes built.
Early preview confirmed #kendo overlap removal at 1363 x 936. Final full-page choreography has NOT received visual QA.
Required desktop/tablet/mobile viewport matrix, slow/fast/reverse scroll frame review, touch/navigation checks and full route regression remain deferred. Do not infer visual quality or 60fps from build success.

## Deployment
Main merge did not immediately produce a production deployment in the connected Vercel listing. This checkpoint also provides a direct main-branch push event for the existing Git integration. Confirm the resulting deployment targets production and reaches READY before reporting the release live.
