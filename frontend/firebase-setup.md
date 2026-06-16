خطوات إعداد إشعارات الويب (Firebase / FCM)

1) إضافة إعدادات تطبيق الويب من Firebase Console
   - افتح Firebase Console → Project settings → Your apps → Web app → قم بنسخ config.
   - أنشئ ملف `.env` في مجلد `frontend/` أو أضف المتغيرات التالية في `.env` الخاص بـ Vite:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=shipme-6d246
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...

2) تأكد من وجود ملف `public/firebase-messaging-sw.js` في المشروع (تم توفير قالب). هذا الملف يجب أن يعمل من جذر الموقع المستضاف.

3) تشغيل الواجهة الأمامية محلياً: (في مجلد `frontend`)

```bash
pnpm install
pnpm dev
```

4) تسجيل التوكن وإرساله للخادم
   - عند تسجيل الدخول في الواجهة الأمامية، سيتم تلقائياً طلب توكن FCM وإرساله إلى `POST /api/notifications/device-token` باستخدام التوكن الموجود في التخزين المحلي.
   - يمكنك التحقق من أن التوكن مُسجل في قاعدة البيانات عبر حقل `fcmTokens` في نموذج `User`.

5) اختبار إرسال إشعار عبر السكربت الخلفي
   - في مجلد `backend` شغّل الأمر:

```bash
node scripts/send-test-notification.js "<TOKEN>" "عنوان الاختبار" "نص الاختبار"
```

6) ملاحظات مهمة
   - تأكد أن `public/firebase-messaging-sw.js` يُخدم من نفس origin للموقع.
   - احفظ مفاتيح VAPID وملف الخدمة `google-services.json`/`GoogleService-Info.plist` في أماكن آمنة ولا تدفعها إلى Git.

إذا أردت، أستطيع الآن: (أ) وضع القيم في `frontend/src/firebaseConfig.ts` تلقائياً لو أعطيت القيم، أو (ب) تجربة إرسال إشعار تجريبي إن زوّدتني بتوكن جهاز واحد.
