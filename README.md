# Cologne Open Data MCP

Ein MCP-Server für Node.js + TypeScript, der offene Datenschnittstellen der Stadt Köln über das Model Context Protocol bereitstellt. Er eignet sich als Datenquelle für KI-gestützte Tools und Assistenten.

## Projektüberblick

- **Technologie-Stack:** Node.js (ESM), TypeScript, [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **Transport:** STDIO (Standard für MCP-Server)
- **Hauptaufgabe:** Zugriff auf Köln-spezifische Open-Data-APIs und Ausgabe strukturierter Ergebnisse in MCP-kompatiblen Antworten

## Verzeichnisstruktur

```text
Cologne-Open-Data-Mcp/
├─ src/
│  ├─ server.ts                # Einstiegspunkt – initialisiert MCP-Server und registriert Tool-Handler
│  └─ tools/                   # Alle Tooldefinitionen (zod-validierte Eingabe, Callbacks)
│     ├─ health.ts             # Basischer Health-Check
│     ├─ http_get.ts           # Generischer HTTP-GET-Wrapper
│     ├─ parking.ts            # Parkhausdaten Köln
│     ├─ baustellen.ts         # Baustellen-WFS GetCapabilities
│     ├─ rheinpegel.ts         # Rheinpegel (JSON/XML)
│     ├─ kvb_rad.ts            # KVB-Rad-Stationen aus der Nextbike-API
│     ├─ oparl_bodies.ts       # OParl-Bodies & einzelne Body-Details
│     ├─ types.ts              # Gemeinsame Dependency-Typen
│     └─ utils.ts              # Kleine Helfer (JSON-Formatierung etc.)
├─ package.json                # Skripte, Abhängigkeiten
├─ tsconfig.json               # TypeScript-Konfiguration
├─ .env.example                # Beispiellinks für alle Open-Data-APIs
└─ README.md                   # Dieses Dokument
```

## Tools & APIs

| MCP-Tool-Name                | Beschreibung                                              | Standardquelle (.env)                                                                                          |
|-----------------------------|-----------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `health`                    | Echo/Status-Check                                         | –                                                                                                               |
| `http.get_json`             | HTTP-GET mit optionalen Headern, bevorzugt JSON           | Beliebige Ziel-URL                                                                                              |
| `koeln.parking`             | Parkhaus-Auslastung                                      | `PARKING_URL=https://www.stadt-koeln.de/externe-dienste/open-data/parking.php`                                 |
| `koeln.baustellen_caps`     | WFS GetCapabilities Baustellen                           | `BAUSTELLEN_WFS=https://geoportal.stadt-koeln.de/...GetCapabilities`                                            |
| `koeln.rheinpegel`          | Rheinpegel-Feed (JSON/XML)                               | `RHEINPEGEL_URL=https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php`                            |
| `koeln.kvb_rad.stations`    | KVB-Rad-Stationen (Nextbike)                             | `NEXTBIKE_URL=https://api.nextbike.net/maps/nextbike-live.xml?city=14`                                         |
| `koeln.oparl.bodies`        | Liste politischer Bodies                                 | `OPARL_BODIES_URL=https://buergerinfo.stadt-koeln.de/oparl/bodies`                                             |
| `koeln.oparl.body`          | Einzelnes OParl-Body-Objekt nach ID oder URL             | Basis-URL wie oben, ID wird dynamisch ergänzt                                                                  |

> **Hinweis:** Alle Tools nutzen `fetch` aus `undici` und geben strukturierte MCP-Inhalte (Text) zurück. Bei JSON/XML-Antworten werden Ergebnisse vorformatiert.

## Quickstart

1. **Repository klonen**
   ```bash
   git clone https://github.com/ErtanOz/Cologne-Open-Data-Mcp.git
   cd Cologne-Open-Data-Mcp
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Optionale Umgebungsvariablen setzen**  
   Kopiere `.env.example` → `.env` und passe URLs an, falls andere Feeds gewünscht sind.

4. **Entwicklung starten**
   ```bash
   npm run dev
   ```
   Es erscheint `✅ MCP-Server läuft: Cologne-Open-Data-Mcp ready on stdio.` – der Server lauscht jetzt auf STDIO.

5. **In MCP-Client integrieren**  
   Binde den Server in deinen bevorzugten MCP-Client (z. B. Claude Desktop, Cursor, VS Code MCP) ein und rufe Tools wie `koeln.parking` oder `koeln.kvb_rad.stations` auf.

## Konfiguration (.env)

```ini
PARKING_URL=https://www.stadt-koeln.de/externe-dienste/open-data/parking.php
BAUSTELLEN_WFS=https://geoportal.stadt-koeln.de/wss/service/baustellen_wfs/guest?SERVICE=WFS&REQUEST=GetCapabilities
RHEINPEGEL_URL=https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php
NEXTBIKE_URL=https://api.nextbike.net/maps/nextbike-live.xml?city=14
OPARL_BODIES_URL=https://buergerinfo.stadt-koeln.de/oparl/bodies
```

Alle Werte können bei Bedarf auf alternative Staging-/Testendpunkte zeigen.

## Entwicklung & Tests

- `npm run dev` – tsx-gestützter Entwicklungsmodus (Hot-Reload bei Änderungen).
- `npm run build` – kompiliert TypeScript nach `dist/`.
- Tool-Handler befinden sich in `src/tools/`; gemeinsame Hilfen in `src/tools/utils.ts`.

## Lizenz

MIT (siehe Projekt in GitHub). Open-Data-Quellen unterliegen den jeweiligen Nutzungsbedingungen der Stadt Köln bzw. der Drittanbieter.
