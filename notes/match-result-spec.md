# Match Results — Model, Behavior, and UX Spec

**Status:** Work in progress, behind the `NEXT_PUBLIC_FEATURE_BATTLES` flag (currently `false`).
Naming, the durability model, the type layer, and the report → confirm → dispute/delete loop are
**done** (§2, §3). Elo is schema-only and unimplemented (§7). Remaining gaps are in §5.

**Purpose:** describe what exists, why it is shaped that way, what remains, and in what order —
complete enough to hand to another project.

---

## 1. What the feature is

Players record the outcome of a PvP match between two squads. One player reports; the opponent
confirms or disputes. Confirmed results form each squad's win/loss/draw record and will feed a
rating system.

The core design constraint: **the game is played on a physical tabletop, and the app is not the
referee.** There is no game state the server can verify. Every result is a claim by one human
about a shared event. The whole model is therefore built on *two-party attestation* rather than
authoritative recording.

---

## 2. Data model

### 2.1 Naming — resolved

One concept, one name: **`MatchResult`**, used for the table, PK (`matchResultId`), domain type,
repository, service, API namespace (`/api/matchResults`), and component (`MatchResultsTab`).
"Mission" was rejected because it already means a scenario from `src/data/`, and a match result
does not (yet) reference one. **"Battles" survives only as user-facing copy** — the tab label and
the "Record Battle" button — because it fits the game's voice.

### 2.2 Schema

```prisma
model MatchResult {
  matchResultId   Int      @id @default(autoincrement())
  squadAId        String?  @db.VarChar(20)
  squadBId        String?  @db.VarChar(20)
  result          String   @db.VarChar(1) // "A" = Squad A won, "B" = Squad B won, "D" = Draw
  squadBConfirmed Boolean  @default(false)
  matchDate       DateTime @default(now())

  // Snapshots taken at report time - survive deletion of the squad, user, or squad type
  squadANameSnap     String  @db.VarChar(250)
  squadAUserNameSnap String  @db.VarChar(250)
  squadATypeIdSnap   String  @db.VarChar(20)
  squadATypeNameSnap String  @db.VarChar(250)
  squadBNameSnap     String  @db.VarChar(250)
  squadBUserNameSnap String  @db.VarChar(250)
  squadBTypeIdSnap   String  @db.VarChar(20)
  squadBTypeNameSnap String  @db.VarChar(250)

  eloBeforeA      Float?
  eloBeforeB      Float?
  eloAfterA       Float?
  eloAfterB       Float?
  squadA          Squad?   @relation("SquadA", fields: [squadAId], references: [squadId], onDelete: SetNull)
  squadB          Squad?   @relation("SquadB", fields: [squadBId], references: [squadId], onDelete: SetNull)

  @@index([squadAId], map: "MatchResult_squadAId_fkey")
  @@index([squadBId], map: "MatchResult_squadBId_fkey")
}
```

Rating columns. All three are currently unwritten; `Squad.eloRating` becomes the live one in
Phase 2, the other two stay dormant — see §7:

| Table | Column | Type | Default | Role |
| --- | --- | --- | --- | --- |
| `Squad` | `eloRating` | `Float` | 1000 | **the rating** (Phase 2) |
| `User` | `eloRating` | `Float` | 1000 | unused |
| `SquadType` | `eloRating` | `Float` | 1000 | unused |

### 2.3 Key modeling decisions

**A/B are slots, not roles.** `result` is `"A"` / `"B"` / `"D"` and names the *slot*, not "the
reporter". Today Squad A is always the reporter, so they coincide, but the storage is deliberately
reporter-agnostic: allowing either side to initiate needs no data migration. This is the single
most portable decision in the model — keep it.

**Results outlive their squads.** A confirmed result is shared history between two players, so it
must not vanish because one of them deleted a squad. The FKs are nullable with `onDelete: SetNull`,
and every value needed to render a row is snapshotted at report time. Display *prefers the live
relation* (so renames show through) and falls back to the snapshot once the squad is gone. Deleted
sides render with their snapshotted name, struck through, with nothing to link to.

Snapshotting the squad type id as well as the name is deliberate: it is what makes per-archetype
balance analysis possible over historical matches, independent of whether squad types are ever
Elo-rated themselves (§7).

**Slot A is always the reporter.** This invariant is what makes a status enum unnecessary. Because
`result` is slot-based rather than reporter-based, "either side may initiate" is achieved simply by
putting whoever reports into slot A — no extra column, no migration.

**Confirmation is one boolean, and absence is a state.** `squadBConfirmed` is the entire state
machine: `false` = pending, `true` = confirmed. Disputed and withdrawn are both expressed by the
row not existing. A rejected report was never publicly visible (§3.2) and never counted toward any
record, so deleting it destroys nothing shared.

There is no reporter-side confirmation column. One existed (`squadAConfirmed`) and was always
`true`, because A is the reporter; it has been removed. `isConfirmed` is simply `squadBConfirmed`.

The one thing this costs is a spam signal: with disputed rows gone, a report → dispute → re-report
cycle leaves no trace. Capping *outstanding pending* reports per pairing (§8) stops queue-flooding,
which is the abuse that actually matters at this scale. If genuine abuse ever appears, add a small
separate dispute-event table rather than pushing state back into `MatchResult`.

**Draws are stored asymmetrically but read symmetrically.** A draw still has an A and a B slot; the
reading code never branches on slot for `"D"`.

**Elo snapshots are per-match, not derived.** Storing `eloBefore*` / `eloAfter*` on the row rather
than recomputing from history makes a rating change auditable, displayable next to the match
forever, and immune to later formula changes silently rewriting the past.

### 2.4 Domain types

`src/types/matchResult.model.ts` defines `MATCH_OUTCOME`, the `MatchOutcome` union, the
`isMatchOutcome` type guard, `MatchResultSquadInfo`, `MatchResultPlain`, and the `MatchResult`
class with `isPending` / `isConfirmed` getters and `toPlain()`.

- `result` is typed `MatchOutcome` everywhere. Prisma types the column as a bare `string`, so the
  repository narrows it with `isMatchOutcome` on read and throws on a value outside the union —
  that state is a data-integrity violation, not something to paper over.
- Nullable DB columns are `T | null` with no `?`, per the project rule. The Elo fields and
  `squadAId` / `squadBId` follow this.
- `squadA` / `squadB` are **not** optional. They used to be optional relations; now that every
  field is snapshotted on the row, one can always be constructed, which removes null-checks
  throughout the UI. `MatchResultSquadInfo.squadId` / `.userId` are `string | null` and are the
  signal for "this side was deleted".

`SquadIdentity` (`src/types/squad.model.ts`) is a flat `{ squadId, userId, squadName, userName,
squadTypeId, squadTypeName }` projection, loaded by `SquadRepository.getSquadIdentity()`. It is the
source for snapshots and avoids loading a full Squad (with units) just to write six strings.

---

## 3. How it works today

### 3.1 Lifecycle

```text
  Player 1 (owner of Squad A)                Player 2 (owner of Squad B)
  ─────────────────────────────              ─────────────────────────────
  Record Battle
    ├─ pick opponent squad (search)
    ├─ pick outcome (I Won / Draw / They Won)
    └─ POST /api/matchResults
         → row created, both sides snapshotted
           squadBConfirmed = false
                                              sees it on their squad tab,
                                              marked Pending

                                              PATCH .../confirm
                                                → squadBConfirmed = true
                                                → counts toward both records
                                              — or —
                                              DELETE .../{id}
                                                → row deleted (dispute)

  Either side may DELETE while the row is pending: Squad B disputing it and
  Squad A retracting it are the same operation.
```

### 3.2 Layers

**Repository** — `createMatchResult` (writes snapshots), `getMatchResult`,
`getMatchResultsForSquad`, `confirmMatch`, `deleteMatchResult`. `defaultInclude()` pulls both
squads with user and squad type; `toSquadInfo()` resolves live-or-snapshot.

**Visibility rule, encoded in `getMatchResultsForSquad`:**

```ts
where: {
  OR: [{ squadAId: squadId }, { squadBId: squadId }],
  ...(includeUnconfirmed ? {} : { squadBConfirmed: true }),
}
```

The rule that matters: **an unconfirmed result is an unverified claim by one party, so only the
squad's owner sees it.** Without this, anyone could paint losses onto any squad's public page, and
the public list would disagree with the public W/L/D tally. Preserve this in a port.

**Service** — thin passthroughs to the repository, matching `UnitService` / `SquadService`. It
holds no auth logic: ownership and state checks live in the route handlers, which is where this
codebase puts them (see `/api/units`, `/api/squads/{squadId}`).

**API**

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/matchResults` | session, owns Squad A | body `{ squadAId, squadBId, result }` |
| `PATCH` | `/api/matchResults/{id}/confirm` | session, owns Squad B | |
| `DELETE` | `/api/matchResults/{id}` | session, owns either squad | removes a pending match: B disputing or A deleting |
| `GET` | `/api/squads/{squadId}/matchResults` | none | public, viewer-aware: the owner also sees unconfirmed |

Match-result-keyed operations sit at the top level, matching `/api/units` — a Unit belongs to a
Squad but is not nested under one. The squad-scoped listing nests under the squad, matching
`/api/squads/{squadId}/{clone,portrait,reset}`. Multi-word segments are camelCase, as in
`/api/squadTypes`.
| `GET` | `/api/squads/search?q=` | **none** | opponent picker; still queries Prisma directly (§5.3) |

**UI** — `src/components/squad/MatchResultsTab.tsx`, mounted from `SquadPageClient.tsx` as a second
tab beside Units, both the tab bar and panel gated on `NEXT_PUBLIC_FEATURE_BATTLES === 'true'`.

---

## 4. Current UX

**Match results tab** — W/L/D record box (confirmed only, computed client-side), refresh button,
owner-only "Record Battle" button; an "Awaiting Your Confirmation" section rendering each pending
report as a plain-language sentence from the reporter's perspective with Confirm / Dispute; then a
dense history list — outcome letter, `vs {squad} by {user}`, an italic `· Pending` marker on the
viewer's own unconfirmed reports, date/time right-aligned.

**Record Battle modal** — your squad (fixed) → opponent search (debounced 300ms, min 2 chars,
excludes your own squads) → three outcome buttons labeled from *your* perspective ("I Won" / "Draw"
/ "They Won"), mapped to slot values at submit. Submit disabled until both are chosen.

What this gets right and should be kept: first-person outcome phrasing so the reporter never
reasons about who is "A"; pending reports quarantined from the opponent's public record; Confirm
and Dispute weighted equally, so disputing is not framed as an accusation; optimistic list updates;
a narrow column that works in portrait at the table.

---

## 5. Remaining gaps

### 5.1 Blocking — must fix before enabling the flag

**Players discover pending results by looking.** A result awaiting confirmation is only visible on
the opponent's own squad tab; nothing surfaces it elsewhere, and a disputed or deleted report just
disappears from the reporter's list. Workable, since players are typically at the same table, but
it means the loop depends on both people checking.

**No duplicate or spam protection.** Nothing prevents reporting the same match twice, or one user
flooding another's pending queue.

### 5.2 Convention and hygiene

- `/api/squads/search/route.ts` queries Prisma directly from the route handler; it must go through
  a service and repository like everything else.
- `/api/squads/search` has no auth despite enumerating every squad and username on the site.
- `GET /api/squads/{squadId}/matchResults` is public by design — a squad page is public — and is
  viewer-aware so only the owner sees unconfirmed results.
- The feature flag is still named `NEXT_PUBLIC_FEATURE_BATTLES` while everything else says
  `MatchResult`. Renaming it means an `.env` change on every environment — low priority, but it is
  the last inconsistency.

### 5.3 Not covered

Co-op PvE (2–4 players) and Horde Mode do not fit two FK slots.

A match result deliberately does **not** record which mission was played, MP scored, turn count, or
a played-on date distinct from `matchDate`. The outcome is the record.

---

## 6. Plan to finish

### Phase 1 — make the loop real (required to enable the flag)

**1a. Schema — done.** No further migration. `squadAConfirmed` is gone (folded into the
standardization script), and nothing is added: no status enum, no `reportedBySlot`, no second date
column. `matchDate` is the single timestamp. Everything below is behavior only.

**1b. Reporter delete — done.** `DELETE /api/matchResults/{id}` accepts *either* owner while the
row is pending: Squad B's owner deleting it is a dispute, Squad A's owner deleting it is a delete.
Both mean the same thing to the data. In the UI both go through the same confirmation modal, with
only the wording differing.

**1c. Guards.** Cap outstanding *pending* reports per reporter per opponent (suggest 3) — this is
what prevents queue-flooding now that disputed rows leave no trace. Warn, but do not block, when
the same two squads already have a match reported in the last 12 hours.

**1d. Move squad search behind a service/repository and require a session.**

Explicitly rejected for this model: `missionId` (a match result does not need to name the
scenario), per-side MP, a separate played-on date (`matchDate` is both), and free-text notes. A
match result is two squads, an outcome, and a date. Everything else was scope that would have made
the record harder to enter without making it more useful.

### Phase 2 — Elo

Rate `Squad.eloRating` per §7. No schema change needed: the `eloBefore*` / `eloAfter*` columns
already exist and are per-slot.

---

## 7. Elo — decided: the Squad is the rated entity

**`Squad.eloRating` is the rating.** A rating belongs to a specific squad — a particular 100 GP
list — not to the player and not to the archetype.

This is consistent with the schema as already built: `eloBeforeA` / `eloAfterA` are per-*slot*,
and a slot is a squad. No mapping layer is needed.

`User.eloRating` and `SquadType.eloRating` are consequently unused. Leave them in place for now
(they cost nothing and a future aggregate view may want them) but write nothing to them, and do
not surface them anywhere — a rating column that looks live but never moves is worse than no
column.

**Known trade-off, accepted:** squads are edited freely between games, so the rated entity is not
fixed — a player can rebuild a squad from scratch and keep its rating. If this turns out to matter
in practice, the mitigations in rough order of cost are: show matches-played next to the rating so
a high rating on a recently-rebuilt list is legible; freeze or decay the rating when a squad's
unit composition changes materially; or move to User-level rating. None of these need to be
decided now — the per-match Elo snapshots mean history stays auditable either way.

**Mechanics:** standard Elo, K = 32 under 30 matches then K = 16, draws score 0.5. Ratings are
applied **at confirmation time**, in the same transaction as the confirmation itself, with
before/after snapshotted onto the row. Disputed and withdrawn matches never touch ratings. Never recompute
history when the formula changes. Display: current rating in the record box, delta per history row.

---

## 8. Rules (target behavior)

1. Only a squad owner may report a match involving their squad.
2. The two squads must have different owners.
3. Only Squad B's owner may confirm.
4. Either owner may delete a pending row: B disputing, A deleting.
5. Confirming is terminal — corrections go through an admin path, not the UI.
6. Cap outstanding pending reports at 3 per reporter per opponent.
7. Duplicate guard: warn when the same pairing already has a match within 12 hours.
8. Pending reports appear only to the reporter, never on the opponent's public page.
9. Records and ratings count confirmed matches only.

Explicitly out of scope for v1: co-op / multiplayer results, PvE and Horde results, tournaments,
admin tooling beyond direct DB access, public leaderboards.

---

## 9. File map

| Path | Role |
| --- | --- |
| [prisma/schema.prisma](../prisma/schema.prisma) | `MatchResult` model; `eloRating` on User / SquadType / Squad |
| [prisma/migrate-matchresult-rename.sql](../prisma/migrate-matchresult-rename.sql) | Standardization migration (rename, SetNull FKs, snapshots, eloRating type) |
| [src/types/matchResult.model.ts](../src/types/matchResult.model.ts) | `MATCH_OUTCOME`, `MatchOutcome`, `isMatchOutcome`, `MatchResultSquadInfo`, `MatchResultPlain`, `MatchResult` |
| [src/types/squad.model.ts](../src/types/squad.model.ts) | `SquadIdentity` |
| [src/repositories/matchResult.repository.ts](../src/repositories/matchResult.repository.ts) | Prisma access, visibility rule, live-or-snapshot resolution |
| [src/repositories/squad.repository.ts](../src/repositories/squad.repository.ts) | `getSquadIdentity()` |
| [src/services/matchResult.service.ts](../src/services/matchResult.service.ts) | Validation, ownership, lifecycle |
| [src/app/api/matchResults/](../src/app/api/matchResults/) | Create, confirm, delete |
| [src/app/api/squads/[squadId]/matchResults/route.ts](../src/app/api/squads/[squadId]/matchResults/route.ts) | A squad's match results |
| [src/app/api/squads/search/route.ts](../src/app/api/squads/search/route.ts) | Opponent picker search |
| [src/components/squad/MatchResultsTab.tsx](../src/components/squad/MatchResultsTab.tsx) | Tab UI + Record Battle modal |
| [src/app/squads/[squadId]/SquadPageClient.tsx](../src/app/squads/[squadId]/SquadPageClient.tsx) | Tab bar, feature-flag gate |
