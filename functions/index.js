/**
 * leggiVerbale — Cloud Function per la lettura automatica dei verbali scansionati.
 * Riceve una foto (JPEG) o un PDF in base64, la passa a Claude e restituisce
 * i campi del registro. La chiave API resta qui, mai nella pagina HTML.
 *
 * U.O. San Lorenzo — A.C. Ferrara
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Siti autorizzati a chiamare la funzione: aggiungi qui l'indirizzo dove pubblichi la pagina
const ALLOWED_ORIGINS = [
  'https://verbali-d707e.web.app',
  'https://verbali-d707e.firebaseapp.com',
  'https://armandoferrara86-crypto.github.io',
];

const MODEL = 'claude-sonnet-5-5';

const PROMPT = `Sei un operatore della Polizia Municipale di Napoli. Ti viene mostrata la scansione di un verbale di accertamento/contestazione, spesso compilato a mano.
Leggilo con attenzione e compila lo strumento "registra_verbale".

Regole:
- Trascrivi i testi in MAIUSCOLO, come nel registro.
- denom: ragione sociale o insegna dell'attività o nome del trasgressore; se è leggibile la partita IVA aggiungila così: "NOME PIVA12345678901".
- sede: indirizzo dell'attività (es. "VIA DUOMO 100"), senza CAP né città.
- verbale: numero del verbale come stampato (es. "VV24990085765").
- data: data dell'accertamento nel formato AAAA-MM-GG. I verbali italiani scrivono la data come GG/MM/AAAA: il primo numero è il GIORNO.
- norme: norme violate in forma breve (es. "L.R. 7/2020", "L 447/95", "DLGS 193/07"); più norme separate da " - ".
- note: sintesi breve della violazione contestata (es. "NO SCIA SANITARIA").
- tipo: scegli SOLO tra i valori ammessi; se non è deducibile lascia vuoto.
- Se un campo è illeggibile o assente lascialo vuoto "". Non inventare nulla.
- In "incerti" elenca le chiavi dei campi che hai compilato ma di cui non sei sicuro (grafia poco chiara, cifre ambigue).`;

function corsHeaders(req, res) {
  const origin = req.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  return ALLOWED_ORIGINS.includes(origin);
}

exports.leggiVerbale = onRequest(
  { region: 'europe-west1', secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB', maxInstances: 5 },
  async (req, res) => {
    const allowed = corsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (!allowed) return res.status(403).json({ error: 'Origine non autorizzata' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

    try {
      const { mediaType, data, tipologie } = req.body || {};
      const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!okTypes.includes(mediaType) || typeof data !== 'string' || !data) {
        return res.status(400).json({ error: 'File mancante o formato non supportato' });
      }
      if (data.length > 20 * 1024 * 1024) {
        return res.status(413).json({ error: 'File troppo grande' });
      }
      const tipi = Array.isArray(tipologie) ? tipologie.filter(t => typeof t === 'string').slice(0, 50) : [];

      const fileBlock = mediaType === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: mediaType, data } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data } };

      const tool = {
        name: 'registra_verbale',
        description: 'Registra i dati letti dal verbale scansionato.',
        input_schema: {
          type: 'object',
          properties: {
            tipo:    { type: 'string', enum: [...tipi, ''], description: 'Tipologia attività tra i valori ammessi' },
            denom:   { type: 'string' },
            sede:    { type: 'string' },
            verbale: { type: 'string' },
            data:    { type: 'string', description: 'AAAA-MM-GG' },
            norme:   { type: 'string' },
            note:    { type: 'string' },
            incerti: { type: 'array', items: { type: 'string', enum: ['tipo','denom','sede','verbale','data','norme','note'] } }
          },
          required: ['tipo','denom','sede','verbale','data','norme','note','incerti']
        }
      };
      if (!tipi.length) delete tool.input_schema.properties.tipo.enum;

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY.value(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          tools: [tool],
          tool_choice: { type: 'tool', name: 'registra_verbale' },
          messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: PROMPT }] }]
        })
      });

      const out = await r.json();
      if (!r.ok) {
        console.error('Anthropic API', r.status, JSON.stringify(out));
        return res.status(502).json({ error: 'Servizio di lettura non disponibile (' + r.status + ')' });
      }

      const call = (out.content || []).find(b => b.type === 'tool_use');
      if (!call) return res.status(502).json({ error: 'Risposta non valida dal servizio di lettura' });

      const { incerti = [], ...campi } = call.input || {};
      return res.json({ campi, incerti });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Errore interno: ' + e.message });
    }
  }
);
