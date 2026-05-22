// ─────────────────────────────────────────────────────────────
//  LENDING WEB APP — Google Apps Script Backend v2
//  Paste into script.google.com → Deploy → Web App → Anyone
// ─────────────────────────────────────────────────────────────

const SHEET_ID = '1is0dq5QHrbBCUdkRlHdrlwDT55uTzqDJLlLgcbAwy_s';

function getSpreadsheet() { return SpreadsheetApp.openById(SHEET_ID); }
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  try {
    let action, payload;
    if (e.postData) {
      const body = JSON.parse(e.postData.contents);
      action = body.action; payload = body;
    } else {
      action = e.parameter.action; payload = e.parameter;
    }
    let result;
    switch (action) {
      case 'getDashboard':             result = getDashboard();                    break;
      case 'getBorrowers':             result = getBorrowers();                    break;
      case 'addBorrower':              result = addBorrower(payload);              break;
      case 'updateBorrower':           result = updateBorrower(payload);           break;
      case 'deleteBorrower':           result = deleteBorrower(payload);           break;
      case 'getLoans':                 result = getLoans(payload);                 break;
      case 'addLoan':                  result = addLoan(payload);                  break;
      case 'updateLoan':               result = updateLoan(payload);              break;
      case 'deleteLoan':               result = deleteLoan(payload);              break;
      case 'editLoan':                 result = editLoan(payload);                break;
      case 'getAuditLog':              result = getAuditLog(payload);             break;
      case 'getPayments':              result = getPayments(payload);              break;
      case 'addPayment':               result = addPayment(payload);              break;
      case 'deletePayment':            result = deletePayment(payload);            break;
      case 'getLoanSummaryByBorrower': result = getLoanSummaryByBorrower(payload); break;
      default: result = { error: 'Unknown action: ' + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPERS ─────────────────────────────────────────────

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold').setBackground('#0B1F3A').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, 'Asia/Manila', 'yyyy-MM-dd');
}

// ── BORROWERS ─────────────────────────────────────────────────

const BORROWER_HEADERS = ['ID', 'Name', 'Phone', 'Address', 'Notes', 'CreatedAt'];

function getBorrowers() {
  const sheet = getOrCreateSheet('Borrowers', BORROWER_HEADERS);
  return { data: sheetToObjects(sheet) };
}

function addBorrower(p) {
  const sheet = getOrCreateSheet('Borrowers', BORROWER_HEADERS);
  const id = generateId('BRW');
  sheet.appendRow([id, p.name, p.phone, p.address || '', p.notes || '', new Date().toISOString()]);
  return { success: true, id };
}

function updateBorrower(p) {
  const sheet = getOrCreateSheet('Borrowers', BORROWER_HEADERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[p.name, p.phone, p.address || '', p.notes || '']]);
      return { success: true };
    }
  }
  return { error: 'Borrower not found' };
}

function deleteBorrower(p) {
  const sheet = getOrCreateSheet('Borrowers', BORROWER_HEADERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { error: 'Borrower not found' };
}

// ── LOANS ─────────────────────────────────────────────────────

const LOAN_HEADERS = [
  'ID', 'BorrowerID', 'BorrowerName', 'Principal', 'InterestRate',
  'InterestType', 'TermMonths', 'StartDate', 'DueDate',
  'TotalAmount', 'PaidAmount', 'Balance', 'Status', 'Notes', 'CreatedAt'
];

function getLoans(p) {
  const sheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  let loans = sheetToObjects(sheet);
  if (p && p.borrowerId) loans = loans.filter(l => l.BorrowerID === p.borrowerId);
  if (p && p.status)     loans = loans.filter(l => l.Status === p.status);

  // Compute MonthlyPayment for each loan so frontend doesn't have to
  loans = loans.map(l => ({
    ...l,
    MonthlyPayment: parseFloat(l.TotalAmount) / Math.max(1, parseInt(l.TermMonths))
  }));
  return { data: loans };
}

function addLoan(p) {
  const sheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const id        = generateId('LN');
  const principal = parseFloat(p.principal);
  const rate      = parseFloat(p.interestRate);
  const term      = parseInt(p.termMonths);

  // Flat-rate interest: total_interest = P × r × n
  const totalInterest = principal * (rate / 100) * term;
  const totalAmount   = principal + totalInterest;
  const startDate     = p.startDate || formatDate(new Date());
  const start         = new Date(startDate);
  const dueDate       = new Date(start);
  dueDate.setMonth(dueDate.getMonth() + term);

  sheet.appendRow([
    id, p.borrowerId, p.borrowerName, principal, rate,
    p.interestType || 'flat', term,
    startDate, formatDate(dueDate), totalAmount, 0, totalAmount,
    'Active', p.notes || '', new Date().toISOString()
  ]);
  return { success: true, id, totalAmount, monthlyPayment: totalAmount / term, dueDate: formatDate(dueDate) };
}

function updateLoan(p) {
  const sheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.id) {
      if (p.status !== undefined) sheet.getRange(i + 1, 13).setValue(p.status);
      if (p.notes  !== undefined) sheet.getRange(i + 1, 14).setValue(p.notes);
      return { success: true };
    }
  }
  return { error: 'Loan not found' };
}

function deleteLoan(p) {
  const loanSheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const paySheet  = getOrCreateSheet('Payments', PAYMENT_HEADERS);

  // Delete the loan row
  const loanData = loanSheet.getDataRange().getValues();
  let deleted = false;
  for (let i = 1; i < loanData.length; i++) {
    if (loanData[i][0] === p.id) {
      loanSheet.deleteRow(i + 1);
      deleted = true;
      break;
    }
  }
  if (!deleted) return { error: 'Loan not found' };

  // Also delete all payment records for this loan
  let payData = paySheet.getDataRange().getValues();
  for (let i = payData.length - 1; i >= 1; i--) {
    if (payData[i][1] === p.id) {
      paySheet.deleteRow(i + 1);
    }
  }

  return { success: true };
}

// ── PAYMENTS ──────────────────────────────────────────────────

const PAYMENT_HEADERS = ['ID', 'LoanID', 'BorrowerName', 'Amount', 'Date', 'Notes', 'CreatedAt'];

function getPayments(p) {
  const sheet = getOrCreateSheet('Payments', PAYMENT_HEADERS);
  let payments = sheetToObjects(sheet);
  if (p && p.loanId) payments = payments.filter(pay => pay.LoanID === p.loanId);
  return { data: payments };
}

function addPayment(p) {
  const paySheet  = getOrCreateSheet('Payments', PAYMENT_HEADERS);
  const loanSheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const amount    = parseFloat(p.amount);
  const payId     = generateId('PAY');
  const payDate   = p.date || formatDate(new Date());

  paySheet.appendRow([payId, p.loanId, p.borrowerName, amount, payDate, p.notes || '', new Date().toISOString()]);

  const loanData = loanSheet.getDataRange().getValues();
  for (let i = 1; i < loanData.length; i++) {
    if (loanData[i][0] === p.loanId) {
      const paid    = parseFloat(loanData[i][10]) + amount;
      const balance = Math.max(0, parseFloat(loanData[i][9]) - paid);
      const status  = balance <= 0 ? 'Paid' : 'Active';
      loanSheet.getRange(i + 1, 11).setValue(paid);
      loanSheet.getRange(i + 1, 12).setValue(balance);
      loanSheet.getRange(i + 1, 13).setValue(status);
      return { success: true, id: payId, newBalance: balance, status };
    }
  }
  return { error: 'Loan not found' };
}

function deletePayment(p) {
  const paySheet  = getOrCreateSheet('Payments', PAYMENT_HEADERS);
  const loanSheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const payData   = paySheet.getDataRange().getValues();

  for (let i = 1; i < payData.length; i++) {
    if (payData[i][0] === p.id) {
      const loanId = payData[i][1];
      const amount = parseFloat(payData[i][3]);
      paySheet.deleteRow(i + 1);

      const loanData = loanSheet.getDataRange().getValues();
      for (let j = 1; j < loanData.length; j++) {
        if (loanData[j][0] === loanId) {
          const paid    = Math.max(0, parseFloat(loanData[j][10]) - amount);
          const balance = Math.max(0, parseFloat(loanData[j][9]) - paid);
          const status  = balance <= 0 ? 'Paid' : 'Active';
          loanSheet.getRange(j + 1, 11).setValue(paid);
          loanSheet.getRange(j + 1, 12).setValue(balance);
          loanSheet.getRange(j + 1, 13).setValue(status);
          break;
        }
      }
      return { success: true };
    }
  }
  return { error: 'Payment not found' };
}

// ── DASHBOARD ─────────────────────────────────────────────────

function getDashboard() {
  const loanSheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const paySheet  = getOrCreateSheet('Payments', PAYMENT_HEADERS);
  const loans     = sheetToObjects(loanSheet);
  const payments  = sheetToObjects(paySheet);

  const now   = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  const active  = loans.filter(l => l.Status === 'Active');
  const paid    = loans.filter(l => l.Status === 'Paid');
  const overdue = active.filter(l => l.DueDate && new Date(l.DueDate) < today);

  const totalOutstanding = active.reduce((s, l) => s + parseFloat(l.Balance  || 0), 0);
  const totalLent        = loans.reduce((s, l)  => s + parseFloat(l.Principal || 0), 0);
  const totalCollected   = payments.reduce((s, p) => s + parseFloat(p.Amount || 0), 0);
  const todayStr         = formatDate(today);
  const collectedToday   = payments
    .filter(p => formatDate(new Date(p.Date)) === todayStr)
    .reduce((s, p) => s + parseFloat(p.Amount || 0), 0);
  const collectionRate   = totalLent > 0 ? Math.round((totalCollected / totalLent) * 100) : 0;

  // Monthly collections for last 6 months
  const monthlyCollections = [];
  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key   = Utilities.formatDate(d, 'Asia/Manila', 'yyyy-MM');
    const label = Utilities.formatDate(d, 'Asia/Manila', 'MMM');
    const total = payments
      .filter(p => p.Date && Utilities.formatDate(new Date(p.Date), 'Asia/Manila', 'yyyy-MM') === key)
      .reduce((s, p) => s + parseFloat(p.Amount || 0), 0);
    monthlyCollections.push({ label, total });
  }

  // Top borrowers by outstanding balance
  const borrowerBalances = {};
  active.forEach(l => {
    if (!borrowerBalances[l.BorrowerName]) borrowerBalances[l.BorrowerName] = 0;
    borrowerBalances[l.BorrowerName] += parseFloat(l.Balance || 0);
  });
  const topBorrowers = Object.entries(borrowerBalances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, balance]) => ({ BorrowerName: name, Balance: balance }));

  return {
    totalLoans: loans.length, activeLoans: active.length,
    paidLoans:  paid.length,  overdueLoans: overdue.length,
    totalOutstanding, totalLent, totalCollected, collectedToday,
    collectionRate, monthlyCollections, topBorrowers,
    recentPayments: payments.slice(-5).reverse(),
    overdueList:    overdue.slice(0, 5),
  };
}

// ── BORROWER SUMMARY (new) ────────────────────────────────────

function getLoanSummaryByBorrower(p) {
  const loanSheet = getOrCreateSheet('Loans', LOAN_HEADERS);
  const loans = sheetToObjects(loanSheet).filter(l => l.BorrowerID === p.borrowerId);

  const totalBorrowed  = loans.reduce((s, l) => s + parseFloat(l.Principal  || 0), 0);
  const totalPaid      = loans.reduce((s, l) => s + parseFloat(l.PaidAmount || 0), 0);
  const outstanding    = loans.filter(l => l.Status === 'Active').reduce((s, l) => s + parseFloat(l.Balance || 0), 0);
  const activeCount    = loans.filter(l => l.Status === 'Active').length;

  // Add MonthlyPayment to each loan
  const loansWithPayment = loans.map(l => ({
    ...l, MonthlyPayment: parseFloat(l.TotalAmount) / Math.max(1, parseInt(l.TermMonths))
  }));

  return { totalBorrowed, totalPaid, outstanding, activeCount, loans: loansWithPayment };
}

// ── EDIT LOAN + AUDIT TRAIL ───────────────────────────────────

const AUDIT_HEADERS = ['ID', 'LoanID', 'BorrowerName', 'Field', 'OldValue', 'NewValue', 'Timestamp'];

function editLoan(p) {
  const loanSheet  = getOrCreateSheet('Loans', LOAN_HEADERS);
  const auditSheet = getOrCreateSheet('AuditLog', AUDIT_HEADERS);
  const loanData   = loanSheet.getDataRange().getValues();

  for (let i = 1; i < loanData.length; i++) {
    if (loanData[i][0] !== p.id) continue;

    const borrowerName = loanData[i][2];
    const principal    = parseFloat(p.principal);
    const rate         = parseFloat(p.interestRate);
    const term         = parseInt(p.termMonths);
    const totalInterest = principal * (rate / 100) * term;
    const totalAmount   = principal + totalInterest;
    const start         = new Date(p.startDate);
    const dueDate       = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + term);

    // Recalculate balance: totalAmount - paidAmount
    const paidAmount = parseFloat(loanData[i][10]) || 0;
    const newBalance = Math.max(0, totalAmount - paidAmount);

    // Update loan row
    loanSheet.getRange(i + 1, 4).setValue(principal);
    loanSheet.getRange(i + 1, 5).setValue(rate);
    loanSheet.getRange(i + 1, 6).setValue(p.interestType || 'flat');
    loanSheet.getRange(i + 1, 7).setValue(term);
    loanSheet.getRange(i + 1, 8).setValue(p.startDate);
    loanSheet.getRange(i + 1, 9).setValue(formatDate(dueDate));
    loanSheet.getRange(i + 1, 10).setValue(totalAmount);
    loanSheet.getRange(i + 1, 12).setValue(newBalance);
    loanSheet.getRange(i + 1, 14).setValue(p.notes || '');

    // Write each changed field to audit log
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Manila', 'MMM dd, yyyy hh:mm a');
    const changes = typeof p.changes === 'string' ? JSON.parse(p.changes) : (p.changes || []);
    changes.forEach(c => {
      auditSheet.appendRow([
        generateId('AUD'), p.id, borrowerName,
        c.field, c.old, c.new, timestamp
      ]);
    });

    return { success: true };
  }
  return { error: 'Loan not found' };
}

function getAuditLog(p) {
  const sheet = getOrCreateSheet('AuditLog', AUDIT_HEADERS);
  const all   = sheetToObjects(sheet);
  const data  = all.filter(r => r.LoanID === p.loanId).reverse(); // newest first
  return { data };
}

// ── SETUP ─────────────────────────────────────────────────────

function setupSheets() {
  getOrCreateSheet('Borrowers', BORROWER_HEADERS);
  getOrCreateSheet('Loans', LOAN_HEADERS);
  getOrCreateSheet('Payments', PAYMENT_HEADERS);
  Logger.log('Sheets initialized.');
}
