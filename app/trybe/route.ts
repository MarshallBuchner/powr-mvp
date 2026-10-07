// A standalone document deliberately avoids the app router and private report UI.
// Leaving this page performs a full navigation, unloading the tracking script.
export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>POWR | Your next skating takeaway</title><meta name="robots" content="noindex">
<meta name="referrer" content="no-referrer">
<style>
*{box-sizing:border-box}body{margin:0;background:#080c12;color:#edf5ff;font-family:Arial,sans-serif;line-height:1.6}main{max-width:760px;margin:auto;padding:64px 24px}.brand{font-weight:900;letter-spacing:.12em;color:#53e4e8;font-size:24px}h1{font-size:clamp(36px,7vw,62px);line-height:1.08;letter-spacing:-.04em;margin:32px 0 24px}p{color:#bac8d8;font-size:18px}.steps{padding:24px;background:#121c29;border:1px solid #23364b;border-radius:16px;margin:28px 0}.cta{display:inline-block;background:#53e4e8;color:#061015;padding:15px 24px;border-radius:10px;text-decoration:none;font-weight:800;margin:12px 0}.fine{font-size:13px;color:#91a0b3}a{color:#74e5ea}
</style>
<script>
(function(w,d,p,s,u,pl,at) {
  w._trybe = w._trybe || {pixelCode:p,storeId:s,platform:pl,autoTracking:at,customDomain:'track.trainwithpowr.com',serviceUrl:'https://prod-trybe-platform-6mi3j.ondigitalocean.app/attribution'};
  var script=d.createElement('script');script.src=u+'/pixel.js';script.async=true;
  script.setAttribute('data-pixel-code',p);script.setAttribute('data-store-id',s);script.setAttribute('data-platform',pl);script.setAttribute('data-auto-tracking',at);d.head.appendChild(script);
})(window,document,'px_4a171cfc6d9e','d5550a2c-9d65-441b-890e-cc82414e4434','https://track.trainwithpowr.com','CUSTOM','false');
</script></head><body><main>
<div class="brand">POWR</div><h1>Your skating.<br>One useful next step.</h1>
<p>Upload a skating clip and explore AI-assisted feedback for your next practice.</p>
<div class="steps">Your footage → movement visualization → assessment → a development takeaway.</div>
<a class="cta" href="/#start-assessment">Try your first assessment free</a>
<p>Want more feedback? Get 5 assessments for CA$19. One-time purchase.</p>
<p class="fine">AI-assisted estimates depend on footage quality. For development and education; not medical advice, scouting grades or a guarantee of improvement.</p>
<p class="fine">This page uses Trybe cookies to help measure visits from creator content. <a href="/privacy">Privacy</a></p>
</main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } });
}
