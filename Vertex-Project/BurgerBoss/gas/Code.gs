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
    headers.forEach(function(h, i) {
      var val = row[i];
      // Serialize Date objects in Manila timezone to avoid UTC offset shifting the date
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'Asia/Manila', "yyyy-MM-dd'T'HH:mm:ss'+08:00'");
      }
      obj[h] = val;
    });
    return obj;
  });
}

// Find a column index by trying multiple possible header names
function findCol(headers) {
  var names = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < names.length; i++) {
    var idx = headers.indexOf(names[i]);
    if (idx >= 0) return idx;
  }
  return -1;
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
      case 'get_users':       return okJson(getUsers());
      case 'get_shift_logs':  return okJson(getShiftLogs());
      case 'stock_log':       return okJson(getStockLog());
      case 'ping':            return okJson({ ok: true, time: nowPH(), today: todayISO() });
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
      case 'log_shift':       return okJson(logShift(payload));
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

  var menuCol    = findCol(recHeaders, 'Menu Item Name', 'Item', 'name', 'Name');
  var ingCol     = findCol(recHeaders, 'Ingredient', 'ingredient');
  var qtyUsedCol = findCol(recHeaders, 'Qty Used', 'qtyUsed', 'qty_used');
  var itemCol    = findCol(invHeaders,  'Item Name', 'Item', 'name', 'Name');
  var stockCol   = findCol(invHeaders,  'Available Qty', 'Stock (Base Unit)', 'Stock', 'stock', 'Qty');
  var updatedCol = findCol(invHeaders,  'Last Restocked', 'Last Updated', 'lastUpdated', 'Updated');

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
  var itemCol    = findCol(invHeaders, 'Item Name', 'Item', 'name', 'Name');
  var stockCol   = findCol(invHeaders, 'Available Qty', 'Stock (Base Unit)', 'Stock', 'stock', 'Qty');
  var updatedCol = findCol(invHeaders, 'Last Restocked', 'Last Updated', 'lastUpdated', 'Updated');

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

// ── Stock Adjustment (single or batch) ───────────────────────────
function adjustStock(p) {
  var invSheet = ss().getSheetByName('Inventory');
  if (!invSheet) return { ok: false, error: 'No Inventory sheet' };

  var data    = invSheet.getDataRange().getValues();
  if (data.length < 2) return { ok: false, error: 'Inventory sheet has no data rows' };

  var headers    = data[0].map(function(h) { return String(h).trim(); });
  var itemCol    = findCol(headers, 'Item Name', 'Item', 'name', 'Name');
  var stockCol   = findCol(headers, 'Available Qty', 'Stock (Base Unit)', 'Stock', 'stock', 'Qty');
  var updatedCol = findCol(headers, 'Last Restocked', 'Last Updated', 'lastUpdated', 'Updated');

  if (itemCol  < 0) return { ok: false, error: 'No name column. Found: ' + headers.join(', ') };
  if (stockCol < 0) return { ok: false, error: 'No stock column. Found: ' + headers.join(', ') };

  // Build name → sheet-row (1-based) map for fast lookup
  var nameMap = {};
  for (var r = 1; r < data.length; r++) {
    var n = String(data[r][itemCol]).trim();
    if (n) nameMap[n.toLowerCase()] = r + 1; // +1 because sheet rows are 1-based
  }

  var now    = nowPH();
  var today  = todayISO();
  var reason = p.reason || '';
  var doneBy = p.doneBy || 'POS';
  var mode   = p.mode   || 'add';

  // Normalise to array — handles both batch { items:[...] } and single { name, qty }
  var items = Array.isArray(p.items) && p.items.length
    ? p.items
    : [{ name: p.itemName || p.name || '', delta: parseFloat(p.qty) || 0 }];

  var logRows = [];
  var updated = 0;

  items.forEach(function(item) {
    var name  = String(item.name || item.itemName || '').trim();
    var delta = parseFloat(item.delta !== undefined ? item.delta : item.qty) || 0;
    if (!name || delta === 0) return;

    var sheetRow = nameMap[name.toLowerCase()];
    if (!sheetRow) return; // item not found in sheet

    var current  = parseFloat(data[sheetRow - 1][stockCol]) || 0;
    var newStock = mode === 'set' ? delta : Math.max(0, current + delta);

    invSheet.getRange(sheetRow, stockCol + 1).setValue(newStock);
    if (updatedCol >= 0) invSheet.getRange(sheetRow, updatedCol + 1).setValue(now);

    logRows.push([today, now, name, delta > 0 ? 'Stock In' : 'Adjustment', delta, current, newStock, doneBy, reason]);
    updated++;
  });

  if (updated > 0) {
    SpreadsheetApp.flush(); // force-commit all setValue calls before returning
    appendStockLog(logRows);
  }

  return { ok: true, updated: updated };
}

function appendStockLog(rows) {
  var sheet = getSheet('Stock Log');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date','Time','Item','Adjustment Type','Qty Changed','Old Stock','New Stock','Done By','Reason']);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }
  rows.forEach(function(r) { sheet.appendRow(r); });
}

function getStockLog() {
  return sheetToObjects(getSheet('Stock Log'));
}

// ── Log Purchase ──────────────────────────────────────────────────
function logPurchase(p) {
  var sheet = getSheet('Purchases');
  var lr    = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Date','Supplier','Receipt No','Item Name','Quantity','Unit','Unit Cost','Line Total','Grand Total','Timestamp'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var now  = new Date();
  var rows = Array.isArray(p.items) ? p.items : [p];
  rows.forEach(function(item) {
    var lineTotal = parseFloat(item.lineTotal) || (parseFloat(item.qty || 0) * parseFloat(item.unitCost || 0));
    var row = headers.map(function(h) {
      switch (String(h).trim()) {
        // Standard columns
        case 'Date':         return p.date        || todayISO();
        case 'Supplier':     return p.supplier    || item.supplier || '';
        case 'Receipt No':   return p.receiptNo   || p.receipt_no  || '';
        case 'Item Name':    return item.itemName  || item.name    || '';
        case 'Quantity':     return parseFloat(item.qty)       || 0;
        case 'Unit':         return item.unit     || '';
        case 'Unit Cost':    return parseFloat(item.unitCost)  || 0;
        case 'Line Total':   return lineTotal;
        case 'Grand Total':  return parseFloat(p.grandTotal)   || 0;
        case 'Timestamp':    return now;
        // Alternative column names used in some sheets
        case 'Record ID':    return p.receiptNo   || Utilities.formatDate(now, 'Asia/Manila', 'yyyyMMdd-HHmmss');
        case 'Category':     return p.category    || 'Purchases';
        case 'Item':
        case 'Description':  return item.itemName  || item.name    || '';
        case 'Qty':          return parseFloat(item.qty)       || 0;
        case 'Subtotal':
        case 'Sub Total':    return lineTotal;
        case 'Total Amount':
        case 'Total':        return parseFloat(p.grandTotal)   || 0;
        case 'Notes':        return p.receiptNo   || p.notes || item.notes || '';
        default:             return '';
      }
    });
    sheet.appendRow(row);
  });
  return { ok: true };
}

// ── Log Expense ───────────────────────────────────────────────────
function logExpense(p) {
  if (!p) return { ok: false, error: 'No payload' };
  var sheet = getSheet('Expenses');
  var lr    = sheet.getLastRow();
  var headers;
  if (lr === 0) {
    headers = ['Record ID','Date','Category','Description','Ref No','Amount','Logged By','Timestamp'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var now = new Date();
  var row = headers.map(function(h) {
    switch (String(h).trim()) {
      case 'Record ID':   return Utilities.formatDate(now, 'Asia/Manila', 'yyyyMMdd-HHmmss');
      case 'Date':        return p.date        || todayISO();
      case 'Category':    return p.category    || 'Miscellaneous';
      case 'Description': return p.description || p.desc || '';
      case 'Ref No':      return p.refNo       || p.ref_no  || '';
      case 'Vendor':      return p.refNo       || p.vendor  || '';
      case 'Amount':      return parseFloat(p.amount) || 0;
      case 'Logged By':   return p.doneBy      || p.loggedBy || 'POS';
      case 'Paid By':     return p.doneBy      || p.paidBy   || '';
      case 'Notes':       return p.notes       || '';
      case 'Timestamp':   return now;
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

// ── Shift Logs ───────────────────────────────────────────────────
var SHIFT_LOG_SHEET = 'Shift Logs';

function getShiftLogs() {
  var sheet = ss().getSheetByName(SHIFT_LOG_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data    = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) {
      var val = row[i];
      if (val instanceof Date) {
        if (h === 'Date') {
          val = Utilities.formatDate(val, 'Asia/Manila', 'yyyy-MM-dd');
        } else if (h === 'Time') {
          val = Utilities.formatDate(val, 'Asia/Manila', 'hh:mm a');
        } else {
          val = String(val);
        }
      }
      obj[h] = val;
    });
    return obj;
  }).reverse();
}

function logShift(p) {
  var spreadsheet = ss();
  var sheet = spreadsheet.getSheetByName(SHIFT_LOG_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHIFT_LOG_SHEET);
    sheet.appendRow(['Date', 'Time', 'Action', 'Username', 'Amount']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setColumnWidth(1, 110);
    sheet.setColumnWidth(2, 90);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 120);
    sheet.setColumnWidth(5, 100);
  }
  var date   = p.date   || Utilities.formatDate(new Date(), 'Asia/Manila', 'yyyy-MM-dd');
  var time   = p.time   || Utilities.formatDate(new Date(), 'Asia/Manila', 'hh:mm a');
  var action = p.action_type || '';   // 'Start' or 'End'
  var uname  = p.username || '';
  var amount = parseFloat(p.amount) || 0;
  sheet.appendRow([date, time, action, uname, amount]);
  return { ok: true };
}
