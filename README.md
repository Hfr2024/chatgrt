# أُفُق — محادثة ذكية + توليد صور + برومبتات فيديو

تطبيق ويب عربي (React + Vite) فيه ثلاثة أقسام:

- **محادثة**: يجيب عن الأسئلة في أي مجال، ويبحث في الإنترنت ويذكر المصادر، مع بثّ الإجابة مباشرة.
- **صور**: تصف الصورة بالعربية، فيحوّل الذكاء الاصطناعي وصفك إلى برومبت إنجليزي دقيق ثم يولّد صورتين (عبر خدمة Pollinations المجانية).
- **برومبت فيديو**: اختر المجال والأداة (Sora, Veo, Runway, Kling…) والمدة، فيكتب لك لقطات جاهزة للنسخ.

## التشغيل محلياً

```bash
npm install
npm run dev
```

افتح الرابط الظاهر، ثم اضغط أيقونة ⚙️ وأدخل مفتاح Claude API (من console.anthropic.com).
المفتاح يُحفظ في متصفحك فقط (localStorage) ولا يُرسل لأي جهة سوى Anthropic.

## الرفع على GitHub ونشره

```bash
git init
git add .
git commit -m "Ufuq AI app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

ثم من المستودع: **Settings → Pages → Source: GitHub Actions**.
بعد انتهاء الـ Action سيعمل التطبيق على `https://USERNAME.github.io/REPO/`.

## ملاحظات

- لا تضع مفتاح API داخل الكود أبداً. التطبيق يطلبه من كل مستخدم.
- كل رسالة تُحتسب على حساب مفتاح API المستخدم.
- توليد الصور يعتمد على خدمة طرف ثالث مجانية قد تتغير شروطها؛ لتبديلها عدّل دالة `makeUrl` في `src/Images.jsx`.
- Claude لا يولّد الصور بنفسه؛ يكتب الوصف الدقيق وخدمة الصور ترسمه.
