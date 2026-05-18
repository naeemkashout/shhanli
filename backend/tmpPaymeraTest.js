const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const variants = [
  { lang:'en', terminalId:'14740242', amount:50000, callbackURL:'http://localhost:5003/api/wallet/paymera/callback', triggerURL:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test' },
  { lang:'en', terminal_id:'14740242', amount:50000, callback_url:'http://localhost:5003/api/wallet/paymera/callback', trigger_url:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test' },
  { language:'en', terminalId:'14740242', amount:50000, callbackURL:'http://localhost:5003/api/wallet/paymera/callback', triggerURL:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test' },
  { language:'en', terminal_id:'14740242', amount:'50000', callback_url:'http://localhost:5003/api/wallet/paymera/callback', trigger_url:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test' },
  { lang:'en', terminalId:'14740242', amount:'50000', callbackURL:'http://localhost:5003/api/wallet/paymera/callback', triggerURL:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test' },
  { lang:'en', terminalId:'14740242', amount:50000, callbackURL:'http://localhost:5003/api/wallet/paymera/callback', triggerURL:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test', payment_type:'epayment' },
  { lang:'en', terminalId:'14740242', amount:50000, callbackURL:'http://localhost:5003/api/wallet/paymera/callback', triggerURL:'http://localhost:5003/api/wallet/paymera/callback', notes:'Wallet deposit test', paymentType:'mobile' },
];
const post = (body, isJson) => new Promise((resolve, reject) => {
  const data = isJson ? JSON.stringify(body) : Object.keys(body).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`).join('&');
  const options = {
    hostname: 'egate-t.paymera.cc',
    port: 443,
    path: '/api/create-payment',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => (body += chunk));
    res.on('end', () => resolve({status: res.statusCode, body, headers: res.headers}));
  });
  req.on('error', reject);
  req.write(data);
  req.end();
});
(async () => {
  for (const [index, variant] of variants.entries()) {
    for (const fmt of ['json', 'form']) {
      const result = await post(variant, fmt === 'json');
      console.log('variant', index, 'fmt', fmt, 'status', result.status, 'body', result.body);
    }
  }
})();
