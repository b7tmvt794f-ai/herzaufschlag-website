# Herzaufschlag – Charity Padel

Website für **Herzaufschlag**, das Charity-Padel-Event für krebskranke Kinder. Start: Hannover 2027.

## Aufbau
- `index.html` – Startseite der Tour mit allen Städten
- `hannover/` – Seite für Hannover 2027 (Start, Spenden, Programm, Merch, Mitmachen)
- `assets/` – gemeinsames Stylesheet und Logo
- `impressum.html`, `datenschutz.html` – Vorlagen, vor dem Livegang vervollständigen

## Neue Stadt hinzufügen
Ordner `hannover/` kopieren, umbenennen (z. B. `koeln/`), Inhalte anpassen und auf der Startseite in der Städteliste verlinken.

## Offen vor dem Livegang
- Impressum und Datenschutz ausfüllen
- Spendenlink mit dem Verein abstimmen
- Instagram-Account @herzaufschlag anlegen
- Anmeldeformular an einen Dienst anschließen
- Eigene Domain herzaufschlag.de verbinden

## Veröffentlichung
Jede Änderung auf `main` wird automatisch per FTPS zu All-Inkl hochgeladen (siehe `.github/workflows/deploy-all-inkl.yml`) und ist danach unter herzaufschlag.de erreichbar.
