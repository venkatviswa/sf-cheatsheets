---
title: SOQL & SOSL
subtitle: Querying and searching Salesforce data — syntax, clauses, and limits at a glance.
category: Development
accent: electric
columns: 3
footer: Salesforce Object Query & Search Language
---

## Basic SOQL Shape

```sql
SELECT Id, Name, Industry
FROM Account
WHERE Industry = 'Tech'
ORDER BY Name ASC
LIMIT 100
```

- `SELECT` fields are **explicit** — no `SELECT *`.
- Field & object API names are case-insensitive.
- Query in Apex, REST, `sf data query`, or the Query Editor.

## WHERE Operators

| Operator | Meaning |
|----------|---------|
| `=` `!=` | equals / not |
| `<` `>` `<=` `>=` | comparison |
| `LIKE` | wildcard (`%`, `_`) |
| `IN` / `NOT IN` | value set / subquery |
| `INCLUDES` | multi-select picklist |

```sql
WHERE Name LIKE 'Acme%'
  AND AnnualRevenue > 1000000
```

## Bind Variables (Apex)

```apex
String ind = 'Tech';
List<Account> a =
  [SELECT Id FROM Account
   WHERE Industry = :ind];
```

> Always bind variables — never concatenate user input (SOQL injection).

## Relationship Queries

**Child → Parent** (dot notation, up to 5 levels):

```sql
SELECT Name, Account.Owner.Name
FROM Contact
```

**Parent → Child** (subquery, use the child relationship name):

```sql
SELECT Name,
  (SELECT LastName FROM Contacts)
FROM Account
```

- Up to **20** parent → child subqueries per query.

## Aggregates & GROUP BY

```sql
SELECT Industry, COUNT(Id) total
FROM Account
GROUP BY Industry
HAVING COUNT(Id) > 5
```

- Functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
- Returns `AggregateResult` in Apex; alias then `get('total')`.

## Date Literals

```sql
WHERE CreatedDate = TODAY
WHERE CloseDate = THIS_MONTH
WHERE CreatedDate = LAST_N_DAYS:30
```

- Use literals, not hard-coded dates.
- `YESTERDAY`, `THIS_WEEK`, `NEXT_QUARTER`, `THIS_FISCAL_YEAR`.

## Ordering, Nulls & Limits

```sql
ORDER BY LastModifiedDate DESC NULLS LAST
LIMIT 200 OFFSET 20
```

- `OFFSET` max **2000**; prefer keyset pagination for large sets.
- `FOR UPDATE` locks rows within the transaction.

## SOSL — Full-Text Search

```sql
FIND {Acme OR "Global Media"}
IN ALL FIELDS
RETURNING Account(Name),
          Contact(FirstName, LastName)
```

- Searches **across objects** at once; SOQL queries one object tree.
- Scopes: `ALL FIELDS`, `NAME FIELDS`, `EMAIL FIELDS`, `PHONE FIELDS`, `SIDEBAR FIELDS`.
- Great when you don't know which field holds the term.

## Governor Limits

| Limit | Value |
|-------|-------|
| SOQL queries / transaction | **100** sync · **200** async |
| Rows retrieved / transaction | **50,000** |
| SOSL queries / transaction | **20** |
| SOSL rows returned | 2,000 |

> Bulkify: query **outside** loops, filter with `IN :collection`.

## Tooling

```bash
sf data query --query \
  "SELECT Id, Name FROM Account LIMIT 5"

sf data query --query "..." --bulk
```

- Add `--result-format csv|json|human`.
- `USING SCOPE mine` limits to the running user's records.
