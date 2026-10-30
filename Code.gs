const SPREADSHEET_ID = 'REPLACE_WITH_SPREADSHEET_ID';
const FLAVOR_SHEET = 'フレーバーDB';
const BARCODE_SHEET = 'バーコードDB';
const SECRET_PROPERTY = 'API_SHARED_SECRET';

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty(SECRET_PROPERTY);
    if (!expected || request.secret !== expected) throw new Error('Unauthorized');
    let result;
    if (request.action === 'list') result = listFlavors_();
    else if (request.action === 'lookup') result = lookup_(request.barcode);
    else if (request.action === 'register') result = register_(request.barcode, request.flavorId);
    else throw new Error('Unknown action');
    return json_({ok:true, data:result});
  } catch (err) {
    return json_({ok:false, error:String(err && err.message || err)});
  }
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function ss_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sheet_(name) { const sh = ss_().getSheetByName(name); if (!sh) throw new Error('Missing sheet: '+name); return sh; }
function listFlavors_() {
  const rows = sheet_(FLAVOR_SHEET).getDataRange().getDisplayValues();
  const headers = rows.shift() || [];
  const id = headers.indexOf('フレーバーID'), maker = headers.indexOf('メーカー'), flavor = headers.indexOf('フレーバー');
  if ([id,maker,flavor].includes(-1)) throw new Error('フレーバーDBの列名を確認してください');
  return rows.filter(r=>r[id]).map(r=>({id:r[id].trim(), maker:r[maker].trim(), flavor:r[flavor].trim()}));
}
function validateBarcode_(barcode) {
  const s = String(barcode || '').trim();
  if (!/^\d{8,14}$/.test(s)) throw new Error('バーコードは8〜14桁の数字です');
  return s;
}
function lookup_(barcode) {
  const b = validateBarcode_(barcode);
  const rows = sheet_(BARCODE_SHEET).getDataRange().getDisplayValues();
  const row = rows.slice(1).find(r=>String(r[0]).trim()===b);
  return row ? {found:true, flavorId:String(row[1]).trim()} : {found:false};
}
function register_(barcode, flavorId) {
  const b = validateBarcode_(barcode), id = String(flavorId || '').trim();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const flavors = listFlavors_();
    const flavor = flavors.find(f=>f.id===id);
    if (!flavor) throw new Error('フレーバーが見つかりません');
    const sh = sheet_(BARCODE_SHEET);
    const rows = sh.getDataRange().getDisplayValues();
    if (rows.slice(1).some(r=>String(r[0]).trim()===b)) throw new Error('登録済みのバーコードです');
    const next = sh.getLastRow()+1;
    sh.getRange(next,1).setNumberFormat('@');
    sh.getRange(next,1,1,3).setValues([[b,id,new Date()]]);
    return {barcode:b, flavor};
  } finally { lock.releaseLock(); }
}
