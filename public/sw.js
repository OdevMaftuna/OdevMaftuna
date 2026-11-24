/*
 * NSP service worker — minimal: saytni "ilova" sifatida o'rnatish mumkin bo'lishi uchun.
 * Sahifalarni keshlamaydi (har doim yangi ma'lumot, login/sessiya buzilmasin).
 * Internet yo'q bo'lsa — oddiy "Internet yo'q" sahifasini ko'rsatadi.
 */
const OFFLINE_HTML = `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NSP — internet yo'q</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1512;color:#e9ecea;font-family:system-ui,sans-serif;text-align:center;padding:24px}
b{display:block;font-size:22px;margin:12px 0 6px}button{margin-top:16px;border:0;border-radius:14px;padding:12px 20px;background:#F5C76A;color:#1d1608;font-weight:800;font-size:15px}</style></head>
<body><div><div style="font-size:56px">📶</div><b>Internet yo'q</b><span>Ulanishni tekshirib, qayta urinib ko'ring.</span><br><button onclick="location.reload()">Qayta urinish</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // faqat sahifa ochilishi
  event.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
