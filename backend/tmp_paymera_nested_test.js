const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const body = 'data[lang]=en&data[terminal_id]=14740242&data[amount]=50000&data[callback_url]=http://localhost:5003/api/wallet/paymera/callback&data[trigger_url]=http://localhost:5003/api/wallet/paymera/callback&data[currency]=USD';
const options = {
  hostname: 'egate-t.paymera.cc',
  port: 443,
  path: '/api/create-payment',
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/x-www-form-urlencoded',
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
