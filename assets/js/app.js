/* =========================================================================
   OTTICA CLIENTI — Motore del form multi-step
   -------------------------------------------------------------------------
   Non serve modificare questo file per la gestione ordinaria:
   testi, domande, squalifiche, soglia età ed endpoint stanno in config.js.
   Qui c'è solo la logica che fa funzionare il form.
   ========================================================================= */
(function () {
  "use strict";

  var SETTINGS = window.OC.SETTINGS;
  var QUESTIONS = window.OC.QUESTIONS;

  var root = document.getElementById("apply-form");
  if (!root) return;

  // Stato del form
  var STATE = {
    step: -1,            // -1 = schermata di apertura; 0..N-1 = domande
    answers: {},         // risposte raccolte
    disqualified: false,
    submitted: false
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------------------------------------------------------------------
     UTIL
     --------------------------------------------------------------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function firePixel(event) {
    // Traccia eventi sul Meta Pixel se presente
    if (typeof window.fbq === "function") {
      try { window.fbq("trackCustom", event); } catch (e) {}
    }
  }

  /* ---------------------------------------------------------------------
     RENDER PRINCIPALE
     --------------------------------------------------------------------- */
  function render() {
    // Transizione pulita in uscita
    root.classList.add("is-leaving");
    window.setTimeout(function () {
      root.innerHTML = "";
      root.classList.remove("is-leaving");

      if (STATE.submitted) return renderSuccess();
      if (STATE.disqualified) return renderDisqualified();
      if (STATE.step === -1) return renderIntro();
      return renderQuestion(STATE.step);
    }, 160);
  }

  function mount(node) {
    root.appendChild(node);
    // Trigger transizione in entrata
    window.requestAnimationFrame(function () {
      node.classList.add("is-in");
    });
    // Focus sul primo campo utile
    var focusable = node.querySelector("input, textarea, select, button.choice-btn");
    if (focusable) {
      try { focusable.focus({ preventScroll: true }); } catch (e) { focusable.focus(); }
    }
  }

  /* ---------------------------------------------------------------------
     SCHERMATA DI APERTURA
     --------------------------------------------------------------------- */
  function renderIntro() {
    var s = SETTINGS.intro;
    var node = el("div", "step step-intro");
    node.appendChild(el("h2", "step-title", s.title));
    node.appendChild(el("p", "step-sub", s.subtitle));
    node.appendChild(el("p", "step-count", QUESTIONS.length + " domande. Ti bastano pochi minuti."));

    var btn = el("button", "btn btn-block", s.startButton);
    btn.type = "button";
    btn.addEventListener("click", function () {
      firePixel("SelezioneStart");
      STATE.step = 0;
      render();
    });
    node.appendChild(btn);
    mount(node);
  }

  /* ---------------------------------------------------------------------
     UNA DOMANDA PER SCHERMATA
     --------------------------------------------------------------------- */
  function renderQuestion(i) {
    var q = QUESTIONS[i];
    var node = el("div", "step step-question");

    node.appendChild(el("p", "step-progress-label", "Domanda " + (i + 1) + " di " + QUESTIONS.length));
    node.appendChild(el("h2", "step-title", q.question));
    if (q.subtitle) node.appendChild(el("p", "step-sub", q.subtitle));

    var field = el("div", "field");
    var errorBox = el("p", "field-error");
    errorBox.setAttribute("aria-live", "polite");

    var control = buildControl(q, function onEnter() { goNext(q, field, errorBox); });
    field.appendChild(control.node);
    node.appendChild(field);
    node.appendChild(errorBox);

    // Navigazione
    var nav = el("div", "step-nav");

    // "Indietro" solo dalla seconda domanda in poi.
    // Sulla prima domanda "Avanti" occupa tutta la larghezza (schermata bilanciata).
    if (i > 0) {
      var backBtn = el("button", "btn btn-ghost", SETTINGS.labels.back);
      backBtn.type = "button";
      backBtn.addEventListener("click", function () {
        STATE.step = i - 1;
        if (STATE.step < 0) STATE.step = -1;
        render();
      });
      nav.appendChild(backBtn);
    } else {
      nav.classList.add("step-nav-single");
    }

    var isLast = i === QUESTIONS.length - 1;
    var nextBtn = el("button", "btn", isLast ? SETTINGS.labels.submit : SETTINGS.labels.next);
    nextBtn.type = "button";
    nextBtn.addEventListener("click", function () { goNext(q, field, errorBox); });

    nav.appendChild(nextBtn);
    node.appendChild(nav);

    // Barra a pallini
    node.appendChild(buildDots(i));

    mount(node);
  }

  function goNext(q, field, errorBox) {
    var res = readAndValidate(q, field);
    if (!res.ok) {
      errorBox.textContent = res.error;
      field.classList.add("has-error");
      return;
    }
    field.classList.remove("has-error");
    errorBox.textContent = "";

    STATE.answers[q.id] = res.value;

    // Controllo squalifica
    if (isDisqualifying(q, res.value)) {
      STATE.disqualified = true;
      firePixel("SelezioneScartato");
      return render();
    }

    // Avanti / invio
    if (STATE.step === QUESTIONS.length - 1) {
      submit();
    } else {
      STATE.step++;
      render();
    }
  }

  /* ---------------------------------------------------------------------
     COSTRUZIONE DEI CONTROLLI PER TIPO
     --------------------------------------------------------------------- */
  function buildControl(q, onEnter) {
    var wrap = el("div", "control control-" + q.type);
    var saved = STATE.answers[q.id];

    function enterToNext(input) {
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" && q.type !== "textarea") {
          ev.preventDefault();
          onEnter();
        }
      });
    }

    if (q.type === "name") {
      var first = el("input", "input");
      first.type = "text"; first.name = q.id + "_nome"; first.placeholder = "Nome";
      first.autocomplete = "given-name";
      var last = el("input", "input");
      last.type = "text"; last.name = q.id + "_cognome"; last.placeholder = "Cognome";
      last.autocomplete = "family-name";
      if (saved) { first.value = saved.nome || ""; last.value = saved.cognome || ""; }
      enterToNext(first); enterToNext(last);
      var row = el("div", "input-row");
      row.appendChild(first); row.appendChild(last);
      wrap.appendChild(row);
      wrap._read = function () { return { nome: first.value.trim(), cognome: last.value.trim() }; };

    } else if (q.type === "number") {
      var num = el("input", "input");
      num.type = "number"; num.inputMode = "numeric"; num.name = q.id;
      num.placeholder = "La tua età";
      if (q.min != null) num.min = q.min;
      if (q.max != null) num.max = q.max;
      if (saved != null) num.value = saved;
      enterToNext(num);
      wrap.appendChild(num);
      wrap._read = function () { return num.value.trim(); };

    } else if (q.type === "email") {
      var em = el("input", "input");
      em.type = "email"; em.name = q.id; em.placeholder = "nome@email.it";
      em.autocomplete = "email";
      if (saved) em.value = saved;
      enterToNext(em);
      wrap.appendChild(em);
      wrap._read = function () { return em.value.trim(); };

    } else if (q.type === "phone") {
      var prefix = el("input", "input input-prefix");
      prefix.type = "tel"; prefix.name = q.id + "_prefisso"; prefix.placeholder = "+39";
      prefix.value = (saved && saved.prefisso) ? saved.prefisso : "+39";
      var phone = el("input", "input");
      phone.type = "tel"; phone.name = q.id + "_numero"; phone.placeholder = "Numero di telefono";
      phone.autocomplete = "tel";
      if (saved && saved.numero) phone.value = saved.numero;
      enterToNext(prefix); enterToNext(phone);
      var prow = el("div", "input-row input-row-phone");
      prow.appendChild(prefix); prow.appendChild(phone);
      wrap.appendChild(prow);
      wrap._read = function () { return { prefisso: prefix.value.trim(), numero: phone.value.trim() }; };

    } else if (q.type === "choice") {
      var current = { val: saved != null ? saved : null };
      var group = el("div", "choice-group");
      q.options.forEach(function (opt) {
        var b = el("button", "choice-btn", opt);
        b.type = "button";
        if (current.val === opt) b.classList.add("is-selected");
        b.addEventListener("click", function () {
          current.val = opt;
          group.querySelectorAll(".choice-btn").forEach(function (x) { x.classList.remove("is-selected"); });
          b.classList.add("is-selected");
        });
        group.appendChild(b);
      });
      wrap.appendChild(group);
      wrap._read = function () { return current.val; };

    } else if (q.type === "select") {
      var sel = el("select", "input select");
      sel.name = q.id;
      var ph = el("option", null, "Seleziona…");
      ph.value = ""; ph.disabled = true; if (saved == null) ph.selected = true;
      sel.appendChild(ph);
      q.options.forEach(function (opt) {
        var o = el("option", null, opt);
        o.value = opt;
        if (saved === opt) o.selected = true;
        sel.appendChild(o);
      });
      wrap.appendChild(sel);
      wrap._read = function () { return sel.value; };

    } else { // textarea
      var ta = el("textarea", "input textarea");
      ta.name = q.id; ta.rows = 5;
      ta.placeholder = "Scrivi qui la tua risposta…";
      if (saved) ta.value = saved;
      wrap.appendChild(ta);
      wrap._read = function () { return ta.value.trim(); };
    }

    return { node: wrap };
  }

  /* ---------------------------------------------------------------------
     LETTURA + VALIDAZIONE
     --------------------------------------------------------------------- */
  function readAndValidate(q, field) {
    var control = field.querySelector(".control");
    var value = control._read();

    if (q.type === "name") {
      if (q.required && (!value.nome || !value.cognome)) {
        return { ok: false, error: "Inserisci sia il nome che il cognome." };
      }
      return { ok: true, value: value };
    }

    if (q.type === "number") {
      if (q.required && value === "") return { ok: false, error: "Inserisci la tua età." };
      var n = parseInt(value, 10);
      if (isNaN(n)) return { ok: false, error: "Inserisci un numero valido." };
      return { ok: true, value: n };
    }

    if (q.type === "email") {
      if (q.required && value === "") return { ok: false, error: "Inserisci la tua email." };
      if (value !== "" && !EMAIL_RE.test(value)) {
        return { ok: false, error: "Controlla il formato dell'email." };
      }
      return { ok: true, value: value };
    }

    if (q.type === "phone") {
      if (q.required && !value.numero) return { ok: false, error: "Inserisci il tuo numero di telefono." };
      var digits = (value.numero || "").replace(/\D/g, "");
      if (value.numero && digits.length < 6) {
        return { ok: false, error: "Il numero non sembra valido." };
      }
      return { ok: true, value: value };
    }

    if (q.type === "choice") {
      if (q.required && !value) return { ok: false, error: "Seleziona una risposta." };
      return { ok: true, value: value };
    }

    if (q.type === "select") {
      if (q.required && !value) return { ok: false, error: "Seleziona un'opzione." };
      return { ok: true, value: value };
    }

    // textarea
    if (q.required && !value) return { ok: false, error: "Questa risposta è obbligatoria." };
    return { ok: true, value: value };
  }

  /* ---------------------------------------------------------------------
     LOGICA DI SQUALIFICA
     (guidata da config.js: disqualifyOn / disqualifyByAge / soglia età)
     --------------------------------------------------------------------- */
  function isDisqualifying(q, value) {
    // Squalifica per età fuori soglia
    if (q.disqualifyByAge) {
      var age = parseInt(value, 10);
      if (!isNaN(age) && (age < SETTINGS.ageMin || age > SETTINGS.ageMax)) {
        return true;
      }
    }
    // Squalifica per risposta a scelta / menu
    if (q.disqualifyOn && q.disqualifyOn.length) {
      if (q.disqualifyOn.indexOf(value) !== -1) return true;
    }
    return false;
  }

  /* ---------------------------------------------------------------------
     BARRA A PALLINI
     --------------------------------------------------------------------- */
  function buildDots(activeIndex) {
    var dots = el("div", "dots");
    for (var i = 0; i < QUESTIONS.length; i++) {
      var d = el("span", "dot");
      if (i < activeIndex) d.classList.add("is-done");
      if (i === activeIndex) d.classList.add("is-active");
      dots.appendChild(d);
    }
    return dots;
  }

  /* ---------------------------------------------------------------------
     SCHERMATA DI SQUALIFICA
     --------------------------------------------------------------------- */
  function renderDisqualified() {
    var m = SETTINGS.messages.disqualified;
    var node = el("div", "step step-end step-disqualified");
    node.appendChild(el("div", "end-mark end-mark-neutral", "—"));
    node.appendChild(el("h2", "step-title", m.title));
    node.appendChild(el("p", "step-sub", m.body));
    mount(node);
  }

  /* ---------------------------------------------------------------------
     INVIO
     --------------------------------------------------------------------- */
  function submit() {
    var payload = buildPayload();

    // Mostra stato "invio in corso"
    root.innerHTML = "";
    var loading = el("div", "step step-loading");
    loading.appendChild(el("p", "step-sub", SETTINGS.labels.sending));
    loading.classList.add("is-in");
    root.appendChild(loading);

    if (!SETTINGS.submitEndpoint) {
      // Modalità prova: nessun endpoint configurato
      console.log("[Ottica Clienti] Nessun endpoint configurato. Candidatura (prova):", payload);
      finishSuccess();
      return;
    }

    var opts = {
      method: SETTINGS.submitMethod || "POST",
      headers: {},
      body: null
    };
    if (SETTINGS.submitAsJson) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(payload);
    } else {
      var fd = new FormData();
      Object.keys(payload).forEach(function (k) {
        fd.append(k, typeof payload[k] === "object" ? JSON.stringify(payload[k]) : payload[k]);
      });
      opts.body = fd;
    }

    fetch(SETTINGS.submitEndpoint, opts)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        finishSuccess();
      })
      .catch(function (err) {
        console.error("[Ottica Clienti] Invio fallito:", err);
        renderError();
      });
  }

  function finishSuccess() {
    STATE.submitted = true;
    firePixel("SelezioneCandidatura"); // evento personalizzato per Meta
    // Evento standard "Lead" se il Pixel è attivo
    if (typeof window.fbq === "function") {
      try { window.fbq("track", "Lead"); } catch (e) {}
    }
    render();
  }

  function answerToText(v) {
    if (v == null) return "";
    if (typeof v === "object") {
      if (v.nome !== undefined) return ((v.nome || "") + " " + (v.cognome || "")).trim();
      if (v.numero !== undefined) return ((v.prefisso || "") + " " + (v.numero || "")).trim();
      return JSON.stringify(v);
    }
    return String(v);
  }

  function buildPayload() {
    var a = STATE.answers;
    var nc = a["nome_cognome"] || {};
    var tel = a["telefono"] || {};
    // Telefono in formato E.164 (senza spazi) per CRM/GHL
    var phone = ((tel.prefisso || "") + (tel.numero || "")).replace(/[^\d+]/g, "");

    // Campi standard, nomi già pronti per il mapping in GHL
    var out = {
      first_name: nc.nome || "",
      last_name: nc.cognome || "",
      full_name: ((nc.nome || "") + " " + (nc.cognome || "")).trim(),
      email: a["email"] || "",
      phone: phone,
      eta: a["eta"] || "",
      fonte: "Landing selezione venditori B2B — Ottica Clienti",
      data: new Date().toISOString()
    };

    // Tutte le domande e risposte in un'unica NOTA leggibile.
    // (In GHL basta mappare "note" sulla nota del contatto: la vedi
    //  aprendo l'opportunità. Nessun custom field necessario.)
    var note = [];
    QUESTIONS.forEach(function (q) {
      note.push(q.question + "\n" + (answerToText(a[q.id]) || "—"));
    });
    out.note = note.join("\n\n");

    return out;
  }

  /* ---------------------------------------------------------------------
     SCHERMATA DI SUCCESSO (thank you page)
     --------------------------------------------------------------------- */
  function renderSuccess() {
    var m = SETTINGS.messages.success;
    var node = el("div", "step step-end step-success");
    node.appendChild(el("div", "end-mark end-mark-ok", "✓"));
    node.appendChild(el("h2", "step-title", m.title));
    node.appendChild(el("p", "step-sub", m.body));
    mount(node);
  }

  function renderError() {
    var m = SETTINGS.messages.error;
    root.innerHTML = "";
    var node = el("div", "step step-end step-error");
    node.appendChild(el("h2", "step-title", m.title));
    node.appendChild(el("p", "step-sub", m.body));
    var retry = el("button", "btn", "Riprova");
    retry.type = "button";
    retry.addEventListener("click", function () { submit(); });
    node.appendChild(retry);
    node.classList.add("is-in");
    root.appendChild(node);
  }

  /* ---------------------------------------------------------------------
     AVVIO
     --------------------------------------------------------------------- */
  renderIntro();

})();
