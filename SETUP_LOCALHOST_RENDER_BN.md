# Portfolio Localhost + Render Setup Guide (Bangla)

এই project-এ frontend এবং backend একই Express server থেকে চলবে। তাই শুধু `index.html` double click করে বা VS Code Live Server দিয়ে চালালে contact form কাজ করবে না। সবসময় backend server চালাতে হবে।

---

## 1) ZIP Extract করার পর Folder Open

1. ZIP file extract করো।
2. Extract করা project folder open করো।
3. Folder-এর উপরের address bar-এ click করো।
4. সেখানে লিখো:

```bash
cmd
```

5. Enter চাপো। ওই folder-এর ভিতরেই Command Prompt open হবে।

PowerShell চাইলে address bar-এ লিখতে পারো:

```bash
powershell
```

---

## 2) Node.js আছে কিনা Check

Command Prompt-এ লিখো:

```bash
node -v
npm -v
```

দুইটার version দেখালে ঠিক আছে। যদি error দেখায়, আগে Node.js LTS install করতে হবে।

---

## 3) Project Dependencies Install

Project folder-এর Command Prompt-এ লিখো:

```bash
npm install
```

এটা `node_modules` install করবে। GitHub-এ `node_modules` upload করবে না।

---

## 4) `.env` File বানানো

এই project-এ `.env.example` আছে। এটা copy করে `.env` বানাও। Command Prompt-এ লিখো:

```bash
copy .env.example .env
```

তারপর `.env` file open করো:

```bash
notepad .env
```

এভাবে সেট করো:

```env
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-personal-gmail@gmail.com
SMTP_PASS=your-16-character-gmail-app-password
CONTACT_TO_EMAIL=your-personal-gmail@gmail.com
```

### খুব গুরুত্বপূর্ণ

- `SMTP_USER` = যে Gmail account দিয়ে backend email send করবে। সাধারণত এটা তোমার নিজের Gmail।
- `SMTP_PASS` = Gmail normal password না। এটা 16-character Gmail App Password।
- `CONTACT_TO_EMAIL` = যে inbox-এ message আসবে। এটাও সাধারণত তোমার নিজের Gmail।
- visitor যে email form-এ দিবে, সেটা email-এর `Reply-To` হবে। তুমি inbox থেকে Reply দিলে visitor-এর email-এ reply যাবে।
- Gmail SMTP দিয়ে visitor-এর email সরাসরি `From` হিসেবে দেখানো যায় না। Gmail authenticated account-কেই sender হিসেবে দেখায়। এটা normal এবং secure behaviour।

---

## 5) Gmail App Password বানানো

1. তোমার Gmail account-এ 2-Step Verification ON থাকতে হবে।
2. Google Account > Security > App passwords এ যাও।
3. App name হিসেবে `Portfolio Backend` লিখে generate করো।
4. 16-character password copy করো।
5. `.env` file-এর `SMTP_PASS`-এ paste করো। Space থাকলে remove করে দাও।

Example:

```env
SMTP_PASS=abcdwxyzabcdwxyz
```

---

## 6) Localhost Run করা

Command Prompt-এ লিখো:

```bash
npm start
```

তারপর browser-এ open করো:

```text
http://localhost:3000
```

Backend check করতে browser-এ open করো:

```text
http://localhost:3000/api/health
```

যদি দেখায়:

```json
{"success":true,"message":"Backend is running."}
```

তাহলে backend ঠিক আছে।

---

## 7) Contact Form Test

1. `http://localhost:3000` open করো।
2. Contact form fill করো।
3. Email field-এ যেকোনো visitor email দিতে পারো।
4. Submit করো।
5. তোমার `CONTACT_TO_EMAIL` inbox check করো। Spam/Promotions folder-ও check করো।
6. Email-এর sender তোমার `SMTP_USER` হতে পারে, কিন্তু Reply-To visitor email হবে। Reply চাপলে visitor-এর email-এ reply যাবে।

### এখন আর fake success দেখাবে না

আগের code-এ SMTP fail হলেও success দেখাতে পারত। এখন SMTP ভুল হলে frontend error দেখাবে, যেন তুমি বুঝতে পারো problem কোথায়।

---

## 8) Project Button / Live Project Link Update

Project link update করার জন্য শুধু এই file edit করো:

```text
project-links.js
```

Example website link:

```js
cbuy: {
  label: 'Live Project',
  url: 'https://your-website-link.com'
}
```

Example Figma link:

```js
procam: {
  label: 'Figma File',
  url: 'https://www.figma.com/file/your-share-link'
}
```

Example PDF link:

1. `project-files` folder-এর ভিতরে PDF file রাখো।
2. `project-links.js` এ path দাও:

```js
orbit: {
  label: 'PDF Case Study',
  url: 'project-files/orbit-case-study.pdf'
}
```

Link দিলে button new tab-এ open হবে। Link blank থাকলে button disabled থাকবে এবং alert দেখাবে।

---

## 9) GitHub Upload

GitHub-এ upload করার আগে check করো:

- `.env` file upload করবে না। `.gitignore` already `.env` ignore করে।
- `node_modules` upload করবে না। `.gitignore` already ignore করে।
- `project-links.js` upload করবে, কারণ project button links ওখানে থাকবে।
- PDF files যদি add করো, `project-files` folder upload করতে হবে।

Common commands:

```bash
git add .
git commit -m "Fix contact form backend and project links"
git push
```

---

## 10) Render Deploy

Render-এ backend সহ host করতে হবে। শুধু Netlify static deploy করলে `/api/contact` কাজ করবে না।

Render settings:

```text
Service Type: Web Service
Runtime/Language: Node
Build Command: npm install
Start Command: npm start
```

Environment Variables add করো:

```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-personal-gmail@gmail.com
SMTP_PASS=your-16-character-gmail-app-password
CONTACT_TO_EMAIL=your-personal-gmail@gmail.com
```

`PORT` manually add করার দরকার নেই। Render automatically PORT দেয়।

Deploy complete হলে Render-এর link open করে contact form test করো।

---

## 11) Common Problems

### Problem: `Cannot POST /api/contact`

তুমি backend ছাড়া static file চালাচ্ছো। `npm start` দিয়ে run করো এবং `http://localhost:3000` ব্যবহার করো।

### Problem: Submit করলে sending দেখায় কিন্তু email আসে না

এই fixed version-এ এমন silently success দেখাবে না। যদি আসে না, error message দেখাবে। `.env` অথবা Render Environment Variables check করো।

### Problem: Invalid login / authentication failed

`SMTP_PASS` Gmail normal password না। Gmail App Password লাগবে। Gmail 2-Step Verification ON করো।

### Problem: Email আসে কিন্তু visitor email থেকে আসছে না

Gmail SMTP visitor email-কে `From` বানাতে দেয় না। Visitor email `Reply-To` হিসেবে থাকে। Inbox থেকে Reply দিলে visitor-এর email-এ reply যাবে।

### Problem: Project button click করলে কিছু open হয় না

`project-links.js` file-এ ওই project key-এর `url` blank আছে। সেখানে website/Figma/PDF link add করো।
