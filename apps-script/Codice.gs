/**
 * Archivio verbali su Google Drive — U.O. San Lorenzo
 * Riceve dalla Cloud Function "archiviaVerbale" la scansione di un verbale
 * e la salva nella cartella CARTELLA del Drive di chi pubblica lo script.
 *
 * Impostazioni progetto → Proprietà script → aggiungi TOKEN con lo stesso
 * valore del segreto Firebase ARCHIVIO_TOKEN.
 */
const CARTELLA = 'Verbali da lavorare';
const TIPI = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

function doPost(e) {
  try {
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    const body = JSON.parse(e.postData.contents);
    if (!token || body.token !== token) return risposta({ error: 'Non autorizzato' });

    const ext = TIPI[body.mediaType];
    if (!ext || typeof body.data !== 'string' || !body.data) return risposta({ error: 'File mancante o formato non supportato' });

    const nome = String(body.nome || 'VERBALE').replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim().slice(0, 150) + '.' + ext;
    const blob = Utilities.newBlob(Utilities.base64Decode(body.data), body.mediaType, nome);
    const file = cartella().createFile(blob);
    return risposta({ ok: true, nome: file.getName() });
  } catch (err) {
    return risposta({ error: String(err) });
  }
}

function cartella() {
  const it = DriveApp.getFoldersByName(CARTELLA);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARTELLA);
}

function risposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Da eseguire una volta dall'editor (▶ Esegui) per concedere l'accesso a Drive
function autorizza() {
  Logger.log('Cartella pronta: ' + cartella().getName());
}
