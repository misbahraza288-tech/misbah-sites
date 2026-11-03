# Kanak Cafe & Restaurant: online order app (v3)

Live: https://misbahraza288-tech.github.io/misbah-sites/kanak-cafe/

**Restaurant App Pro** template · Misbah Digital

## Screens
1. **Home**: hero photos, a live "khula / band" status, offers, categories, bestsellers, and call / directions / WhatsApp / share.
2. **Menu**: categories, search, veg filter, Half/Full prices, and an item detail sheet.
3. **Cart + Checkout**: dine-in (table no.), takeaway or delivery (address), notes, coupon and bill. **Customer login is required before placing an order.**
4. **Orders**: past orders with status from the cafe, plus 1-tap reorder and resend on WhatsApp.
5. **Profile / Login**: name + 10-digit mobile, saved on the phone. *There is no OTP verification* (no paid SMS service is used).
6. **Settings**: theme (light/dark/auto), language (Hinglish/English), app install, share, QR code (table QR too), about, contact, and **Owner Login**.

**Owner Panel** (Settings → Owner Login → password): manages incoming orders (accept / preparing / ready / done), menu items (add, edit, delete, price, Half/Full, veg, photo upload, in stock / sold out, bestseller, hide), categories, offers + coupons, timing + open/closed override + notice, delivery on/off, charge, minimum and area, cafe info (including the order WhatsApp number), and the password change.
Changes are saved on the server (Cloudflare KV), so **every customer's phone** sees the update (within ~1 minute).

## How it works
- Frontend: plain HTML/CSS/JS (no framework) and an installable PWA (works offline from the last menu).
- Backend: `worker/kanak-api.js` in the `misbah-digital-computer` repo (the same free Cloudflare Worker), with data in the free KV namespace `kanak-cafe-data`.
- Every order goes to the cafe's WhatsApp (the main channel) and is also saved on the server for the Owner Panel.
- `data.js` = starting (seed) data. It is used until the owner saves something, or when the phone is offline.

## Owner password
The password is never kept in code or the repo. The server stores only a salted PBKDF2 hash.
- **First time / reset (Misbah):** App → Settings → Owner Login → "Pehli baar setup / Reset" → enter the Dashboard key + the new password.
  *Or* GitHub → misbah-digital-computer → Actions → **Kanak Owner Password** → Run workflow → `set` + password.
- **Owner changes it themselves:** Owner Panel → Password.
