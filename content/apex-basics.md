---
title: Apex Essentials
subtitle: The server-side language of the Salesforce Platform — syntax, DML, triggers, and governor limits.
category: Development
accent: teal
columns: 3
footer: Apex programming quick reference
---

## Primitive Types

- `Integer`, `Long`, `Double`, `Decimal`
- `String`, `Boolean`, `Id`
- `Date`, `Datetime`, `Time`
- `Blob`, `Object`

```apex
Decimal price = 19.99;
Date today = Date.today();
Id acctId = '001...';
```

## Collections

```apex
List<String> names = new List<String>{'a','b'};
Set<Id> ids = new Set<Id>();
Map<Id, Account> byId =
  new Map<Id, Account>([SELECT Id FROM Account]);
```

- `List` — ordered, allows duplicates.
- `Set` — unique, unordered.
- `Map` — key/value; great for lookups by Id.

## DML Statements

```apex
insert acct;
update contactList;
upsert leadList External_Id__c;
delete oldRecords;
```

- Operate on **lists**, not single rows, to bulkify.
- `Database.insert(list, false)` → partial success + `SaveResult[]`.

## SOQL in Apex

```apex
List<Account> accts =
  [SELECT Id, Name FROM Account
   WHERE Industry = :ind LIMIT 50];

for (Account a : [SELECT Id FROM Account]) {
  // SOQL for-loop chunks 200 rows — heap-safe
}
```

## Trigger Skeleton

```apex
trigger AccountTrigger on Account
  (before insert, after update) {
  if (Trigger.isBefore && Trigger.isInsert) {
    AccountHandler.onBeforeInsert(Trigger.new);
  }
}
```

- One trigger per object; delegate to a **handler class**.
- Context: `Trigger.new`, `.old`, `.newMap`, `.oldMap`.

## Trigger Context Vars

| Var | Available |
|-----|-----------|
| `isBefore/isAfter` | all events |
| `isInsert/Update/Delete/Undelete` | matching event |
| `new` / `newMap` | insert, update, undelete |
| `old` / `oldMap` | update, delete |
| `size` | all events |

## SOSL & Exceptions

```apex
try {
  insert acct;
} catch (DmlException e) {
  System.debug(e.getMessage());
} finally {
  // cleanup
}
```

- Custom: `class MyException extends Exception {}`
- `throw new MyException('bad');`

## Async Apex

- `@future(callout=true)` — fire-and-forget method.
- `Queueable` — chainable, supports state.
- `Batchable` — process millions of rows in chunks.
- `Schedulable` — run on a cron schedule.

```apex
System.enqueueJob(new MyQueueable());
```

## Governor Limits

Per synchronous transaction:

| Resource | Sync | Async |
|----------|------|-------|
| SOQL queries | 100 | 200 |
| DML statements | 150 | 150 |
| Rows via DML | 10,000 | 10,000 |
| CPU time | 10,000 ms | 60,000 ms |
| Heap size | 6 MB | 12 MB |
| Callouts | 100 | 100 |

> Bulkify: **no SOQL/DML inside loops.** Query once, work with collections.

## Testing

```apex
@isTest
private class AccountHandlerTest {
  @isTest static void insertsOk() {
    Test.startTest();
    insert new Account(Name='T');
    Test.stopTest();
    System.assertEquals(1,
      [SELECT COUNT() FROM Account]);
  }
}
```

- **75%** org coverage required to deploy.
- Use `@testSetup`; never rely on org data (`SeeAllData=false`).

## Security

```apex
List<Account> a = [SELECT Name FROM Account
  WITH USER_MODE];
Account clean = (Account) Security
  .stripInaccessible(AccessType.READABLE, recs)
  .getRecords()[0];
```

- `WITH USER_MODE` enforces CRUD + FLS + sharing.
- **API v67+**: DB ops run in user mode by default and classes default to `with sharing`; `WITH SECURITY_ENFORCED` is removed — use `WITH USER_MODE`.
- `with sharing` / `without sharing` / `inherited sharing` on classes.
