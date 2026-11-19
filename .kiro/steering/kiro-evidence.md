---
inclusion: always
---
# Keep the Kiro usage log

The hackathon is judged partly on how Kiro was used. After finishing any spec task or orchestrator phase:

1. Append a dated entry to the matching section of `docs/KIRO_USAGE.md` (specs, hooks, steering, custom agents, MCP, property-based testing, powers, surfaces, vibe coding).
2. Record concrete facts only: what was asked, which Kiro feature did the work, what it caught or saved, and anything that went wrong. Two to four lines.
3. When a property test finds a counterexample, record the shrunk input and what was changed (code, property or requirement). These are the most valuable entries.
4. Update `docs/PROGRESS.md`: current phase, tasks done, gate status, open questions.

Do not invent or embellish entries. If a feature was not used for a task, do not mention it.
