const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const host = 'egate-t.paymera.cc';
const path = '/api/create-payment';
const callbackKeys = ['callback_url','callbackURL','callbackUrl','return_url','returnURL','returnUrl','success_url','successURL','successUrl','redirect_url','redirectURL','redirectUrl'];
const triggerKeys = ['trigger_url','triggerURL','triggerUrl','return_url','returnURL','returnUrl','success_url','successURL','successUrl','redirect_url','redirectURL','redirectUrl'];
const terminalKeys = ['terminal_id','terminalId','terminal'];
const langKeys = ['lang','language'];
const paymentTypes = [null,'epayment','mobile'];
const extraFields = [
  null,
  { customer_email: 'test@example.com' },
  { customer_name: 'Test User' },
  { customer_phone: '0123456789' },
  { customer_email: 'test@example.com', customer_name: 'Test User', customer_phone: '0123456789' },
];

const encodeForm = (body) =>
  Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

const post = (body) =>
  new Promise((resolve, reject) => {
    const data = encodeForm(body);
    const options = {
      hostname: host,
      port: 443,
      path,
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

(async () => {
  for (const callbackKey of callbackKeys) {
    for (const triggerKey of triggerKeys) {
      for (const termKey of terminalKeys) {
        for (const langKey of langKeys) {
          for (const paymentType of paymentTypes) {
            for (const extra of extraFields) {
              const body = {
                [langKey]: 'en',
                [termKey]: '14740242',
                amount: '50000',
                [callbackKey]: 'https://example.com/api/wallet/paymera/callback',
                [triggerKey]: 'https://example.com/api/wallet/paymera/callback',
                currency: 'USD',
                notes: 'Wallet deposit test',
              };
              if (paymentType) body.payment_type = paymentType;
              if (extra) Object.assign(body, extra);
              const result = await post(body);
              const summary = { callbackKey, triggerKey, termKey, langKey, paymentType, extra };
              if (!result.body.includes('ErrorCode')) {
                console.log('SUCCESS', summary, result.status, result.body);
                return;
              }
              process.stdout.write('.');
            }
          }
        }
      }
    }
  }
  console.log('\nNO SUCCESS');
})();
