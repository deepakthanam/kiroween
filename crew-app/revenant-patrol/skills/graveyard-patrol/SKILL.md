---
name: graveyard-patrol
description: Nightly patrol procedure for the Revenant Graveyard Patrol app. Use when asked to run the graveyard patrol or to check watched repositories for newly dead npm packages.
---
# Graveyard patrol procedure

The patrol backend is this app's backend. `$PATROL` below is its base URL as provided by Crew for this app.

## Steps
1. Get the watched repositories: `GET $PATROL/repos`. If the list is empty, post "Graveyard patrol: no repositories are being watched yet." and stop.
2. For each repository, call the `audit_lockfile` tool on `<path>/package-lock.json`.
   - If the file is missing or the tool returns an error, keep `{ repoId, error }` for that repository and continue.
3. Send all results in one request: `POST $PATROL/patrols` with `{ "audits": [ { "repoId", "audit" } | { "repoId", "error" } ] }`.
   The backend decides what is newly dead and what to queue. Do not decide this yourself.
4. Read the patrol record in the response.
5. Post the summary.

## Summary format
If nothing is newly dead, nothing was queued, no runs finished and there are no errors, post one line:

`Graveyard patrol: N repositories checked, nothing new.`

Otherwise post:

```
Graveyard patrol: N repositories checked.
Newly dead (K): name@version (repo), ...
Resurrections queued (Q): name@version, ...
Finished since last patrol (F): name@version VERDICT, ...
Errors (E): repo: message, ...
```

Leave out any line whose count is zero. Every count must equal the length of the matching list in the patrol record.

## Rules
- Use verdict words exactly as recorded: `REVIVED`, `PARTIAL`, `REFUSED`.
- Do not modify any watched repository.
- Do not queue resurrections directly; only the backend queues them.
- If the graveyard tools are unavailable, post "Graveyard patrol: graveyard tools unavailable, patrol skipped." and stop.
