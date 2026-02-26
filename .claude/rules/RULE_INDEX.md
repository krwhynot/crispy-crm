# Rule Index

This index maps every legacy rule item (`L001`..`L150`) to exactly one stable Rule ID.
Legacy item definitions (file, line, type, text) live in `LEGACY_RULE_ITEMS.json`.

## Mapping Ranges

### CODE_QUALITY.md

- `L001-L002` -> `CORE-002`
- `L003` -> `CORE-022`
- `L004` -> `CORE-002`
- `L005-L011` -> `CORE-003`
- `L012` -> `CORE-004`
- `L013` -> `DOM-009`
- `L014` -> `CORE-003`
- `L015-L016` -> `CORE-018`
- `L017` -> `CORE-019`
- `L018-L019` -> `CORE-014`
- `L020` -> `CORE-015`
- `L021-L022` -> `CORE-014`
- `L023-L024` -> `CORE-021`

### DATABASE_LAYER.md

- `L025` -> `DB-001`
- `L026` -> `DB-003`
- `L027` -> `DB-005`
- `L028` -> `DB-003`
- `L029` -> `DB-007`
- `L030` -> `DB-008`
- `L031` -> `DB-012`
- `L032` -> `DB-010`
- `L033-L034` -> `DB-003`
- `L035` -> `DB-001`
- `L036` -> `DB-013`
- `L037-L038` -> `DB-001`
- `L039` -> `DB-003`
- `L040` -> `DB-004`
- `L041` -> `DB-010`
- `L042` -> `DB-011`
- `L043` -> `DB-007`
- `L044` -> `DB-003`
- `L045` -> `DB-008`
- `L046` -> `DB-009`

### DOMAIN_INTEGRITY.md

- `L047` -> `DOM-001`
- `L048` -> `DOM-005`
- `L049` -> `DOM-006`
- `L050` -> `DOM-003`
- `L051-L052` -> `DOM-008`
- `L053` -> `DOM-009`
- `L054` -> `DOM-001`
- `L055` -> `DOM-010`
- `L056` -> `DOM-003`
- `L057` -> `DOM-004`
- `L058` -> `DOM-005`
- `L059` -> `DOM-007`
- `L060` -> `DOM-008`
- `L061` -> `DOM-009`

### MODULE_CHECKLIST.md

- `L062` -> `MOD-001`
- `L063` -> `MOD-003`
- `L064` -> `MOD-005`
- `L065` -> `MOD-007`
- `L066` -> `MOD-008`
- `L067` -> `MOD-009`
- `L068` -> `MOD-003`
- `L069-L070` -> `MOD-001`
- `L071` -> `MOD-003`
- `L072` -> `MOD-004`
- `L073-L074` -> `MOD-005`
- `L075` -> `MOD-006`
- `L076-L077` -> `MOD-007`
- `L078-L079` -> `MOD-008`
- `L080` -> `MOD-009`
- `L081` -> `MOD-010`

### PROVIDER_RULES.md

- `L082` -> `PRV-001`
- `L083` -> `PRV-002`
- `L084` -> `PRV-003`
- `L085` -> `PRV-005`
- `L086` -> `PRV-007`
- `L087` -> `PRV-006`
- `L088` -> `PRV-009`
- `L089-L090` -> `PRV-010`
- `L091` -> `PRV-011`
- `L092` -> `PRV-012`
- `L093` -> `PRV-013`
- `L094` -> `PRV-004`
- `L095-L097` -> `PRV-001`
- `L098-L099` -> `PRV-002`
- `L100` -> `PRV-003`
- `L101` -> `PRV-005`
- `L102` -> `PRV-009`
- `L103` -> `PRV-004`
- `L104` -> `PRV-010`
- `L105` -> `PRV-011`
- `L106` -> `PRV-014`

### STALE_STATE_STRATEGY.md

- `L107-L108` -> `STALE-001`
- `L109-L110` -> `STALE-002`
- `L111` -> `STALE-003`
- `L112` -> `STALE-004`
- `L113` -> `STALE-005`
- `L114` -> `STALE-006`
- `L115-L117` -> `STALE-007`
- `L118-L119` -> `STALE-008`
- `L120` -> `STALE-009`
- `L121` -> `STALE-010`
- `L122` -> `STALE-007`
- `L123` -> `STALE-001`
- `L124` -> `STALE-002`
- `L125` -> `STALE-003`
- `L126` -> `STALE-009`
- `L127` -> `STALE-006`
- `L128` -> `STALE-007`
- `L129` -> `STALE-010`
- `L130` -> `STALE-004`

### UI_STANDARDS.md

- `L131` -> `UI-001`
- `L132` -> `UI-002`
- `L133` -> `UI-004`
- `L134` -> `UI-005`
- `L135` -> `UI-006`
- `L136-L137` -> `UI-007`
- `L138` -> `UI-006`
- `L139` -> `UI-008`
- `L140-L142` -> `UI-001`
- `L143` -> `UI-006`
- `L144-L145` -> `UI-002`
- `L146-L147` -> `UI-006`
- `L148-L149` -> `UI-003`
- `L150` -> `UI-004`

## Integrity Contract

- Every `Lxxx` item has exactly one `ruleId` in `RULE_INDEX.json`.
- `RULE_INDEX.md` is a compressed view of the same mapping.
- Run `CMD-008` to enforce one-to-one coverage.
