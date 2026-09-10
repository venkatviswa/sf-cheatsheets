---
title: Salesforce CLI
subtitle: The modern `sf` command set for orgs, metadata, data, and DevOps workflows.
category: Tooling
accent: cloud
columns: 3
footer: sf CLI (v2) quick reference
---

## Install & Update

```bash
npm install -g @salesforce/cli
sf update
sf version --verbose
sf --help
```

- Command shape: `sf <topic> <command> --flags`.
- Add `--json` to any command for scriptable output.

## Authorize Orgs

```bash
sf org login web --alias dev
sf org login web --alias prod \
  --instance-url https://login.salesforce.com
sf org list
sf config set target-org dev
```

- `--set-default` (`-d`) makes it the default org.
- JWT flow for CI: `sf org login jwt`.

## Create Scratch Orgs

```bash
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias scratch --set-default --duration-days 7

sf org open --target-org scratch
sf org delete scratch --target-org scratch
```

## Deploy & Retrieve

```bash
sf project deploy start --source-dir force-app
sf project deploy start --manifest package.xml
sf project retrieve start --metadata ApexClass

sf project deploy validate --source-dir force-app
sf project deploy quick --job-id <id>
```

- `--dry-run` checks without saving.
- `--test-level RunLocalTests` for prod.

## Source Tracking

```bash
sf project deploy preview
sf project retrieve start        # pull org changes
sf project deploy start          # push local changes
```

- Scratch orgs & sandboxes track source diffs automatically.

## Run Apex & Tests

```bash
sf apex run --file script.apex
sf apex run test --code-coverage \
  --result-format human --wait 10
sf apex tail log --color
sf apex get log --number 1
```

## Query & Manipulate Data

```bash
sf data query --query "SELECT Id, Name FROM Account"
sf data create record --sobject Account \
  --values "Name='Acme'"
sf data import bulk --file accts.csv --sobject Account
sf data upsert bulk --file a.csv --sobject Account \
  --external-id Ext_Id__c
sf data export bulk --query "..." --output-file out.csv
sf data export tree --query "SELECT Id FROM Account"
```

## Packages

```bash
sf package create --name MyPkg --package-type Unlocked
sf package version create --package MyPkg \
  --installation-key-bypass --wait 20
sf package install --package 04t... --wait 10
```

## Project & Org Scaffolding

```bash
sf project generate --name my-app
sf org generate password --target-org scratch
sf sobject describe --sobject Account
sf org display --verbose
```

## Handy Flags

| Flag | Purpose |
|------|---------|
| `--target-org` `-o` | choose the org |
| `--json` | machine-readable output |
| `--wait` `-w` | minutes to wait |
| `--loglevel` | debug verbosity |

> Set defaults once with `sf config set target-org` and `target-dev-hub` to skip `-o` on every call.

## Agentforce & AI

```bash
sf agent generate agent-spec
sf agent generate authoring-bundle --spec spec.yaml
sf agent preview --api-name My_Agent
sf agent test run --api-name My_Suite
```

- The authoring-bundle flow builds an Agent Script `.agent`; `sf agent create` is the legacy (non-Agent-Script) path.
- `sf` unifies dev, data, DevOps, and Agentforce workflows in one CLI.
