/* =========================================================================
   OTTICA CLIENTI — Embed automatico dei video
   -------------------------------------------------------------------------
   Legge i link da config.js (SETTINGS.videos) e li inserisce nei riquadri.
   Tu devi solo incollare i link in config.js: non serve toccare questo file.
   Supporta YouTube e Vimeo. Se un link è vuoto, resta il segnaposto.
   ========================================================================= */
(function () {
  "use strict";
  var V = (window.OC && window.OC.SETTINGS && window.OC.SETTINGS.videos) || {};

  function youtubeId(u) {
    if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u; // già un ID
    var m;
    if ((m = u.match(/[?&]v=([A-Za-z0-9_-]{11})/))) return m[1];
    if ((m = u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/))) return m[1];
    if ((m = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/))) return m[1];
    if ((m = u.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/))) return m[1];
    if ((m = u.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/))) return m[1];
    return null;
  }

  function embedSrc(url) {
    if (!url) return null;
    url = String(url).trim();
    if (!url) return null;

    var yt = youtubeId(url);
    if (yt) return "https://www.youtube-nocookie.com/embed/" + yt + "?rel=0";

    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return "https://player.vimeo.com/video/" + vm[1];
    if (/^\d+$/.test(url)) return "https://player.vimeo.com/video/" + url;

    // Se è già un URL incorporabile (Wistia, ecc.) lo uso così com'è
    if (/^https?:\/\//.test(url)) return url;
    return null;
  }

  function mount(key, url) {
    var host = document.querySelector('[data-video="' + key + '"]');
    if (!host) return;
    var src = embedSrc(url);
    if (!src) return; // link vuoto o non valido -> resta il segnaposto

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = host.getAttribute("data-title") || "Video";
    iframe.loading = "lazy";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.setAttribute("allowfullscreen", "");

    host.innerHTML = "";
    host.appendChild(iframe);
    host.classList.add("has-video");
  }

  mount("vsl", V.vsl);
  mount("storytime", V.storytime);
  (V.testimonials || []).forEach(function (u, i) {
    mount("testimonial-" + i, u);
  });
})();
