# Aktuální stav aplikace

Poslední aktualizace: 6. 9. 2026

Tento dokument popisuje pouze to, co je v repozitáři implementované nebo ověřené. Budoucí práce je v [implementačním plánu](../IMPLEMENTATION_PLAN.md).

## Funkční vertikální řez

Aplikace implementuje cestu:

```text
Trigger.dev task / lokální CLI
              |
              v
       validace vstupu
              |
              v
       načtení konfigurace
              |
              v
 výběr všech nebo zadaných sourceIds
              |
              v
 paralelní runJobSearch(...) pro zdroje
              |
              v
 ApifyProvider → registry → adapter zdroje
              |
              v
 normalizace + filtr pracovního režimu
              |
              v
 outcomes zdrojů + celkový stav + log
```

Stejný orchestrátor používá lokální CLI i Trigger.dev task. Pokud vstup neobsahuje `sourceIds`, spustí se paralelně všechny zdroje vybraného source listu. Zdrojové chyby jsou izolované: kombinace úspěšných a neúspěšných zdrojů vrací stav `partial`, zatímco selhání všech zdrojů ukončí běh chybou.

## Implementované části

- TypeScript v strict mode a Node.js 26.
- Zod validace konfigurace, vstupu hledání a normalizovaného výsledku.
- Katalog zdrojů a pojmenované seznamy `czech` a `remote-international`.
- Volitelný podvýběr `sourceIds` v rámci zvoleného seznamu.
- Apify provider s injektovatelným klientem a registry adapterů.
- Adaptery pro `curious_coder/linkedin-jobs-scraper`, `automation-lab/jobs-cz-scraper` a `solidcode/nofluffjobs-scraper` včetně vlastního vstupu Actoru a normalizace výstupu.
- Společné kritérium `workArrangements` s hodnotami `remote`, `hybrid` a `onsite`; remote a hybrid se filtrují znovu nad normalizovanými výsledky.
- Runtime validace položek Actor datasetu a normalizace do `JobResult`.
- Kontrola finálního stavu Apify běhu a ochrana proti tichému přijetí neprázdného datasetu, ze kterého nelze normalizovat žádnou nabídku.
- Čitelný terminálový výstup i strukturovaný `JobSearchRunResult`.
- Trigger.dev `schemaTask` `job-search` s jediným pokusem, protože opakování placeného Actoru zatím není idempotentní.
- Přibalení `config/**/*.json` do Trigger.dev buildu a externalizace `apify-client` a `proxy-agent` kvůli CJS/ESM interopu.
- Fixture a kontraktové testy všech tří adapterů, testy provideru a orchestrace bez síťového nebo placeného volání.
- Opt-in live smoke test nad všemi zdroji v seznamu `czech`.

Trigger.dev Test task byl prakticky použit pro multi-source běh. Aktuální revize po změně na `workArrangements` a produkční cloudový deploy zatím nejsou ověřené end-to-end.

## Konfigurace

`config/sources.json` definuje každý zdroj právě jednou. Soubory v `config/source-lists/` obsahují pouze odkazy na source ID. Loader ověřuje unikátnost ID, existenci referencí, známý provider a adapter i platnost povinných hodnot.

Aktuálně jsou v registry tři adaptery:

| Source ID | Adapter | Actor |
| --- | --- | --- |
| `linkedin-jobs` | `linkedin-jobs-curious-coder` | `curious_coder/linkedin-jobs-scraper` |
| `jobs-cz` | `jobs-cz` | `automation-lab/jobs-cz-scraper` |
| `nofluffjobs` | `nofluffjobs` | `solidcode/nofluffjobs-scraper` |

`czech` obsahuje LinkedIn Jobs, Jobs.cz a No Fluff Jobs; `remote-international` obsahuje LinkedIn Jobs a No Fluff Jobs.

Adaptery překládají společný vstup takto:

- LinkedIn přebírá celý text dotazu a pracovní režimy přidává do přirozeného dotazu. Podporuje také `location`, `geoId`, `postedWithinDays` a limit.
- Jobs.cz rozdělí čárkami oddělený dotaz na `searchQueries`, předá `location`, `workArrangements`, `maxItems` a používá bezpečnostní limit tří stránek na dotaz.
- No Fluff Jobs rozdělí dotaz na `searchQueries` a používá českou edici `country: "cz"`. Nativní `remoteOnly` zapne jen pro čistě remote hledání; kombinaci remote a hybrid rozliší až podle normalizovaných `isRemote` a `remoteLevel`.

## Vstup hledání

Vstup odděluje aplikovatelná kritéria od kontextu pro budoucí hodnocení:

```json
{
  "sourceListId": "czech",
  "instructions": {
    "criteria": {
      "query": "frontend developer, React, TypeScript",
      "geoId": "104508036",
      "workArrangements": ["remote", "hybrid"],
      "postedWithinDays": 7
    },
    "context": {
      "profile": "Experienced frontend software engineer",
      "preferences": ["design systems", "accessibility"]
    }
  },
  "limitPerSource": 50
}
```

`query` je povinný. Vynechané `sourceIds` znamená všechny zdroje ze source listu; zadaná ID musí být jeho podmnožinou. `workArrangements` přijímá unikátní hodnoty `remote`, `hybrid` a `onsite`; staré `remote: true` zůstává dočasně podporované jako požadavek pouze na remote nabídky. `postedWithinDays` přijímá `1`, `7` nebo `30` a `limitPerSource` hodnoty `1–50`.

Hodnota 50 je acquisition strop pro každý zdroj, nikoliv garantovaný počet ani finální prezentační limit. Zdroj může vrátit méně nabídek kvůli počtu shod, stránkování, deduplikaci, nevalidním položkám nebo následnému filtru pracovního režimu. `context` se ukládá ve vstupu, ale zatím neovlivňuje filtrování ani pořadí výsledků. `geoId` a `postedWithinDays` nyní používá pouze LinkedIn adapter.

## Výstupní kontrakty

Normalizovaná nabídka má tento tvar:

```ts
type JobResult = {
  externalId?: string;
  title: string;
  company: string;
  location?: string;
  workArrangement?: "remote" | "hybrid" | "onsite";
  remote?: boolean;
  salary?: string;
  url: string;
  sourceId: string;
  publishedAt?: string;
  description?: string;
};
```

`workArrangement` je kanonické pole pro pracovní režim. Pole `remote` zůstává ve výstupu kvůli kompatibilitě; chybějící hodnota se neinterpretuje jako `false`. Mzda zůstává zdrojovým textem. Výsledek běhu obsahuje časy začátku a dokončení, stav `success | partial | failed` a samostatný outcome každého zdroje.

Úspěšný outcome má `jobs`, neúspěšný outcome má prázdné `jobs` a textové `error`. Pokud uspěje alespoň jeden zdroj, orchestrátor vrátí výsledek; kombinace úspěchu a chyby má stav `partial`. Když selžou všechny vybrané zdroje, výsledek se vypíše do logu a task skončí výjimkou.

## Provozní rozhodnutí

- Tokeny se načítají z prostředí až při použití a nejsou součástí run payloadu.
- Neplatný vstup nebo konfigurace se odmítne před placeným voláním.
- Vybrané zdroje se spouštějí paralelně a každý používá adapter určený v katalogu.
- Provider přijímá data pouze z Apify běhu se stavem `SUCCEEDED`; ostatní finální stavy převádí na chybu zdroje včetně dostupné status message.
- Prázdný dataset je úspěšný výsledek s nulou nabídek.
- Nevalidní dataset item se přeskočí s obecným varováním bez citlivých dat. Neprázdný dataset bez jediné validní nabídky je chyba kontraktu, nikoliv falešný úspěch.
- Dataset i normalizovaný výstup respektují `limitPerSource`; explicitní pracovní režimy se aplikují ještě jednou po normalizaci.
- Pořadí výsledků přebírá aplikace od poskytovatele; vlastní ranking neprovádí.
- Automatické testy používají fixture a fake providery, nikoliv síť. Síťový smoke test se spouští pouze s `RUN_LIVE_SMOKE=1` a může být placený.

## Známá omezení

- Není implementovaný vlastní relevance scoring ani finální globální limit. Výsledky proto zachovávají pořadí jednotlivých Actorů, které nemusí odpovídat relevanci pro uživatele.
- Dotaz oddělený čárkami se pro Jobs.cz a No Fluff Jobs rozdělí na více hledání, zatímco LinkedIn dostává celý text. Sémantika fulltextového hledání se mezi portály liší.
- `postedWithinDays` a `geoId` se aplikují pouze na LinkedIn. Ostatní adaptery zatím nevydávají upozornění na nepodporovaná kritéria.
- No Fluff Jobs Actor umí nativně pouze remote-only filtr. Pro kombinaci remote a hybrid se stáhne širší sada a onsite výsledky se odstraní lokálně; po filtrování proto může zbýt méně než `limitPerSource`.
- Klasifikace pracovního režimu závisí na datech komunitních Actorů a může být chybná nebo chybět. Výsledek bez rozpoznaného režimu explicitním filtrem neprojde.
- No Fluff Jobs adapter nyní vždy používá českou edici, i když je zdroj také v seznamu `remote-international`.
- Komunitní Actor může bez upozornění změnit vstupní nebo výstupní kontrakt; kontraktové testy zachytí známý tvar, ne změnu v živé službě bez spuštění smoke testu.
- Není implementovaná perzistence, mezizdrojová deduplikace, plánování ani notifikace.
- Bez perzistence není bezpečné automaticky opakovat placený běh.
- Aktuální revize po změně vstupu na `workArrangements` nebyla ověřená placeným end-to-end během v produkčním Trigger.dev prostředí.
