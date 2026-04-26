// ═══════════════════════════════════════════════════════════════
//  BurgerBoss POS — Google Apps Script Backend
//  Copy-paste the entire file into Apps Script editor, then
//  Deploy → New deployment → Web app → Execute as: Me →
//  Who has access: Anyone → Deploy → copy URL.
// ═══════════════════════════════════════════════════════════════

// If this script is NOT bound to a spreadsheet, paste the Sheet ID:
var SPREADSHEET_ID = '1bw9L53ncmbBeyY8ua3oVQCI5B9cO77mAssgnXk-rD9c';

// ── Core helpers ─────────────────────────────────────────────────
function ss() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  var s = ss().getSheetByName(name);
  if (!s) s = ss().insertSheet(name);
  return s;
}

function okJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

// Always use Manila timezone so dates are consistent across devices
function nowPH() {
  return Utilities.formatDate(new Date(), 'Asia/Manila', 'MM/dd/yyyy HH:mm:ss');
}
function todayISO() {
  return Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
}

// ── doGet ────────────────────────────────────────────────────────
function doGet(e) {
  var params = e.parameter || {};
  var action = params.action || '';
  try {
    switch (action) {
      case 'inventory':     return okJson(getInventory());
      case 'sales':         return okJson(getSales());
      case 'purchases':     return okJson(getPurchases());
      case 'expenses':      return okJson(getExpenses());
      case 'recipes':       return okJson(getRecipes());
      case 'get_eod_state': return okJson(gasGetEodState());
      case 'get_users':     return okJson(getUsers());
      case 'ping':          return okJson({ ok: true, time: nowPH(), today: todayISO() });
      default:              return okJson({ error: 'Unknown GET action: ' + action });
    }
  } catch (err) {
    return okJson({ error: String(err) });
  }
}

// ── doPost ───────────────────────────────────────────────────────
function doPost(e) {
  var payload = {};
  try { payload = JSON.parse(e.postData.contents); } catch (ex) {}
  var action = payload.action || '';
  try {
    switch (action) {
      case 'verify_login':    return okJson(verifyLogin(payload));
      case 'add_user':        return okJson(addUserGAS(payload));
      case 'delete_user':     return okJson(deleteUserGAS(payload));
      case 'log_sale':        return okJson(logSale(payload));
      case 'adjust_stock':    return okJson(adjustStock(payload));
      case 'log_purchase':    return okJson(logPurchase(payload));
      case 'log_expense':     return okJson(logExpense(payload));
      case 'log_eod':         return okJson(logEOD(payload));
      case 'reconcile_stock': return okJson(reconcileStock(payload.deductions || []));
      case 'start_day':       return okJson(gasStartDay(payload));
      case 'end_day':         return okJson(gasEndDay(payload));
      case 'save_settings':   return okJson(saveSettings(payload));
      default:                return okJson({ error: 'Unknown POST action: ' + action });
    }
  } catch (err) {
    return okJson({ error: String(err) });
  }
}

// ════════════════════════════════════════════════════════════════
//  EOD STATE — uses PropertiesService for instant cross-device sync
//  No sheet needed. Data is stored at the script level.
// ════════════════════════════════════════════════════════════════

function gasGetEodState() {
  var props     = PropertiesService.getScriptProperties();
  var today     = todayISO();
  var eodDate   = props.getProperty('eod_date')   || '';
  var eodStatus = props.getProperty('eod_status') || 'none';

  if (eodDate !== today) return { status: 'none', serverDate: today };

  return {
    date:    eodDate,
    status:  eodStatus,
    begCash: parseFloat(props.getProperty('eod_beg_cash') || '0') || 0,
    begInv:  props.getProperty('eod_beg_inv') || '[]'
  };
}

function gasStartDay(p) {
  var props   = PropertiesService.getScriptProperties();
  var today   = todayISO(); // always use server Manila date
  props.setProperties({
    'eod_date':     today,
    'eod_status':   'started',
    'eod_beg_cash': String(p.begCash || 0),
    'eod_beg_inv':  String(p.begInv  || '[]')
  });
  return { ok: true, date: today };
}

function gasEndDay(p) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('eod_status', 'ended');
  return { ok: true };
}

// ════════════════════════════════════════════════════════════════
//  READ HANDLERS
// ════════════════════════════════════════════════════════════════

function getInventory() {
  return sheetToObjects(getSheet('Inventory'));
}
function getSales() {
  return sheetToObjects(getSheet('Sales'));
}
function getPurchases() {
  return sheetToObjects(getSheet('Purchases'));
}
function getExpenses() {
  return sheetToObjects(getSheet('Expenses'));
}
function getRecipes() {
  return sheetToObjects(getSheet('Recipes'));
}

// ════════════════════════════════════════════════════════════════
//  WRITE HANDLERS
// ════════════════════════════════════════════════════════════════

// ── Log Sale + auto-deduct stock ──────────────────────────────────
function logSale(p) {
  var sheet   = getSheet('Sales');
  var lr      = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Date','Time','Order ID','Customer','Items','Total','Payment Method','Cash Received','Change','Timestamp'];
    sheet.appendRow(headers);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var row = headers.map(function(h) {
    switch (String(h).trim()) {
      case 'Date':           return p.date          || todayISO();
      case 'Time':           return p.time          || nowPH();
      case 'Order ID':       return p.orderId       || '';
      case 'Customer':       return p.customer      || 'Walk-in';
      case 'Items':          return p.items         || '';
      case 'Total':          return parseFloat(p.total)         || 0;
      case 'Payment Method': return p.paymentMethod  || 'Cash';
      case 'Cash Received':  return parseFloat(p.cashReceived)  || 0;
      case 'Change':         return parseFloat(p.change)        || 0;
      case 'Timestamp':      return new Date();
      default:               return '';
    }
  });
  sheet.appendRow(row);

  if (p.items) deductStock(p.items);

  return { ok: true };
}

// ── Stock deduction via Recipes ───────────────────────────────────
function deductStock(itemsSummary) {
  var spreadsheet  = ss();
  var recipeSheet  = spreadsheet.getSheetByName('Recipes');
  var invSheet     = spreadsheet.getSheetByName('Inventory');
  if (!recipeSheet || !invSheet) return;

  var recipeData   = recipeSheet.getDataRange().getValues();
  var invData      = invSheet.getDataRange().getValues();
  var recHeaders   = recipeData[0].map(function(h) { return String(h).trim(); });
  var invHeaders   = invData[0].map(function(h) { return String(h).trim(); });

  // Support both old and new column names
  var menuCol    = recHeaders.indexOf('Menu Item Name') >= 0 ? recHeaders.indexOf('Menu Item Name') : recHeaders.indexOf('Item');
  var ingCol     = recHeaders.indexOf('Ingredient')     >= 0 ? recHeaders.indexOf('Ingredient')     : recHeaders.indexOf('ingredient');
  var qtyUsedCol = recHeaders.indexOf('Qty Used')       >= 0 ? recHeaders.indexOf('Qty Used')       : recHeaders.indexOf('qtyUsed');
  var itemCol    = invHeaders.indexOf('Item Name')         >= 0 ? invHeaders.indexOf('Item Name')         : invHeaders.indexOf('Item');
  var stockCol   = invHeaders.indexOf('Stock (Base Unit)') >= 0 ? invHeaders.indexOf('Stock (Base Unit)') : invHeaders.indexOf('Stock');
  var updatedCol = invHeaders.indexOf('Last Updated');

  if (menuCol < 0 || ingCol < 0 || qtyUsedCol < 0 || itemCol < 0 || stockCol < 0) return;

  // Build recipe map
  var recipeMap = {};
  for (var ri = 1; ri < recipeData.length; ri++) {
    var key = String(recipeData[ri][menuCol]).trim().toLowerCase();
    if (!key) continue;
    if (!recipeMap[key]) recipeMap[key] = [];
    recipeMap[key].push({
      ingredient: String(recipeData[ri][ingCol]).trim().toLowerCase(),
      qtyUsed:    parseFloat(recipeData[ri][qtyUsedCol]) || 0
    });
  }

  // Parse "Burger x2, Hotdog x1"
  var ingUsage = {};
  String(itemsSummary).split(',').forEach(function(part) {
    var m = part.trim().match(/^(.+)\s+x(\d+)$/i);
    if (!m) return;
    var menuKey = m[1].trim().toLowerCase();
    var qty     = parseInt(m[2]) || 0;
    (recipeMap[menuKey] || []).forEach(function(r) {
      ingUsage[r.ingredient] = (ingUsage[r.ingredient] || 0) + r.qtyUsed * qty;
    });
  });

  // Apply to inventory
  var now = nowPH();
  for (var ii = 1; ii < invData.length; ii++) {
    var name = String(invData[ii][itemCol]).trim().toLowerCase();
    if (ingUsage[name] === undefined) continue;
    var current  = parseFloat(invData[ii][stockCol]) || 0;
    var newStock = Math.max(0, current - ingUsage[name]);
    invSheet.getRange(ii + 1, stockCol + 1).setValue(newStock);
    if (updatedCol >= 0) invSheet.getRange(ii + 1, updatedCol + 1).setValue(now);
  }
}

// ── Bulk reconcile (past sales) ───────────────────────────────────
function reconcileStock(deductions) {
  if (!deductions || !deductions.length) return { ok: true, updated: 0 };
  var invSheet = ss().getSheetByName('Inventory');
  if (!invSheet) return { ok: false, error: 'No Inventory sheet' };

  var invData    = invSheet.getDataRange().getValues();
  var invHeaders = invData[0].map(function(h) { return String(h).trim(); });
  var itemCol    = invHeaders.indexOf('Item Name')         >= 0 ? invHeaders.indexOf('Item Name')         : invHeaders.indexOf('Item');
  var stockCol   = invHeaders.indexOf('Stock (Base Unit)') >= 0 ? invHeaders.indexOf('Stock (Base Unit)') : invHeaders.indexOf('Stock');
  var updatedCol = invHeaders.indexOf('Last Updated');

  var deductMap = {};
  deductions.forEach(function(d) {
    deductMap[String(d.ingredient).trim().toLowerCase()] = parseFloat(d.qty) || 0;
  });

  var now = nowPH();
  var updated = 0;
  for (var i = 1; i < invData.length; i++) {
    var name = String(invData[i][itemCol]).trim().toLowerCase();
    if (deductMap[name] === undefined) continue;
    var current  = parseFloat(invData[i][stockCol]) || 0;
    var newStock = Math.max(0, current - deductMap[name]);
    invSheet.getRange(i + 1, stockCol + 1).setValue(newStock);
    if (updatedCol >= 0) invSheet.getRange(i + 1, updatedCol + 1).setValue(now);
    updated++;
  }
  return { ok: true, updated: updated };
}

// ── Stock In ──────────────────────────────────────────────────────
function adjustStock(p) {
  var invSheet = ss().getSheetByName('Inventory');
  if (!invSheet) return { ok: false, error: 'No Inventory sheet' };

  var invData    = invSheet.getDataRange().getValues();
  var invHeaders = invData[0].map(function(h) { return String(h).trim(); });
  var itemCol    = invHeaders.indexOf('Item Name')         >= 0 ? invHeaders.indexOf('Item Name')         : invHeaders.indexOf('Item');
  var stockCol   = invHeaders.indexOf('Stock (Base Unit)') >= 0 ? invHeaders.indexOf('Stock (Base Unit)') : invHeaders.indexOf('Stock');
  var updatedCol = invHeaders.indexOf('Last Updated');

  var target = String(p.itemName || p.name || '').trim().toLowerCase();
  var qty    = parseFloat(p.qty)  || 0;
  var mode   = p.mode || 'add';
  var now    = nowPH();

  for (var i = 1; i < invData.length; i++) {
    if (String(invData[i][itemCol]).trim().toLowerCase() !== target) continue;
    var current  = parseFloat(invData[i][stockCol]) || 0;
    var newStock = mode === 'set' ? qty : Math.max(0, current + qty);
    invSheet.getRange(i + 1, stockCol + 1).setValue(newStock);
    if (updatedCol >= 0) invSheet.getRange(i + 1, updatedCol + 1).setValue(now);
    return { ok: true, newStock: newStock };
  }
  return { ok: false, error: 'Item not found: ' + (p.itemName || p.name) };
}

// ── Log Purchase ──────────────────────────────────────────────────
function logPurchase(p) {
  var sheet = getSheet('Purchases');
  var lr    = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Date','Supplier','Item Name','Quantity','Unit','Unit Cost','Line Total','Notes','Timestamp'];
    sheet.appendRow(headers);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var rows = Array.isArray(p.items) ? p.items : [p];
  rows.forEach(function(item) {
    var row = headers.map(function(h) {
      switch (String(h).trim()) {
        case 'Date':       return p.date      || todayISO();
        case 'Supplier':   return p.supplier  || item.supplier || '';
        case 'Item Name':  return item.itemName || item.name   || '';
        case 'Quantity':   return parseFloat(item.qty)      || 0;
        case 'Unit':       return item.unit   || '';
        case 'Unit Cost':  return parseFloat(item.unitCost) || 0;
        case 'Line Total': return parseFloat(item.lineTotal) || (parseFloat(item.qty || 0) * parseFloat(item.unitCost || 0));
        case 'Notes':      return p.notes     || item.notes || '';
        case 'Timestamp':  return new Date();
        default:           return '';
      }
    });
    sheet.appendRow(row);
  });
  return { ok: true };
}

// ── Log Expense ───────────────────────────────────────────────────
function logExpense(p) {
  var sheet = getSheet('Expenses');
  var lr    = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Date','Category','Description','Amount','Paid By','Notes','Timestamp'];
    sheet.appendRow(headers);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var row = headers.map(function(h) {
    switch (String(h).trim()) {
      case 'Date':        return p.date        || todayISO();
      case 'Category':    return p.category    || 'General';
      case 'Description': return p.description || p.desc || '';
      case 'Amount':      return parseFloat(p.amount) || 0;
      case 'Paid By':     return p.paidBy      || '';
      case 'Notes':       return p.notes       || '';
      case 'Timestamp':   return new Date();
      default:            return '';
    }
  });
  sheet.appendRow(row);
  return { ok: true };
}

// ── Log EOD ───────────────────────────────────────────────────────
function logEOD(p) {
  var sheet = getSheet('EOD Log');
  var lr    = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Date','Done By','Timestamp','Beg Cash','Cash Sales','Purchases','Ending Cash','Orders','Notes'];
    sheet.appendRow(headers);
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var cash = p.cash || {};
  var row = headers.map(function(h) {
    switch (String(h).trim()) {
      case 'Date':        return p.date                               || todayISO();
      case 'Done By':     return p.doneBy                            || 'POS';
      case 'Timestamp':   return p.timestamp ? new Date(p.timestamp) : new Date();
      case 'Beg Cash':    return parseFloat(cash.beginning)          || 0;
      case 'Cash Sales':  return parseFloat(cash.cashSales)          || 0;
      case 'Purchases':   return parseFloat(cash.purchases)          || 0;
      case 'Ending Cash': return parseFloat(cash.ending)             || 0;
      case 'Orders':      return parseFloat(p.orders)                || 0;
      case 'Notes':       return p.notes                             || '';
      default:            return '';
    }
  });
  sheet.appendRow(row);

  // Mark day ended in Properties
  gasEndDay({});
  return { ok: true };
}

// ── Save Settings ─────────────────────────────────────────────────
function saveSettings(p) {
  var sheet = getSheet('Settings');
  if (sheet.getLastRow() === 0) sheet.appendRow(['Key', 'Value']);

  function setKV(key, val) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        sheet.getRange(i + 1, 2).setValue(val);
        return;
      }
    }
    sheet.appendRow([key, val]);
  }

  if (p.shopName !== undefined) setKV('shopName', p.shopName);
  if (p.taxRate  !== undefined) setKV('taxRate',  p.taxRate);
  if (p.currency !== undefined) setKV('currency', p.currency);

  return { ok: true };
}

// ── USER MANAGEMENT ──────────────────────────────────────────────
var USERS_SHEET_NAME = 'Users';

function getUsers() {
  var sheet = ss().getSheetByName(USERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; })
    .map(function(r) { return { username: String(r[0]).trim(), role: String(r[2] || 'user').trim() }; });
}

function verifyLogin(data) {
  var uname = String(data.username || '').trim().toLowerCase();
  var pass  = String(data.password || '').trim();
  if (!uname || !pass) return { ok: false, verified: true };
  var sheet = ss().getSheetByName(USERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return (uname === 'admin' && pass === 'admin2025')
      ? { ok: true, verified: true, role: 'admin', username: 'admin' }
      : { ok: false, verified: true };
  }
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === uname &&
        String(rows[i][1] || '').trim() === pass) {
      return { ok: true, verified: true, role: String(rows[i][2] || 'user').trim(), username: String(rows[i][0]).trim() };
    }
  }
  return { ok: false, verified: true };
}

function addUserGAS(data) {
  var sheet = ss().getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss().insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(['Username', 'Password', 'Role']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.appendRow(['admin', 'admin2025', 'admin']);
  }
  var uname = String(data.username || '').trim().toLowerCase();
  var pass  = String(data.password || '').trim();
  var role  = String(data.role || 'user').trim();
  if (!uname || !pass) return { ok: false, error: 'Missing fields' };
  if (sheet.getLastRow() >= 2) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim().toLowerCase() === uname)
        return { ok: false, error: 'Username already exists' };
    }
  }
  sheet.appendRow([uname, pass, role]);
  return { ok: true };
}

function deleteUserGAS(data) {
  var sheet = ss().getSheetByName(USERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { ok: false, error: 'User not found' };
  var uname = String(data.username || '').trim().toLowerCase();
  var rows  = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === uname) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'User not found' };
}
