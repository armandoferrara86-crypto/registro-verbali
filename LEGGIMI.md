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

## Regole Firestore

`firestore.rules` consente lettura e scrittura solo su `elenco_verbali` e nega
tutto il resto. Non c'è login: chi conosce l'indirizzo può leggere e modificare
il registro.

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
