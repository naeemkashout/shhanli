const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');

const hosts = ['egate-t.paymera.cc', 'fmp-t.paymera.cc'];
const tests = [
  {
    name: 'json-camel',
    contentType: 'application/json',
    body: {
      lang: 'en',
      terminalId: '14740242',
      amount: 50000,
      callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
      triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      paymentType: 'mobile',
    },
    format: 'json',
  },
  {
    name: 'json-snake',
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
    format: 'json',
  },
  {
    name: 'form-camel',
    contentType: 'application/x-www-form-urlencoded',
    body: {
      lang: 'en',
      terminalId: '14740242',
      amount: 50000,
      callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
      triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
      paymentType: 'mobile',
    },
    format: 'form',
  },
  {
    name: 'form-snake',
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
    format: 'form',
  },
  {
    name: 'json-camel-no-paymentType',
    contentType: 'application/json',
    body: {
      lang: 'en',
      terminalId: '14740242',
      amount: 50000,
      callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
      triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
    },
    format: 'json',
  },
  {
    name: 'form-camel-no-paymentType',
    contentType: 'application/x-www-form-urlencoded',
    body: {
      lang: 'en',
      terminalId: '14740242',
      amount: 50000,
      callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
      triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
      notes: 'Wallet deposit test',
    },
    format: 'form',
  },
];

const encodeForm = (body) =>
  Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

const post = ({ host, contentType, body }) =>
  new Promise((resolve, reject) => {
    const data = contentType === 'application/json' ? JSON.stringify(body) : encodeForm(body);
    const options = {
      hostname: host,
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
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        resolve({
          host,
          status: res.statusCode,
          headers: res.headers,
          body: responseBody,
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });

(async () => {
  for (const host of hosts) {
    for (const test of tests) {
      try {
        const result = await post({ host, contentType: test.contentType, body: test.body });
        console.log('===', host, test.name, '===');
        console.log('status:', result.status);
        console.log('headers:', result.headers);
        console.log('body:', result.body);
      } catch (error) {
        console.log('===', host, test.name, 'ERROR ===');
        console.log(error.message);
      }
    }
  }
})();
