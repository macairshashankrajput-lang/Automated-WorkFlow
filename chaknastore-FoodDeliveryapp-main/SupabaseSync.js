function syncAllSupabaseTables() {
  const SUPABASE_URL = 'https://narzeblpnlmnvpbfoufv.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcnplYmxwbmxtbnZwYmZvdWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE1OTksImV4cCI6MjA5MTM4NzU5OX0.SNfRd7JNnVP_WdwPvJ4y_CNYPO3-8WhrmxukdjMM5H8';
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Raw table dumps
  ['users','orders','payments','bills','order_items'].forEach(t =>
    syncRawTable(t, SUPABASE_URL, SUPABASE_KEY, ss)
  );

  // 2. Organized views
  sheetCustomerData(SUPABASE_URL, SUPABASE_KEY, ss);
  sheetOrderData(SUPABASE_URL, SUPABASE_KEY, ss);
  sheetPaymentData(SUPABASE_URL, SUPABASE_KEY, ss);
  sheetRevenueData(SUPABASE_URL, SUPABASE_KEY, ss);
}

/* ─── Generic raw table sync ─────────────────────────────────────── */
function syncRawTable(tableName, baseUrl, key, ss) {
  const opts = { method:'get', headers:{ apikey:key, Authorization:'Bearer '+key } };
  try {
    const rows = JSON.parse(UrlFetchApp.fetch(`${baseUrl}/rest/v1/${tableName}?select=*`, opts).getContentText());
    let sh = ss.getSheetByName(tableName) || ss.insertSheet(tableName);
    sh.clear();
    if (!rows.length) { sh.appendRow(['No data yet']); return; }
    const heads = Object.keys(rows[0]);
    sh.appendRow(heads);
    sh.getRange(2,1,rows.length,heads.length).setValues(
      rows.map(r => heads.map(h => { const v=r[h]; return (v!==null&&typeof v==='object')?JSON.stringify(v):(v??''); }))
    );
    sh.getRange(1,1,1,heads.length).setFontWeight('bold').setBackground('#f3f3f3');
    sh.setFrozenRows(1);
  } catch(e) { Logger.log('syncRawTable '+tableName+': '+e.message); }
}

/* ─── CUSTOMER DATA sheet ────────────────────────────────────────── */
function sheetCustomerData(url, key, ss) {
  const opts = { method:'get', headers:{ apikey:key, Authorization:'Bearer '+key } };
  try {
    const data = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/users?role=eq.customer&select=id,username,name,email,phone,points_balance,created_at&order=created_at.desc`, opts
    ).getContentText());

    let sh = ss.getSheetByName('Customer Data') || ss.insertSheet('Customer Data');
    sh.clear();
    const heads = ['Customer ID','Username','Full Name','Email','Phone','Points Balance','Joined Date'];
    sh.appendRow(heads);
    sh.getRange(1,1,1,heads.length).setFontWeight('bold').setBackground('#d9ead3');
    sh.setFrozenRows(1);

    if (data.length) {
      sh.getRange(2,1,data.length,heads.length).setValues(
        data.map(c => [c.id, c.username, c.name||'', c.email, c.phone||'', c.points_balance||0,
          c.created_at ? new Date(c.created_at).toLocaleString() : ''])
      );
    }
    Logger.log('Customer Data: '+data.length+' rows');
  } catch(e) { Logger.log('sheetCustomerData: '+e.message); }
}

/* ─── ORDER DATA sheet ───────────────────────────────────────────── */
function sheetOrderData(url, key, ss) {
  const opts = { method:'get', headers:{ apikey:key, Authorization:'Bearer '+key } };
  try {
    const orders = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/orders?select=id,user_id,vendor_id,type,subtotal,tax,delivery_fee,total_price,status,payment_status,payment_method,created_at&order=created_at.desc`, opts
    ).getContentText());

    // Fetch customer names
    const users = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/users?select=id,name,email,phone`, opts
    ).getContentText());
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    let sh = ss.getSheetByName('Order Data') || ss.insertSheet('Order Data');
    sh.clear();
    const heads = ['Order ID','Customer Name','Email','Phone','Type','Subtotal (₹)','Tax (₹)','Delivery Fee (₹)','Total (₹)','Status','Payment Status','Payment Method','Date'];
    sh.appendRow(heads);
    sh.getRange(1,1,1,heads.length).setFontWeight('bold').setBackground('#fff2cc');
    sh.setFrozenRows(1);

    if (orders.length) {
      sh.getRange(2,1,orders.length,heads.length).setValues(
        orders.map(o => {
          const u = userMap[o.user_id] || {};
          return [
            o.id, u.name||o.user_id, u.email||'', u.phone||'',
            o.type, o.subtotal||0, o.tax||0, o.delivery_fee||0, o.total_price||0,
            o.status, o.payment_status, o.payment_method||'',
            o.created_at ? new Date(o.created_at).toLocaleString() : ''
          ];
        })
      );
    }
    Logger.log('Order Data: '+orders.length+' rows');
  } catch(e) { Logger.log('sheetOrderData: '+e.message); }
}

/* ─── PAYMENT DATA sheet ─────────────────────────────────────────── */
function sheetPaymentData(url, key, ss) {
  const opts = { method:'get', headers:{ apikey:key, Authorization:'Bearer '+key } };
  try {
    const payments = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/payments?select=id,order_id,user_id,amount,method,status,transaction_id,created_at&order=created_at.desc`, opts
    ).getContentText());

    const users = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/users?select=id,name,email`, opts
    ).getContentText());
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    let sh = ss.getSheetByName('Payment Data') || ss.insertSheet('Payment Data');
    sh.clear();
    const heads = ['Payment ID','Order ID','Customer Name','Email','Amount (₹)','Method','Status','Transaction ID','Date'];
    sh.appendRow(heads);
    sh.getRange(1,1,1,heads.length).setFontWeight('bold').setBackground('#cfe2f3');
    sh.setFrozenRows(1);

    if (payments.length) {
      sh.getRange(2,1,payments.length,heads.length).setValues(
        payments.map(p => {
          const u = userMap[p.user_id] || {};
          return [
            p.id, p.order_id, u.name||p.user_id, u.email||'',
            p.amount||0, p.method, p.status, p.transaction_id||'',
            p.created_at ? new Date(p.created_at).toLocaleString() : ''
          ];
        })
      );
    }
    Logger.log('Payment Data: '+payments.length+' rows');
  } catch(e) { Logger.log('sheetPaymentData: '+e.message); }
}

/* ─── REVENUE DATA sheet ─────────────────────────────────────────── */
function sheetRevenueData(url, key, ss) {
  const opts = { method:'get', headers:{ apikey:key, Authorization:'Bearer '+key } };
  try {
    const orders = JSON.parse(UrlFetchApp.fetch(
      `${url}/rest/v1/orders?select=total_price,subtotal,tax,delivery_fee,status,type,created_at`, opts
    ).getContentText());

    let sh = ss.getSheetByName('Revenue Data') || ss.insertSheet('Revenue Data');
    sh.clear();

    const totalRev   = orders.reduce((s,o)=>s+(o.total_price||0),0);
    const totalTax   = orders.reduce((s,o)=>s+(o.tax||0),0);
    const totalDel   = orders.reduce((s,o)=>s+(o.delivery_fee||0),0);
    const completed  = orders.filter(o=>o.status==='delivered').length;
    const pending    = orders.filter(o=>o.status==='pending').length;
    const cancelled  = orders.filter(o=>o.status==='cancelled').length;
    const avgVal     = orders.length ? (totalRev/orders.length).toFixed(2) : 0;

    // Summary block
    const summary = [
      ['Metric','Value'],
      ['Total Revenue (Gross)', totalRev],
      ['Total Tax Collected', totalTax],
      ['Total Delivery Fees', totalDel],
      ['Net Revenue (excl. tax & delivery)', totalRev - totalTax - totalDel],
      ['Total Orders', orders.length],
      ['Completed Orders', completed],
      ['Pending Orders', pending],
      ['Cancelled Orders', cancelled],
      ['Average Order Value (₹)', avgVal],
    ];
    sh.getRange(1,1,summary.length,2).setValues(summary);
    sh.getRange(1,1,1,2).setFontWeight('bold').setBackground('#cfe2f3');
    sh.getRange(2,1,summary.length-1,2).setBackground('#f8f9fa');
    sh.setFrozenRows(1);

    // Orders by type
    const byType = {};
    orders.forEach(o=>{ byType[o.type]=(byType[o.type]||0)+(o.total_price||0); });
    let row = summary.length + 2;
    sh.getRange(row,1,1,2).setValues([['Order Type Breakdown','']]).setFontWeight('bold');
    row++;
    sh.getRange(row,1,1,2).setValues([['Type','Revenue (₹)']]).setFontWeight('bold').setBackground('#f3f3f3');
    row++;
    Object.entries(byType).forEach(([type,rev])=>{
      sh.getRange(row,1,1,2).setValues([[type, rev]]);
      row++;
    });

    // Daily revenue breakdown (most recent first)
    const daily = {};
    orders.forEach(o=>{
      if(!o.created_at) return;
      const d = o.created_at.split('T')[0];
      if(!daily[d]) daily[d]={rev:0,count:0};
      daily[d].rev += (o.total_price||0);
      daily[d].count++;
    });
    row++;
    sh.getRange(row,1,1,3).setValues([['Daily Revenue Breakdown','','']]).setFontWeight('bold');
    row++;
    sh.getRange(row,1,1,3).setValues([['Date','Revenue (₹)','Order Count']]).setFontWeight('bold').setBackground('#f3f3f3');
    row++;
    const dailyRows = Object.keys(daily).sort().reverse().map(d=>[d, daily[d].rev, daily[d].count]);
    if(dailyRows.length) sh.getRange(row,1,dailyRows.length,3).setValues(dailyRows);

    Logger.log('Revenue Data synced. Total: ₹'+totalRev);
  } catch(e) { Logger.log('sheetRevenueData: '+e.message); }
}