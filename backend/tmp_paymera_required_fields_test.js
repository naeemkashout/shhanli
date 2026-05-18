const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const host = 'egate-t.paymera.cc';
const path = '/api/create-payment';
const dataVariants = [];

const baseBody = {
  lang: 'en',
  terminal_id: '14740242',
  amount: 50000,
  currency: 'USD',
  callback_url: 'https://example.com/api/wallet/paymera/callback',
  trigger_url: 'https://example.com/api/wallet/paymera/callback',
  notes: 'Wallet deposit test',
};

const extraFields = [
  {},
  { payment_type: 'epayment' },
  { payment_type: 'mobile' },
  { paymentType: 'epayment' },
  { paymentType: 'mobile' },
  { customer_email: 'test@example.com' },
  { customer_name: 'Test User' },
  { customer_phone: '0123456789' },
  { customer_email: 'test@example.com', customer_name: 'Test User', customer_phone: '0123456789' },
  { email: 'test@example.com', name: 'Test User', phone: '0123456789' },
  { customer_email: 'test@example.com', customer_name: 'Test User', customer_phone: '0123456789', payment_type: 'epayment' },
  { customer_email: 'test@example.com', customer_name: 'Test User', customer_phone: '0123456789', payment_type: 'mobile' },
  { currency: 'USD', notes: 'Wallet deposit test', payment_type: 'epayment' },
];

const fieldVariants = [
  { callback_url: 'callback_url', trigger_url: 'trigger_url', lang: 'lang' },
  { callback_url: 'callbackURL', trigger_url: 'triggerURL', lang: 'lang' },
  { callback_url: 'callback_url', trigger_url: 'trigger_url', lang: 'language' },
  { callback_url: 'callbackURL', trigger_url: 'triggerURL', lang: 'language' },
];

for (const fieldVariant of fieldVariants) {
  for (const extra of extraFields) {
    const body = {
      [fieldVariant.lang]: 'en',
      terminal_id: '14740242',
      amount: 50000,
      [fieldVariant.callback_url]: 'https://example.com/api/wallet/paymera/callback',
      [fieldVariant.trigger_url]: 'https://example.com/api/wallet/paymera/callback',
      currency: 'USD',
      notes: 'Wallet deposit test',
      ...extra,
    };
    dataVariants.push(body);
  }
}

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
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

(async () => {
  for (const [index, body] of dataVariants.entries()) {
    const result = await post(body);
    const status = result.status;
    const resp = result.body.replace(/\n/g, ' ');
    if (status !== 200 || resp.includes('ErrorCode')) {
      console.log('FAIL', index, JSON.stringify(body), status, resp);
    } else {
      console.log('SUCCESS', index, JSON.stringify(body), status, resp);
      return;
    }
  }
  console.log('DONE');
})();
