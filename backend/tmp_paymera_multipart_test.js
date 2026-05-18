const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const fields = {
  lang: 'en',
  terminal_id: '14740242',
  amount: '50000',
  callback_url: 'http://localhost:5003/api/wallet/paymera/callback',
  trigger_url: 'http://localhost:5003/api/wallet/paymera/callback',
  currency: 'USD',
};
let body = '';
for (const [key, value] of Object.entries(fields)) {
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
  body += `${value}\r\n`;
}
body += `--${boundary}--\r\n`;
const options = {
  hostname: 'egate-t.paymera.cc',
  port: 443,
  path: '/api/create-payment',
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body),
    Accept: 'application/json',
  },
};
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', console.error);
req.write(body);
req.end();
