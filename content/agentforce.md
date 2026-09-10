---
title: Agentforce & AI
subtitle: Build, ground, and deploy autonomous AI agents on the Salesforce Platform.
category: Agentforce
accent: orange
columns: 3
footer: Agentforce quick reference
---

## What Is an Agent

An **Agentforce** agent is an LLM-powered assistant that reasons over a request, routes it to a **subagent**, and runs **actions** to complete work — grounded in your Salesforce data and protected by the Einstein Trust Layer.

## Building Blocks

- **Agent** — the assistant, its role and instructions.
- **Subagent** — a job area with a scope + instructions. Called a **Topic** before April 2026; metadata type is still `GenAiPlugin`.
- **Action** — a concrete capability the agent can run.
- **Instructions** — natural-language guidance to the model.

## Subagents (Topics)

- The **Atlas Reasoning Engine** classifies each request into **one subagent**.
- Each has a **scope**, **instructions**, and assigned actions.
- Keep them distinct and non-overlapping to avoid mis-routing.
- "Topic" is the pre–April 2026 name; functionality is unchanged.

## Actions

| Type | Backed by |
|------|-----------|
| Apex | `@InvocableMethod` or REST |
| Flow | Autolaunched flow |
| Prompt Template | Grounded LLM prompt |
| External Service | OpenAPI / HTTP |
| MuleSoft | MuleSoft API |

## Prompt Templates

- Types: **Sales Email**, **Field Generation**, **Record Summary**, **Record Prioritization**, **Flex**.
- Ground with merge fields, related lists, and Data 360.
- Build and test in **Prompt Builder** before wiring to an action.

## Agent Script (.agent)

```yaml
subagent Order_Management:
  description: "Look up and manage orders"
  reasoning:
    actions:
      lookup_order: @actions.lookup_order
  actions:
    lookup_order:
      description: "Look up orders"
      target: "flow://GetOrdersByContact"
```

- Indentation-based (YAML-like), authored in `AiAuthoringBundle` metadata.

## sf CLI

```bash
sf agent generate agent-spec
sf agent generate authoring-bundle --spec spec.yaml
sf agent preview --api-name My_Agent
sf agent test run --api-name My_Suite
```

- The authoring-bundle flow builds an Agent Script `.agent`; `sf agent create` is the legacy (non-Agent-Script) path.

## Grounding & RAG

- Ground answers in CRM records, Knowledge, and **Data 360** retrievers (Data Cloud was rebranded Data 360 in Oct 2025).
- Retrieval-augmented generation keeps responses factual and current.

## Testing

- Define suites with **AiEvaluationDefinition** (test spec YAML).
- `sf agent test run` asserts topic + action selection and outputs.
- Add red-team cases for prompt injection and jailbreaks.

## Einstein Trust Layer

- Zero data retention with the model provider.
- Toxicity detection + prompt-injection defense.
- Full audit trail of every generation.
- Note: field/pattern **data masking is disabled for agents** — protection relies on zero-retention.

## Deploy & Observe

- Agents are metadata — ship via `sf project deploy`.
- Activate, assign, and manage in **Agentforce Studio**.
- Monitor production sessions to catch regressions early.
