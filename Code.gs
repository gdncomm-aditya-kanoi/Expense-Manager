/**
 * Expense Manager – Google Sheets backend
 * Paste this into Extensions → Apps Script of your Google Sheet.
 *
 * 1. Change SECRET_KEY below to a long random phrase only you know.
 * 2. Run `setup` once (approve the permissions it asks for).
 * 3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 */

const SECRET_KEY = 'CHANGE-ME-to-a-long-random-phrase';

const COLUMNS = {
  Accounts:     ['id', 'name', 'group', 'open', 'link', 'limit', 'due', 'rate', 'maturity', 'cur'],
  Transactions: ['id', 'date', 'type', 'amt', 'acct', 'to', 'cat', 'note']
};

// Columns kept as plain text so Sheets doesn't turn dates or IDs into something else.
const TEXT_COLUMNS = {
  Accounts:     ['id', 'name', 'group', 'link', 'maturity', 'cur'],
  Transactions: ['id', 'date', 'type', 'acct', 'to', 'cat', 'note']
};

function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(COLUMNS).forEach(function (name) {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, COLUMNS[name].length).setValues([COLUMNS[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
}

function doGet(e) {
  const problem = checkKey_(e && e.parameter && e.parameter.key);
  if (problem) return json_({ ok: false, error: problem });
  return json_({
    ok: true,
    accounts: read_('Accounts'),
    txns: read_('Transactions'),
    sample: PropertiesService.getScriptProperties().getProperty('sample') === 'true'
  });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'The request wasn’t valid JSON.' }); }

  const problem = checkKey_(body.key);
  if (problem) return json_({ ok: false, error: problem });
  if (!Array.isArray(body.accounts) || !Array.isArray(body.txns)) {
    return json_({ ok: false, error: 'Missing accounts or transactions.' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    write_('Accounts', body.accounts);
    write_('Transactions', body.txns);
    PropertiesService.getScriptProperties().setProperty('sample', String(!!body.sample));
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, accounts: body.accounts.length, txns: body.txns.length });
}

/* ---------- helpers ---------- */

function checkKey_(key) {
  if (SECRET_KEY === 'CHANGE-ME-to-a-long-random-phrase' || !SECRET_KEY) {
    return 'Set SECRET_KEY in Code.gs, then deploy a new version.';
  }
  if (key !== SECRET_KEY) return 'Wrong secret key.';
  return '';
}

function read_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const head = values[0].map(String);
  const tz = Session.getScriptTimeZone();
  return values.slice(1)
    .filter(function (r) { return r[0] !== '' && r[0] !== null; })
    .map(function (r) {
      const o = {};
      head.forEach(function (h, i) {
        let v = r[i];
        if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        if (v !== '' && v !== null) o[h] = v;
      });
      return o;
    });
}

function write_(name, rows) {
  const ss = SpreadsheetApp.getActive();
  const cols = COLUMNS[name];
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  const data = [cols].concat(rows.map(function (o) {
    return cols.map(function (c) {
      let v = o[c];
      if (v === undefined || v === null) return '';
      // Stop notes like "=SUM(...)" or "+91..." being read as formulas.
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
      return v;
    });
  }));

  sh.clearContents();
  cols.forEach(function (c, i) {
    if (TEXT_COLUMNS[name].indexOf(c) >= 0) sh.getRange(1, i + 1, data.length, 1).setNumberFormat('@');
  });
  sh.getRange(1, 1, data.length, cols.length).setValues(data);
  sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sh.setFrozenRows(1);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
