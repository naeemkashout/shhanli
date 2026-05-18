const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const paths = ['/api/create-payment', '/create-payment', '/api/v1/create-payment', '/api/v2/create-payment', '/api/payment/create', '/api/payment', '/payment', '/api/v1/payment', '/api/v2/payment'];
const body = 'lang=en&terminal_id=14740242&amount=50000&callback_url=http://localhost:5003/api/wallet/paymera/callback&trigger_url=http://localhost:5003/api/wallet/paymera/callback&currency=USD';
const optionsBase = {
  hostname: 'egate-t.paymera.cc',
  port: 443,
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};
(async () => {
  for (const path of paths) {
    const options = { ...optionsBase, path };
    const res = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log('PATH', path, res.status, JSON.stringify(res.body).slice(0, 200));
  }
})();
