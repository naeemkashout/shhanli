const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');

const Notification = require('../models/Notification');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node create-notification.js <userId> [title] [body]');
    process.exit(1);
  }

  const userId = args[0];
  const title = args[1] || 'Test Notification';
  const body = args[2] || 'This is a test notification created by script';

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in environment (.env)');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const n = await Notification.create({
      userId,
      type: 'system',
      titleEn: title,
      titleAr: title,
      messageEn: body,
      messageAr: body,
      isRead: false,
      metadata: {},
    });

    console.log('Created notification:', n._id.toString());
  } catch (err) {
    console.error('Error creating notification:', err.message || err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
