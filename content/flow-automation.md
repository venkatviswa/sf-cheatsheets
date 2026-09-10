---
title: Flow & Automation
subtitle: Declarative process automation with Salesforce Flow — types, elements, and best practices.
category: Automation
accent: teal
columns: 3
footer: Salesforce Flow quick reference
---

## Flow Types

- **Screen Flow** — guided UI with user input.
- **Record-Triggered** — runs on create / update / delete.
- **Schedule-Triggered** — runs on a set schedule.
- **Autolaunched** — called by Apex, REST, or subflow.
- **Platform Event-Triggered** — on an event message.
- **Orchestration** — multi-step, multi-user work (Flow Orchestration).

## Record-Triggered Timing

| Timing | Use for |
|--------|---------|
| **Before save** | fast same-record field updates |
| **After save** | related records, email, async |
| **Async path** | callouts, slow work |

> Before-save updates are ~10× faster than after-save for the triggering record.

## Core Elements

- **Assignment** — set variable values.
- **Decision** — branch on conditions.
- **Loop** — iterate a collection.
- **Get / Create / Update / Delete Records** — DML.
- **Screen** — collect input (screen flows).
- **Action / Subflow** — call Apex, email, other flows.

## Resources

- **Variable** — store a value (input/output capable).
- **Formula** — computed, read-only.
- **Constant**, **Choice**, **Text Template**.
- A **collection** is a Variable with *Allow multiple values* enabled — not its own resource type.

## Entry Conditions

```
Object:    Opportunity
Trigger:   A record is updated
Condition: StageName = 'Closed Won'
Optimize:  Actions and Related Records
```

- "Only when requirements are met" avoids needless re-runs.

## Fault Handling

- Add a **Fault path** to Get / DML / Action elements.
- Show `{!$Flow.FaultMessage}` on a screen, or log it.
- Unhandled faults roll back the whole transaction.

## Bulkification

- Flows process records in **batches** automatically.
- Never place **Get or DML inside a Loop** — assign into a
  collection, then act once after the loop.

## Best Practices

- Sequence multiple flows per object with **Trigger Order** and **Flow Trigger Explorer** — don't force everything into one mega-flow.
- Extract reusable logic into **subflows**.
- Name and describe every element and resource.
- Gate with a custom permission to bypass on data loads.

## Scheduled Paths

- Add time-based paths to after-save flows.
- Offset from a date field or from the trigger fire time.
- Ideal for reminders, escalations, and follow-ups.

## Flow vs Apex vs Validation

| Need | Use |
|------|-----|
| Same-record field checks | Validation Rule |
| Declarative logic & UI | Flow |
| Complex loops, callouts, bulk | Apex |

> Record-triggered flows can also block a save with the **Custom Error** element — like a validation rule, but with logic.

## Migrate to Flow

- **Workflow Rules** and **Process Builder** reached **end of support on Dec 31, 2025** — build all new automation in Flow.
- Convert existing rules and processes with the **Migrate to Flow** tool.

## Debug & Activate

- **Debug** replays a flow with real or test data.
- Inspect fault emails and debug logs when it errors.
- Only one **active version**; keep others as drafts.
