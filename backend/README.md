# Kashout - نظام إدارة الشحنات

نظام متكامل لإدارة الشحنات المحلية والدولية مع واجهة مستخدم عربية/إنجليزية.

## المميزات

- ✅ نظام مصادقة كامل (تسجيل دخول، تسجيل، استعادة كلمة المرور)
- ✅ إدارة الشحنات (إنشاء، تتبع، إلغاء)
- ✅ نظام المحفظة الإلكترونية (USD & SYP)
- ✅ إدارة جهات الاتصال
- ✅ لوحة تحكم إدارية
- ✅ دعم اللغتين العربية والإنجليزية
- ✅ تصميم متجاوب (Mobile First)
- ✅ طباعة وتصدير البوليصات (PDF)

## التقنيات المستخدمة

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (Real-time notifications)
- Nodemailer (Email service)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn-ui
- React Router v6
- Axios
- React Hook Form + Zod

## المتطلبات

- Node.js (v16 أو أحدث)
- MongoDB (v5 أو أحدث)
- npm أو pnpm

## التثبيت والتشغيل

### 1. تثبيت MongoDB

#### Windows:
```bash
# تحميل وتثبيت MongoDB Community Server من:
# https://www.mongodb.com/try/download/community

# تشغيل MongoDB
mongod
```

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# تشغيل MongoDB
sudo systemctl start mongod
```

### 2. تثبيت Backend

```bash
cd backend

# تثبيت المكتبات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف .env وإضافة بياناتك:
# - MONGODB_URI (إذا كان MongoDB يعمل على منفذ مختلف)
# - JWT_SECRET (مفتاح سري قوي)
# - EMAIL_USER و EMAIL_APP_PASSWORD (للبريد الإلكتروني)

# تشغيل Backend
npm run dev
```

Backend سيعمل على: `http://localhost:5000`

### 3. تثبيت Frontend

```bash
cd frontend

# تثبيت المكتبات (يفضل استخدام pnpm)
pnpm install
# أو
npm install

# نسخ ملف البيئة
cp .env.example .env

# تشغيل Frontend
pnpm run dev
# أو
npm run dev
```

Frontend سيعمل على: `http://localhost:5173`

## البنية الأساسية

```
shhanli/
├── backend/
│   ├── config/          # إعدادات قاعدة البيانات والبريد
│   ├── controllers/     # معالجات الطلبات
│   ├── middleware/      # Middleware للمصادقة
│   ├── models/          # نماذج MongoDB
│   ├── routes/          # مسارات API
│   ├── .env             # متغيرات البيئة
│   └── server.js        # نقطة البداية
│
├── frontend/
│   ├── src/
│   │   ├── components/  # مكونات React
│   │   ├── contexts/    # Context API
│   │   ├── pages/       # صفحات التطبيق
│   │   ├── services/    # خدمات API
│   │   └── data/        # بيانات ثابتة (ترجمات، دول)
│   ├── .env             # متغيرات البيئة
│   └── vite.config.ts   # إعدادات Vite
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/forgot-password` - طلب استعادة كلمة المرور
- `POST /api/auth/reset-password` - إعادة تعيين كلمة المرور
- `GET /api/auth/me` - الحصول على بيانات المستخدم الحالي

### Shipments
- `POST /api/shipments` - إنشاء شحنة جديدة
- `GET /api/shipments` - الحصول على شحنات المستخدم
- `GET /api/shipments/:id` - الحصول على تفاصيل شحنة
- `GET /api/shipments/track/:trackingNumber` - تتبع شحنة
- `PUT /api/shipments/:id/cancel` - إلغاء شحنة

### Wallet
- `POST /api/wallet/charge` - شحن المحفظة
- `GET /api/wallet/transactions` - سجل المعاملات

### Contacts
- `POST /api/contacts` - إضافة جهة اتصال
- `GET /api/contacts` - الحصول على جهات الاتصال
- `PUT /api/contacts/:id` - تحديث جهة اتصال
- `DELETE /api/contacts/:id` - حذف جهة اتصال

## حسابات الاختبار

### حساب مستخدم عادي:
```
Email: user@test.com
Password: User@123456
```

### حساب إداري:
```
Email: admin@kashout.com
Password: Admin@123456
```

## الإعدادات المهمة

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kashout
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## حل المشاكل الشائعة

### 1. خطأ في الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
mongod

# أو
brew services start mongodb-community
```

### 2. خطأ CORS
تأكد من أن `CORS_ORIGIN` في Backend يطابق عنوان Frontend:
```env
CORS_ORIGIN=http://localhost:5173
```

### 3. خطأ في تثبيت المكتبات
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

### 4. خطأ في الاتصال بـ API
تأكد من:
- Backend يعمل على المنفذ 5000
- Frontend يستخدم العنوان الصحيح في `.env`
- لا يوجد Firewall يمنع الاتصال

## المساهمة

للمساهمة في المشروع:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت MIT License.

## الدعم

للدعم والاستفسارات:
- Email: support@kashout.com
- GitHub Issues: [Create an issue](https://github.com/naeemkashout/shhanli/issues)

## ملاحظات مهمة

1. **قاعدة البيانات**: تأكد من تشغيل MongoDB قبل تشغيل Backend
2. **المنافذ**: Backend (5000) و Frontend (5173) يجب أن تكون متاحة
3. **البريد الإلكتروني**: لاستخدام ميزة استعادة كلمة المرور، قم بتكوين بيانات البريد في `.env`
4. **الأمان**: غيّر `JWT_SECRET` في الإنتاج إلى قيمة عشوائية قوية
5. **الإنتاج**: استخدم متغيرات بيئة آمنة ولا تشارك ملفات `.env`

## خطوات التطوير التالية

- [ ] إضافة نظام الإشعارات الفورية
- [ ] تكامل مع بوابات الدفع
- [ ] تطبيق الجوال (React Native)
- [ ] تقارير وإحصائيات متقدمة
- [ ] نظام التقييمات والمراجعات
- [ ] دعم لغات إضافية