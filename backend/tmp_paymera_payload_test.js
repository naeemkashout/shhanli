const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const currencies = ['USD', 'SYP'];
const paymentTypes = [null, 'mobile', 'epayment'];
const paymentTypeKeys = [null, 'paymentType', 'payment_type'];
const terminalKeys = ['terminal_id', 'terminalId'];
const callbackKeys = ['callback_url', 'callbackURL'];
const triggerKeys = ['trigger_url', 'triggerURL'];
const langKeys = ['lang', 'language'];
const extraKeys = [
  {},
  { currency: 'USD' },
  { currency: 'SYP' },
  { notes: 'Wallet deposit test' },
  { payment_type: 'mobile' },
  { payment_type: 'epayment' },
  { paymentType: 'mobile' },
  { paymentType: 'epayment' },
];
const encodeForm = (body) =>
  Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
const post = ({ body, format }) =>
  new Promise((resolve, reject) => {
    const data = format === 'json' ? JSON.stringify(body) : encodeForm(body);
    const options = {
      hostname: 'egate-t.paymera.cc',
      port: 443,
      path: '/api/create-payment',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': format === 'json' ? 'application/json' : 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: responseBody }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
(async () => {
  for (const format of ['form', 'json']) {
    for (const termKey of terminalKeys) {
      for (const cbKey of callbackKeys) {
        for (const trKey of triggerKeys) {
          for (const langKey of langKeys) {
            for (const currency of currencies) {
              for (const paymentType of paymentTypes) {
                for (const paymentTypeKey of paymentTypeKeys) {
                  const body = {
                    [langKey]: 'en',
                    [termKey]: '14740242',
                    amount: 50000,
                    [cbKey]: 'http://localhost:5003/api/wallet/paymera/callback',
                    [trKey]: 'http://localhost:5003/api/wallet/paymera/callback',
                    currency,
                    notes: 'Wallet deposit test',
                  };
                  if (paymentType && paymentTypeKey) {
                    body[paymentTypeKey] = paymentType;
                  }
                  const result = await post({ body, format });
                  if (!result.body.includes('ErrorCode')) {
                    console.log('SUCCESS', { format, langKey, termKey, cbKey, trKey, currency, paymentType, paymentTypeKey });
                    console.log(result.status, result.body);
                    return;
                  }
                  console.log('FAIL', { format, langKey, termKey, cbKey, trKey, currency, paymentType, paymentTypeKey }, result.status, result.body.replace(/\n/g, ' '));
                }
              }
            }
          }
        }
      }
    }
  }
})();
