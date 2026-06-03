# Token Activity Widget DX Design

## Goal

Improve first-use experience for `token-activity-widget`, add a local sandbox that behaves like a real consumer app, and create a stronger validation path for package and sandbox changes.

## Decisions

- Keep the package generic and installation-focused in metadata and README.
- Add a single sandbox app that supports two testing modes:
  - direct-data rendering
  - hosted fetching from a local mock API
- Make the sandbox consume the local package so changes are exercised through the real package entrypoint instead of copied demo code.
- Add root scripts that make common flows obvious:
  - install sandbox dependencies
  - run sandbox
  - watch package build while sandbox is open
  - build sandbox for smoke validation

## DX Improvements

- Clear requirements in README
- Direct-data quick start before the hosted example
- Hosted endpoint contract documented inline
- Sandbox commands documented in the main README
- `verify:all` command to validate both the package artifact and the sandbox consumer build

## Sandbox Shape

- Vite + React app under `sandbox/`
- Rich control panel for mode, sample dataset, width, preset, and theme overrides
- Preview pane that renders either `ActivityWidget` or `ActivityWidgetFromData`
- Local mock `/api/public-widget/:publicId` responses for hosted-mode testing
- Multiple sample datasets, including zero activity and longer names

## Validation

- Keep existing package tests
- Build the package before sandbox flows
- Build the sandbox as part of `verify:all`
- Use a live local run to confirm the sandbox behaves correctly in the browser
