const https = require('https');
const auth = Buffer.from('shipme:shipme@123').toString('base64');
const hosts = ['egate-t.paymera.cc'];
const payTypes = [null, { paymentType: 'mobile' }, { paymentType: 'epayment' }, { payment_type: 'mobile' }, { payment_type: 'epayment' }];
const cases = [
  { langKey: 'lang', terminalKey: 'terminalId', callbackKey: 'callbackURL', triggerKey: 'triggerURL' },
  { langKey: 'lang', terminalKey: 'terminal_id', callbackKey: 'callback_url', triggerKey: 'trigger_url' },
  { langKey: 'language', terminalKey: 'terminalId', callbackKey: 'callbackURL', triggerKey: 'triggerURL' },
  { langKey: 'language', terminalKey: 'terminal_id', callbackKey: 'callback_url', triggerKey: 'trigger_url' },
];
const formats = ['json', 'form'];
const amounts = [50000, '50000'];

const encodeForm = (body) =>
  Object.entries(body)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

const post = ({ host, format, body }) =>
  new Promise((resolve, reject) => {
    const isJson = format === 'json';
    const data = isJson ? JSON.stringify(body) : encodeForm(body);
    const options = {
      hostname: host,
      port: 443,
      path: '/api/create-payment',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
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
  for (const host of hosts) {
    for (const format of formats) {
      for (const amount of amounts) {
        for (const variant of cases) {
          for (const extra of payTypes) {
            const body = {
              [variant.langKey]: 'en',
              [variant.terminalKey]: '14740242',
              amount,
              [variant.callbackKey]: 'http://localhost:5003/api/wallet/paymera/callback',
              [variant.triggerKey]: 'http://localhost:5003/api/wallet/paymera/callback',
              notes: 'Wallet deposit test',
            };
            if (extra) Object.assign(body, extra);
            const result = await post({ host, format, body });
            const tag = `${host}|${format}|${variant.langKey}|${variant.terminalKey}|${variant.callbackKey}|${variant.triggerKey}|${amount}|${JSON.stringify(extra)}`;
            if (result.status !== 200 || result.body.includes('ErrorCode')) {
              console.log('FAIL', tag, result.status, result.body);
            } else {
              console.log('OK', tag, result.status, result.body);
            }
          }
        }
      }
    }
  }
})();
