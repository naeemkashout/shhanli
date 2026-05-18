const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const terminalKeys = ['terminal_id', 'terminalId', 'terminal', 'tid', 'terminalNo'];
const amountKeys = ['amount', 'payment_amount', 'total_amount', 'order_amount', 'price'];
const callbackKeys = ['callback_url', 'callbackURL', 'return_url', 'returnURL', 'success_url', 'successURL', 'redirect_url', 'redirectURL'];
const triggerKeys = ['trigger_url', 'triggerURL', 'return_url', 'returnURL', 'success_url', 'successURL', 'redirect_url', 'redirectURL'];
const langKeys = ['lang', 'language', 'locale'];
const currencyKeys = ['currency', 'cur', 'curr'];
const fixedFields = {
  amount: 50000,
};
const encodeForm = (body) =>
  Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
const post = ({ body }) =>
  new Promise((resolve, reject) => {
    const data = encodeForm(body);
    const options = {
      hostname: 'egate-t.paymera.cc',
      port: 443,
      path: '/api/create-payment',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: responseBody }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
(async () => {
  for (const termKey of terminalKeys) {
    for (const amountKey of amountKeys) {
      for (const cbKey of callbackKeys) {
        for (const trKey of triggerKeys) {
          for (const langKey of langKeys) {
            const body = {
              [termKey]: '14740242',
              [amountKey]: fixedFields.amount,
              [cbKey]: 'http://localhost:5003/api/wallet/paymera/callback',
              [trKey]: 'http://localhost:5003/api/wallet/paymera/callback',
              [langKey]: 'en',
              currency: 'USD',
            };
            const result = await post({ body });
            if (!result.body.includes('ErrorCode')) {
              console.log('SUCCESS', { termKey, amountKey, cbKey, trKey, langKey }, result.status, result.body);
              return;
            }
            if (result.body.includes('Invalid password')) {
              console.log('AUTH FAIL', { termKey, amountKey, cbKey, trKey, langKey }, result.status, result.body);
              return;
            }
            process.stdout.write('.');
          }
        }
      }
    }
  }
  console.log('\nNo success');
})();
