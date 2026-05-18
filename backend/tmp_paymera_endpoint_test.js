const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const variants = [
  {
    base: 'egate-t.paymera.cc',
    body: {
      lang: 'en',
      terminal_id: '14740242',
      amount: 50000,
      callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
      trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      payment_type: 'epayment',
    },
  },
  {
    base: 'fmp-t.paymera.cc',
    body: {
      lang: 'en',
      terminal_id: '14740242',
      amount: 50000,
      callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
      trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      payment_type: 'epayment',
    },
  },
];

const post = (base, body) =>
  new Promise((resolve, reject) => {
    const data = Object.keys(body)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`)
      .join('&');

    const options = {
      hostname: base,
      port: 443,
      path: '/api/create-payment',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ base, status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

(async () => {
  for (const v of variants) {
    try {
      const r = await post(v.base, v.body);
      console.log('BASE', v.base, 'STAT', r.status, 'BODY', r.body);
    } catch (e) {
      console.error('ERROR', v.base, e.message);
    }
  }
})();
