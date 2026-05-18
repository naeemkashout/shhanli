const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const body = JSON.stringify({
  lang: 'en',
  terminalId: '14740242',
  amount: 50000,
  callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
  triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
  notes: 'Wallet deposit test',
  paymentType: 'mobile',
});
const options = {
  hostname: 'egate-t.paymera.cc',
  port: 443,
  path: '/api/create-payment',
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('BODY', data);
  });
});
req.on('error', (err) => {
  console.error('ERROR', err);
});
req.write(body);
req.end();
