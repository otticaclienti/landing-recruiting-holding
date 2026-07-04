# Ottica Clienti — Landing selezione venditori

Landing page di recruiting con form di candidatura multi-step integrato.
Nessun build step: sono file statici, pronti da pubblicare (Netlify, Vercel,
Cloudflare Pages, un hosting classico, GitHub Pages…).

## Struttura dei file

```
index.html                 → contenuti della pagina + slot per i video
assets/css/style.css       → tutto il design (colori del brand in cima)
assets/js/config.js        → ⭐ QUI configuri la selezione (vedi sotto)
assets/js/app.js           → motore del form (non serve toccarlo)
assets/img/                → metti qui logo e immagine di anteprima social
```

## Cosa devi fare tu (checklist rapida)

### 1. Logo
Metti il tuo logo in `assets/img/`:
- `logo.png` → logo verde su trasparente (per l'header, sfondo bianco)
- `logo-white.png` → logo bianco su trasparente (per il footer verde)

Finché i file non ci sono, header e footer mostrano la scritta
“OTTICA CLIENTI” come fallback, quindi la pagina resta sempre pubblicabile.

### 2. Colori del brand
Sono già impostati sui verdi del logo, in cima a `assets/css/style.css`:
```css
--green:      #157a45;  /* accento: bottoni, titoli chiave, pallini */
--green-dark: #0d4d2c;  /* header/footer, dettagli, hover */
```
Se hai i valori HEX esatti del tuo verde, sostituiscili qui e basta.

### 3. Video (VSL + intervista Storytime + 4 testimonianze)
Non serve toccare l'HTML: incolli i **link di YouTube** in
`assets/js/config.js`, dentro `SETTINGS.videos`:
```js
videos: {
  vsl:       "https://youtu.be/XXXX",   // video di presentazione in alto
  storytime: "https://youtu.be/XXXX",   // intervista su Storytime
  testimonials: [                        // le 4 testimonianze, in ordine
    "https://youtu.be/AAAA",
    "https://youtu.be/BBBB",
    "https://youtu.be/CCCC",
    "https://youtu.be/DDDD"
  ]
}
```
Vanno bene sia i link `youtu.be/...` sia `youtube.com/watch?v=...` (anche
Vimeo). Un campo lasciato `""` mostra il segnaposto finché non hai il video.
Le copertine dei video si impostano dalla piattaforma (YouTube/Vimeo).

### 4. Dove arrivano le candidature
In `assets/js/config.js`, imposta `SETTINGS.submitEndpoint` con l'URL del
tuo webhook / endpoint (GoHighLevel, n8n, Supabase, Zapier, Make, un tuo
script…). I dati arrivano in JSON con nome, cognome, email, telefono, età
e tutte le risposte.
Se lo lasci vuoto, il form funziona lo stesso ma la candidatura viene solo
stampata nella console del browser (utile per fare prove).

### 5. Meta Pixel + meta tag
- **Pixel**: in `index.html`, dentro `<head>`, c'è il blocco “META PIXEL”.
  Sostituisci `IL_TUO_PIXEL_ID` e togli i commenti alle righe `fbq('init'...)`
  e all'`<img>` nel `<noscript>`.
  Il form invia già gli eventi `Lead` e `SelezioneCandidatura` a invio
  completato.
- **Meta tag / condivisione**: in cima al `<head>` aggiorna `og:url` e metti
  la tua immagine di anteprima in `assets/img/og-cover.jpg`.

## Come modificare la logica della selezione

Tutto sta in **`assets/js/config.js`**.

### Soglia di età
```js
ageMin: 18,
ageMax: 27,
```
Chi indica un'età fuori da questo intervallo viene squalificato.

### Quali risposte squalificano
Ogni domanda che squalifica ha la proprietà `disqualifyOn` con l'elenco
delle risposte che fanno scartare il candidato. Esempio (domanda esperienza):
```js
disqualifyOn: ["No"]   // rispondere "No" squalifica
```
- Per **togliere** la squalifica da una domanda: cancella la riga
  `disqualifyOn` (o mettila `disqualifyOn: []`).
- Per **aggiungerla** a un'altra: aggiungi `disqualifyOn: ["..."]` con il
  testo esatto dell'opzione che deve squalificare.
- L'età usa `disqualifyByAge: true` + le soglie qui sopra.

Al momento squalificano: **età fuori range**, **domanda 5 (No)**,
**domanda 9 (No)**, **domanda 10 (No)**. Le domande aperte e la domanda 8
(strumenti) NON squalificano.

### Messaggi mostrati
In `SETTINGS.messages` cambi:
- `disqualified` → messaggio di chiusura gentile per chi viene scartato
- `success` → thank you page per chi completa la candidatura
- `error` → messaggio se l'invio fallisce

### Testo delle domande
Nell'array `QUESTIONS` puoi cambiare `question`, `subtitle`, le `options` e
l'ordine. Il numero di domande e i pallini della barra si aggiornano da soli.

## Anteprima in locale
Apri semplicemente `index.html` nel browser, oppure servi la cartella:
```
python3 -m http.server 8000
# poi apri http://localhost:8000
```
