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

Al termine la pagina è su **https://verbali-d707e.web.app** — è questo
l'indirizzo da dare ai colleghi.

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
