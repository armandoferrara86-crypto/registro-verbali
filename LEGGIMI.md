# Registro Verbali — Scansione automatica

Pagina + Cloud Function sul progetto Firebase `verbali-d707e`.
La chiave dell'intelligenza artificiale resta sul server: nella pagina non c'è.

## Cosa serve (una volta sola)

1. **Piano Blaze su Firebase** — le Cloud Functions lo richiedono.
   Console Firebase → ⚙️ → Utilizzo e fatturazione → Modifica piano → Blaze.
   Ha una quota gratuita mensile ampia; imposta un avviso di budget (es. 5 €).
2. **Chiave API Anthropic** — da https://platform.claude.com (sezione API Keys),
   con un po' di credito caricato.
3. **Node.js 20** e **Firebase CLI** sul PC:
   ```
   npm install -g firebase-tools
   firebase login
   ```

## Installazione

Dalla cartella `verbali-scan`:

```
cd functions
npm install
cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY
   (incolla la chiave quando la chiede)
firebase deploy
```

## Indirizzi

- **Pagina (da dare ai colleghi):** https://armandoferrara86-crypto.github.io/registro-verbali/
- **Pagina di riserva (Firebase Hosting):** https://verbali-d707e.web.app
- **Funzione di lettura:** https://europe-west1-verbali-d707e.cloudfunctions.net/leggiVerbale
- **Funzione di archivio su Drive:** https://europe-west1-verbali-d707e.cloudfunctions.net/archiviaVerbale
- **Codice:** https://github.com/armandoferrara86-crypto/registro-verbali

Il progetto Firebase `verbali-d707e` appartiene all'account `armandoferrara86@gmail.com`:
è con questo che va fatto `firebase login`.

## Ripetere il deploy dopo una modifica

| Cosa hai modificato | Comando |
|---|---|
| `public/index.html` | `git add -A && git commit -m "..." && git push` (GitHub Pages si aggiorna da solo in circa un minuto), poi `firebase deploy --only hosting` per la pagina di riserva |
| `functions/index.js` | `firebase deploy --only functions`, poi commit e push |
| `firestore.rules` | `firebase deploy --only firestore:rules`, poi commit e push |
| La chiave API | `firebase functions:secrets:set ANTHROPIC_API_KEY`, poi `firebase deploy --only functions` |

La chiave deve essere legata a un workspace (creata da platform.claude.com dentro
un workspace, es. "Default"): con una chiave non legata a un workspace la scansione
risponde "Servizio di lettura non disponibile (400)".

Per vedere gli errori della funzione: `firebase functions:log --only leggiVerbale`.

## Archivio delle scansioni su Google Drive

Quando si salva un verbale appena scansionato, il file viene copiato nella cartella
**"Verbali da lavorare"** del Drive dell'account che ha creato l'Apps Script
(progetto "ARCHIVIO VERBALI" su script.google.com, codice in `apps-script/Codice.gs`).
Nome del file: `NUMERO VERBALE - DENOMINAZIONE - DATA`. I PDF restano originali,
le foto arrivano ridotte a 2000 px. Se l'invio fallisce il verbale resta comunque
salvato nel registro.

Il collegamento usa due segreti Firebase:
- `ARCHIVIO_URL`: indirizzo `/exec` dell'app web dello script;
- `ARCHIVIO_TOKEN`: codice segreto, uguale alla proprietà `TOKEN` dello script.

Se si modifica lo script: Esegui il deployment → Gestisci deployment → ✏️ →
Versione "Nuova versione" (così l'indirizzo resta lo stesso).
Se cambia l'indirizzo: `firebase functions:secrets:set ARCHIVIO_URL`, poi
`firebase deploy --only functions`.

## Regole Firestore

`firestore.rules` mette il registro in **sola scrittura**: dalla pagina si possono
solo aggiungere verbali (anche con l'import CSV in modalità "aggiungi"), con i soli
campi del registro, testi di lunghezza limitata e data AAAA-MM-GG. Lettura,
modifica e cancellazione sono chiuse a tutti; tutto il resto è negato.

Non c'è ancora login, quindi le regole non distinguono un collega da un estraneo:
per questo il registro non si legge dalla pagina. Si consulta dalla console Firebase
(Firestore Database → `elenco_verbali`), che non passa dalle regole.
Quando ci sarà il login con Google le regole torneranno ad aprire lettura e modifica
solo agli account autorizzati.

## Se pubblichi la pagina altrove (GitHub Pages, Netlify…)

Aggiungi l'indirizzo in `functions/index.js`, nella lista `ALLOWED_ORIGINS`,
e rifai `firebase deploy --only functions`. Senza questo passo la scansione
risponde "Origine non autorizzata".

## Se l'indirizzo della funzione è diverso

Dopo il deploy il terminale mostra il "Function URL". Se non coincide con
`https://europe-west1-verbali-d707e.cloudfunctions.net/leggiVerbale`,
copialo in `public/index.html` nella riga `const OCR_ENDPOINT = ...`.

## Costi indicativi

Ogni scansione è una singola lettura: pochi centesimi di euro a verbale.
Per centinaia di verbali al mese si resta nell'ordine di qualche euro.
