const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const tests = [
  {
    description: 'JSON payload',
    contentType: 'application/json',
    body: {
      lang: 'en',
      terminal_id: '14740242',
      amount: 50000,
      callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
      trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      payment_type: 'mobile',
    },
  },
  {
    description: 'Form payload',
    contentType: 'application/x-www-form-urlencoded',
    body: {
      lang: 'en',
      terminal_id: '14740242',
      amount: 50000,
      callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
      trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      payment_type: 'mobile',
    },
  },
];

const post = ({ contentType, body }) =>
  new Promise((resolve, reject) => {
    const data =
      contentType === 'application/json'
        ? JSON.stringify(body)
        : Object.entries(body)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

    const options = {
      hostname: 'fmp-t.paymera.cc',
      port: 443,
      path: '/api/create-payment',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

(async () => {
  for (const test of tests) {
    try {
      const result = await post(test);
      console.log('---', test.description, '---');
      console.log('status:', result.status);
      console.log('location:', result.headers.location);
      console.log('headers:', result.headers);
      console.log('body:', result.body);
    } catch (err) {
      console.error('ERROR', test.description, err);
    }
  }
})();
