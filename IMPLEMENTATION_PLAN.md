# Implementační plán

Poslední aktualizace: 6. 9. 2026

Tento dokument obsahuje pouze plánované změny. Implementovaný stav a přijatá technická rozhodnutí jsou v [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md).

## Cílový workflow

Jedno spuštění `job-search` dostane jediný společný vstup a paralelně prohledá všechny zdroje ve zvoleném source listu. Jednotlivé adaptery převedou společná kritéria na kontrakt konkrétního portálu, výsledky sjednotí do `JobResult` a zachovají izolaci chyb po zdrojích. Přidání dalšího portálu nesmí vyžadovat změnu vstupního kontraktu Trigger.dev tasku.

Acquisition fáze má získat širší množinu kandidátů, aktuálně až `limitPerSource: 50` z každého zdroje. Až následná společná vrstva má provést mezizdrojovou deduplikaci, relevance scoring podle `query` a `context` a aplikovat finální prezentační limit. Pořadí ani relevance dodané jednotlivým scraperem se nepovažují za autoritativní.

Společná kritéria musí mít předvídatelnou sémantiku napříč zdroji. Požadavek `workArrangements: ["remote", "hybrid"]` má zahrnout oba režimy, i když konkrétní Actor nabízí pouze hrubší filtr. Nepodporované kritérium nesmí být tiše interpretované jinak; adapter ho buď bezpečně doplní lokálním filtrem, nebo výsledek označí diagnostickou informací.

## Následující kroky

1. **Přidat společný relevance scoring a finální limit.** Vyhodnotit širší množinu až 50 kandidátů na zdroj podle názvu, popisu, technologií, profilu a preferencí. Finální pořadí vytvářet až po normalizaci; nativní pořadí portálů použít pouze jako pomocný signál. Výstup má vysvětlit hlavní důvody relevance.
2. **Zpřesnit společná kritéria a capability mapping.** Evidovat, které zdroje podporují lokalitu, pracovní režim a stáří nabídky nativně a kde se filtruje až po stažení. Doplnit diagnostiku ignorovaných kritérií. Zvlášť ověřit Jobs.cz klasifikaci `remote` versus `hybrid` a mapování `remoteLevel` u No Fluff Jobs.
3. **Přidat mezizdrojovou deduplikaci.** Párovat nabídky podle normalizované firmy, názvu, lokality a obsahového otisku, ale u výsledku zachovat všechny původní `sourceId` a URL.
4. **Dokončit provozní ověření současných tří zdrojů.** Spustit placený opt-in smoke test nad celým seznamem `czech`, ověřit pokrytí proti ručnímu hledání, nasadit Trigger.dev task a potvrdit cloudový run včetně přibalených JSON konfigurací.
5. **Vytvořit vlastní Apify Actor pro Skilleto.** Preferovat HTTP crawler; browserovou automatizaci použít jen tehdy, pokud bez ní nelze získat úplný veřejný výpis.
6. **Provést technický spike pro Jobstack a ITJobs.cz.** Ověřit podmínky použití, dostupnost feedu nebo veřejného datového endpointu, stránkování, stabilní ID a nutnost JavaScriptového renderování. Podle výsledku použít oficiální integraci nebo vlastní Actor.
7. **Otestovat existující Actory pro Just Join IT, JenPrace.cz, Profesia.cz a Grafton.** Porovnat pokrytí s portálem, validitu polí, duplicity, cenu a stabilitu opakovaných běhů. Actor přijmout až po splnění stejných kontraktových testů jako vlastní integrace.
8. **Nastavit politiku pro LinkedIn a Indeed.** LinkedIn ponechat jako experimentální zdroj a Indeed nezapínat v produkci, dokud nebude vyřešeno oprávnění k automatizovanému získávání dat.

## Nice to have do budoucna

- Perzistence nabídek, historie běhů a evidence prvního i posledního výskytu nabídky.
- Plánované hledání přes Trigger.dev schedules.
- E-mailové nebo jiné notifikace pouze pro nové či významně změněné nabídky.
- Webové/API rozhraní, autentizace a správa uložených hledání.
- Normalizace mzdy, měny, období odměny, pracovního režimu a typu spolupráce.
- Monitoring zdraví jednotlivých zdrojů, cenové limity, alerty a fallback Actory.
- Idempotentní retry a run registry, aby opakování nevytvářelo duplicitní náklady ani data.
- Průběžná kontrola změn podmínek použití, robots pravidel a datových kontraktů portálů.
