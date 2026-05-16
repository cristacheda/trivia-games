# Privacy

Internal implementation note aligned with the public Privacy Policy at `/privacy`. Keep this file concise and update it only when app behavior changes.

## Local-first behavior

- Atlas of Answers stores scores, recent results, game deck progress, the last selected difficulty, sound preference, and an anonymous local player id in `localStorage`.
- Anonymous play works without an account.
- Optional sign-in and sync code may exist in some builds, but gameplay does not require an account.

## Optional analytics

- Optional analytics stay off until the player explicitly allows them from the in-app `Privacy` panel.
- When enabled, analytics may include page views, game views, difficulty selection, round starts, answer outcomes, round completion, homepage game-entry clicks, and high-score events.
- Free-text answers are not included in analytics payloads.

## Hosting and essential telemetry

- The hosting provider may still process basic request, delivery, and security telemetry needed to serve and protect the site.
- If you want a strict opt-in-only analytics posture, do not enable host-injected analytics features that run before the app can read the player consent state.

## User controls and public docs

- Players can open the `Privacy` button in the header menu at any time to review the short-form summary.
- The full public legal pages live at `/privacy` and `/terms`.
- The same panel and the Settings page let players allow or deny optional analytics after first use.
