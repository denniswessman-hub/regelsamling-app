# Regelsamlingen

En mobilanpassad, installerbar webbapp för iPhone, Android och dator.

**Öppna appen:** https://denniswessman-hub.github.io/regelsamling-app/

- Fritextsökning med markering av sökord och stöd för citattecken.
- Sök lagrum som `PL 13`, `RB 24:8` och `BrB 24 kap. 1 §`.
- Rullistor för författning och kapitel.
- Läs hela bestämmelsen och öppna dess officiella källa.
- Spara lagrum lokalt på enheten.
- Installerbar PWA med offlinecache efter en komplett första hämtning.
- Ljus design i blått och orange, anpassad för mobil och större skärm.

## Innehåll

Appen bygger på **Regelsamling_uppdaterad_2026-11-17.pdf**, 334 sidor, med kontrolldatum **17 november 2026**. Den omfattar 44 författningsurval och 5 polisföreskrifter, med övergångsbestämmelser och tidsmarkeringar från underlaget.

Urvalet utgår från Regelsamling 2023-1, sammanställd av Mikael Thoudal. Författningstexternas primärkällor är Riksdagen, Regeringskansliet och Polismyndigheten. Källänk finns vid varje lagrum.

Detta är ett **fristående studieverktyg**, inte en publikation från Polismyndigheten. Innehållet uppdateras inte automatiskt. Fyra interna dokument (PM 2022:27, PM 2019:11, PM 2017:05, PM 2017:48) kunde inte versionsverifieras och återges inte som gällande interna rutiner. Se informationen i appen.

Författningstext i ett daterat urval ersätter inte kontroll av rättskällor, ikraftträdande och övergångsbestämmelser i ett enskilt ärende.

## Installation på mobil

**iPhone:** Öppna i Safari → Dela → Lägg till på hemskärmen.  
**Android/Samsung:** Öppna webbläsarens meny → Installera app / Lägg till på hemskärmen.

Offline fungerar när appen har laddat ned samtliga appfiler. Enheten kan rensa webbdata. Officiella källänkar kräver internet.

## Utveckling och publicering

Ingen pakethämtning eller byggprocess behövs. HTML, CSS och JavaScript körs direkt i webbläsaren.

```sh
npm start
npm test
```

GitHub Pages publicerar rotmappen från grenen `main`. `.nojekyll` markerar statisk publicering.

- `assets/regelsamling.json`: strukturerad källtext.
- `core.mjs`: sökning och textmarkering.
- `app.mjs`: gränssnitt, filter, läsvy och lokala bokmärken.
- `scripts/import-source.mjs`: konvertering från det kontrollerade PDF-underlagets strukturerade källfiler.
- `sw.js`: offlinecache. Ändra cacheversionen vid publicerade innehållsuppdateringar.
- `tests/core.test.mjs`: meningsfulla sök- och innehållskontroller.

Vid en juridisk uppdatering ska underlaget först verifieras mot officiella källor. Uppdatera sedan data, kontrolldatum, cacheversion och testfall. Publicera aldrig enbart en ny datumetikett på oförändrat underlag.

## Integritet

Sökningar och sparade lagrum behandlas i webbläsaren. Ingen analyskod, ingen egen databas och inget konto krävs. Besök och filhämtning hanteras av GitHub Pages enligt GitHubs villkor.
