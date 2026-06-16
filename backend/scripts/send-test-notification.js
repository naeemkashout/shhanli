const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const fcm = require('../services/fcmService');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node send-test-notification.js <token1,token2,...> "Message title" "Message body"');
  process.exit(1);
}

const tokens = args[0].split(',').map(t => t.trim()).filter(Boolean);
const title = args[1] || 'Test Notification';
const body = args[2] || 'This is a test message from backend';

(async () => {
  try {
    await fcm.init();
    const res = await fcm.sendToTokens(tokens, { title, body, data: { test: '1' } });
    console.log('FCM send result:', res);
  } catch (err) {
    console.error('Error sending test notification:', err.message);
  }
})();
