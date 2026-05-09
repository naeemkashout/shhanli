// Email configuration - Ethereal for development, Gmail for production
const nodemailer = require("nodemailer");

let transporter;
let etherealUser = "";

const createTransporter = async () => {
  try {
    // Check if we have real Gmail credentials
    const hasGmailCredentials =
      process.env.EMAIL_USER &&
      process.env.EMAIL_APP_PASSWORD &&
      !process.env.EMAIL_USER.includes("your-") &&
      !process.env.EMAIL_APP_PASSWORD.includes("your-");

    if (hasGmailCredentials) {
      // Use Gmail for production
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      console.log("✅ Gmail email service configured");
      console.log(`📧 From: ${process.env.EMAIL_USER}`);
    } else {
      // Use Ethereal Email for development/testing
      console.log("📧 Using Ethereal Email for development/testing");

      const testAccount = await nodemailer.createTestAccount();
      etherealUser = testAccount.user;

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log("✅ Development email service configured with Ethereal");
      console.log("📧 Emails will be sent to Ethereal test service");
      console.log("📧 Check sent emails at: https://ethereal.email");
    }
  } catch (error) {
    console.error("❌ Failed to configure email service:", error.message);
    console.log("📧 Email service will not work until configured properly");
  }
};

// Initialize transporter
createTransporter();

const ensureTransporter = async () => {
  if (!transporter) {
    await createTransporter();
  }

  if (!transporter) {
    throw new Error("Email transporter is not configured");
  }
};

// Verify connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service connected successfully");
  } catch (error) {
    console.error("❌ Email service connection failed:", error.message);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (to, resetToken) => {
  await ensureTransporter();

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const fromAddress =
    process.env.EMAIL_USER && !process.env.EMAIL_USER.includes("your-")
      ? process.env.EMAIL_USER
      : etherealUser || "no-reply@shipme.local";

  const mailOptions = {
    from: `"شحنلي" <${fromAddress}>`,
    to: to,
    subject: "إعادة تعيين كلمة المرور - شحنلي",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
          }
          .reset-button:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
          .link-text {
            word-break: break-all;
            background: #f8fafc;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">شحنلي</div>
            <h1 style="color: #1f2937; margin: 10px 0;">إعادة تعيين كلمة المرور</h1>
          </div>

          <p>مرحباً،</p>

          <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في منصة شحنلي.</p>

          <p>يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور الخاصة بك:</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              إعادة تعيين كلمة المرور
            </a>
          </div>

          <div class="warning">
            <strong>تنبيه مهم:</strong><br>
            هذا الرابط صالح لمدة 15 دقيقة فقط. إذا لم تقم بإعادة التعيين خلال هذه المدة، ستحتاج لطلب رابط جديد.
          </div>

          <p>إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>

          <p>إذا كان الزر لا يعمل، يمكنك نسخ ولصق الرابط التالي في المتصفح:</p>

          <div class="link-text">${resetUrl}</div>

          <div class="footer">
            <p>مع خالص التحية،<br>فريق شحنلي</p>
            <p style="margin-top: 10px;">
              إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا على البريد الإلكتروني support@kashout.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      إعادة تعيين كلمة المرور - شحنلي

      مرحباً،

      لقد طلبت إعادة تعيين كلمة المرور لحسابك في منصة شحنلي.

      يرجى زيارة الرابط التالي لإعادة تعيين كلمة المرور:
      ${resetUrl}

      هذا الرابط صالح لمدة 15 دقيقة فقط.

      إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.

      مع خالص التحية,
      فريق شحنلي
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    let previewUrl = null;

    // If using Ethereal Email, log the preview URL
    if (process.env.NODE_ENV === "development" && info.messageId) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("📧 Preview email at:", previewUrl);
      }
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send welcome email
const sendWelcomeEmail = async (to, userName) => {
  await ensureTransporter();

  const fromAddress =
    process.env.EMAIL_USER && !process.env.EMAIL_USER.includes("your-")
      ? process.env.EMAIL_USER
      : etherealUser || "no-reply@shipme.local";

  const mailOptions = {
    from: `"شحنلي" <${fromAddress}>`,
    to: to,
    subject: "مرحباً بك في شحنلي",
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك في شحنلي</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .welcome-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">شحنلي</div>
            <h1 style="color: #1f2937; margin: 10px 0;">مرحباً بك في منصتنا!</h1>
          </div>

          <p>مرحباً ${userName}،</p>

          <p>شكراً لانضمامك إلى منصة شحنلي! نحن سعداء بانضمامك إلينا.</p>

          <p>الآن يمكنك الاستمتاع بخدمات الشحن المميزة والموثوقة التي نقدمها.</p>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" class="welcome-button">
              ابدأ رحلتك الآن
            </a>
          </div>

          <p>إذا كان لديك أي أسئلة أو تحتاج للمساعدة، لا تتردد في التواصل معنا.</p>

          <div class="footer">
            <p>مع خالص التحية،<br>فريق شحنلي</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", to);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

module.exports = {
  verifyConnection,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
