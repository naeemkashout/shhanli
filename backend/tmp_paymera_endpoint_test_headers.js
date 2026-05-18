const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const body = {
  lang: 'en',
  terminal_id: '14740242',
  amount: 50000,
  callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
  trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
  notes: 'Wallet deposit test',
  payment_type: 'mobile',
};
const data = Object.keys(body)
  .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`)
  .join('&');
const options = {
  hostname: 'fmp-t.paymera.cc',
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
