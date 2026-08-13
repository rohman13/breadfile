# BreadFile Architecture

BreadFile is a static, privacy-first browser application. PDF files stay on the user's device. The application remains vanilla TypeScript and migrates incrementally from the retained BentoPDF architecture.

## Dependency direction

```text
main.ts
  -> app/bootstrap + shell
  -> tools/registry
  -> tool controller
  -> tool view + tool service
  -> shared UI + core browser/PDF services
  -> third-party libraries
```

Rules:

1. Core processing never imports application or UI modules.
2. Shared UI does not know tool IDs.
3. Processing functions return data; controllers decide whether to preview or download it.
4. Tool-specific state belongs to its controller.
5. Each tool implements `mount(context)` and `dispose()`.
6. Long-lived resources have an explicit owner and cleanup path.
7. The executable registry is the public-tool source of truth.
8. New application code should use browser APIs rather than Node polyfills unless a wrapped dependency requires them.
9. Routine DOM typing does not justify `@ts-expect-error`.
10. Retained BentoPDF modules are implementation inventory, not automatically supported product features.

## Tool contract

Contracts live in `src/js/tools/contracts.ts`. A public tool registry entry owns metadata and a lazy loader. A tool module receives a container and a small `AppServices` object, then mounts its view and disposes listeners/resources when closed.

A new migrated tool should normally require:

```text
src/js/tools/<tool>/
  index.ts       controller and lifecycle
  view.ts        DOM construction only
  service.ts     processing only
  *.test.ts      service/contract tests

src/js/tools/registry.ts  one registry entry
```

## Migration status

| Tool | Architecture |
|---|---|
| Delete Pages | Native tool contract; pure service; owned document session |
| Remaining public tools | Temporary lazy `LegacyToolAdapter` |
| Hidden BentoPDF modules | Retained legacy/upstream code |

The adapter is a strangler-migration boundary. Migrate public tools one at a time; do not rewrite all inherited modules merely to rearrange files.

## State and cleanup

`resetState()` is data-only. The application shell owns view cleanup. Migrated controllers own transient document data and event listeners. `DocumentSession.dispose()` releases references, while `ObjectUrlManager` owns and revokes object URLs.

## Error boundary

Core services throw `ProcessingError` with predictable codes. Controllers translate these into friendly messages. Third-party errors should not leak directly into views.

## Verification gates

- Existing unit/regression suite
- Pure service tests
- Unique registry IDs
- Every public loader returns `mount` and `dispose`
- Production build
- Browser switching and disposal smoke tests
- Real PDF output validation
