# 🚀 Деплой на Vercel

Пошаговая инструкция выкатки **Темнодушного Лета** в продакшен.

---

## 📋 Предусловие

- ✅ Аккаунт GitHub (репо для проекта)
- ✅ Аккаунт Vercel (бесплатный план хватит)
- ✅ Neon БД уже работает (она у тебя есть)
- ✅ Discord OAuth-приложение настроено

---

## 1️⃣ Подготовь код

### Закоммить и запушь в GitHub

В PowerShell в корне проекта:

```powershell
git init                          # если ещё не git-репо
git add -A
git commit -m "Initial production-ready commit"
```

Создай **приватный** репозиторий на GitHub: https://github.com/new
(назови как угодно, например `gauntlet-rpg`)

```powershell
git remote add origin https://github.com/<ТВОЙ_USERNAME>/<ИМЯ_РЕПО>.git
git branch -M main
git push -u origin main
```

⚠️ **ВАЖНО:** Файл `.env` уже в `.gitignore` — пароли НЕ улетят в GitHub. Проверь:

```powershell
git status
```

Если в списке нет `.env` — отлично.

---

## 2️⃣ Подключи Vercel

1. Заходи на https://vercel.com
2. **Add New… → Project**
3. **Import Git Repository** — выбери свой `gauntlet-rpg`
4. На экране настройки:
   - **Framework Preset:** Next.js (Vercel определит сам)
   - **Build command:** оставь дефолтное (`npm run build`) — у нас в package.json уже `prisma generate && next build`
   - **Root directory:** `.` (по умолчанию)
   - **Install Command:** `npm install` (дефолт)
5. **НЕ нажимай Deploy пока** — сначала пропиши env-переменные.

---

## 3️⃣ Environment Variables

В разделе **Environment Variables** добавь следующее **по одной** (Production + Preview + Development):

| Имя | Значение | Источник |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_kxXzA19MJSRO@...neon.tech/neondb?sslmode=require&channel_binding=require` | из твоего `.env` |
| `DISCORD_CLIENT_ID` | `1503389041482137631` | из твоего `.env` |
| `DISCORD_CLIENT_SECRET` | `HdsIA4g20hyxD1_HiW2H7ZEsjxJHYWKq` | из твоего `.env` |
| `NEXTAUTH_SECRET` | `fRBPZ1D08H6/wb4OWwJDAey10g0Ekesv8SQR0KOrHss=` | из твоего `.env` |
| `AUTH_TRUST_HOST` | `true` | новое! нужно для NextAuth v5 за прокси |
| `NEXTAUTH_URL` | **подставишь после первого деплоя** | твой Vercel-домен |

`AUTH_TRUST_HOST=true` обязательно — иначе NextAuth ругается на CSRF.

`NEXTAUTH_URL` сначала оставь пустым (или поставь любое — заменим). Vercel даст тебе домен после деплоя.

---

## 4️⃣ Первый деплой

Нажми **Deploy**. Подожди 1-2 минуты.

После завершения Vercel покажет домен типа `gauntlet-rpg-abc123.vercel.app`.

### Доделай `NEXTAUTH_URL`

1. Settings → Environment Variables → Edit `NEXTAUTH_URL`
2. Поставь: `https://gauntlet-rpg-abc123.vercel.app` (твой реальный домен)
3. **Перезапусти деплой**: Deployments → последний → ⋯ → Redeploy

---

## 5️⃣ Настрой Discord OAuth Redirect

Без этого логин не сработает.

1. Заходи на https://discord.com/developers/applications
2. Выбери своё приложение (ID `1503389041482137631`)
3. **OAuth2 → Redirects** → добавь:
   ```
   https://gauntlet-rpg-abc123.vercel.app/api/auth/callback/discord
   ```
   (замени на свой реальный домен)
4. Save

---

## 6️⃣ Залей каталог предметов в prod-БД

У тебя в Neon одна общая база — между dev и prod она шарится. Это удобно для теста. Но проверь что предметы засеяны:

```powershell
npx tsx scripts/seed-items.ts
```

Каталог идемпотентен (upsert) — запустить можно сколько угодно раз.

---

## 7️⃣ Проверь продакшен

Открой свой `https://gauntlet-rpg-abc123.vercel.app`:

- [ ] Главная грузится
- [ ] Логин через Discord работает
- [ ] Профиль показывает игрока
- [ ] Карта рендерится
- [ ] Регион открывается (квест, диалог)
- [ ] Ролл игры работает
- [ ] Инвентарь / админка / квесты

---

## 🌐 Кастомный домен (опционально)

Если купил домен (например `temnodushnoe.ru`):

1. Vercel → Project → **Settings → Domains** → Add
2. Введи свой домен → Vercel покажет DNS-записи
3. Пропиши их у регистратора (CNAME / A-запись)
4. Через 5-30 минут домен подтянется
5. **Обнови:**
   - `NEXTAUTH_URL` → новый домен
   - Discord OAuth Redirect → новый домен `/api/auth/callback/discord`
6. Redeploy

---

## 🐛 Если что-то сломалось

### «Build failed: prisma generate»
В Vercel UI → Deployments → клик на упавший билд → Logs.

Проверь:
- В env есть `DATABASE_URL`?
- Команда build = `prisma generate && next build`?

### «AdapterError / Can't reach database»
- Neon БД могла уйти в idle. Открой console.neon.tech → разбуди.
- `DATABASE_URL` правильный? Скопирован полностью со `?sslmode=require&channel_binding=require` на конце?

### «UntrustedHost» / CSRF
- `AUTH_TRUST_HOST=true` стоит в Vercel env?

### Логин зависает / 404 на `/api/auth/callback/discord`
- Discord OAuth Redirect URL прописан **точно** под твой Vercel-домен?
- `NEXTAUTH_URL` совпадает с реальным URL сайта?

---

## 🔁 Обновления после деплоя

```powershell
git add -A
git commit -m "Описание изменений"
git push
```

Vercel автоматически развернёт новую версию через ~1-2 минуты.

Если меняла **схему БД** (`prisma/schema.prisma`):

```powershell
npx prisma db push
```

Запускай локально (или прямо в Vercel CLI) — БД обновится мгновенно, новый код подтянется при деплое.

---

## 🎯 Готово!

Темнодушное Лето в проде. Можно звать пацанов.
