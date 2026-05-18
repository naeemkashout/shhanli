const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const body = {
  lang: 'en',
  terminalId: '14740242',
  amount: 100,
  callbackURL: 'http://localhost:5003/api/wallet/paymera/callback',
  triggerURL: 'http://localhost:5003/api/wallet/paymera/callback',
  notes: 'Quick integration test',
  paymentType: 'mobile'
};
const data = JSON.stringify(body);
const options = {
  hostname: 'fmp-t.paymera.cc',
  port: 443,
  path: '/api/create-payment',
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('BODY', body);
  });
});
req.on('error', console.error);
req.write(data);
req.end();
