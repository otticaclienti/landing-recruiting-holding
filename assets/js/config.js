/* =========================================================================
   OTTICA CLIENTI — CONFIGURAZIONE DELLA SELEZIONE
   -------------------------------------------------------------------------
   QUESTO È L'UNICO FILE CHE TI SERVE TOCCARE per gestire la selezione.
   Da qui modifichi:
     1) DOVE arrivano le candidature   -> SETTINGS.submitEndpoint
     2) LA SOGLIA DI ETÀ               -> SETTINGS.ageMin / ageMax
     3) COSA SQUALIFICA                -> proprietà "disqualifyOn" delle domande
     4) I MESSAGGI mostrati            -> SETTINGS.messages
     5) I TESTI del form e le domande  -> array QUESTIONS
   =========================================================================*/

const SETTINGS = {

  /* -----------------------------------------------------------------------
     1) DOVE ARRIVANO LE CANDIDATURE
     -----------------------------------------------------------------------
     Incolla qui l'URL dell'endpoint / webhook che deve ricevere i dati.
     Funziona con qualsiasi servizio che accetta una POST in JSON:
       - Webhook GoHighLevel / GHL
       - Webhook n8n
       - Funzione / tabella Supabase (Edge Function)
       - Zapier / Make / Google Apps Script
       - Un tuo endpoint personalizzato
     Lascialo vuoto ("") per fare solo delle prove: in quel caso la
     candidatura NON viene inviata da nessuna parte, viene solo stampata
     nella console del browser (tasto destro > Ispeziona > Console).       */
  submitEndpoint: "",

  /* Metodo e formato dell'invio. Nella stragrande maggioranza dei casi
     lascia così com'è. */
  submitMethod: "POST",
  submitAsJson: true,

  /* -----------------------------------------------------------------------
     VIDEO DELLA PAGINA
     -----------------------------------------------------------------------
     Incolla qui i LINK dei video: basta il link di YouTube (o Vimeo).
     Non serve toccare l'HTML. Esempi di link validi:
        https://youtu.be/XXXXXXXXXXX
        https://www.youtube.com/watch?v=XXXXXXXXXXX
     Lascia "" (vuoto) per mostrare il segnaposto finché non hai il video.  */
  videos: {
    vsl:       "",   // Video di presentazione (VSL), in alto nella hero
    storytime: "https://youtu.be/8t6cG9KZwGY",   // Intervista su Storytime (link YouTube)
    // Le 4 testimonianze clienti, nell'ordine in cui compaiono:
    testimonials: [
      "https://youtu.be/WrxDJjZ7NaQ",
      "https://youtu.be/Hi6P7xJKrY0",
      "https://youtu.be/U0Iv_2xfj_I",
      "https://youtu.be/rx51pVvKdsg"
    ]
  },

  /* -----------------------------------------------------------------------
     2) SOGLIA DI ETÀ
     -----------------------------------------------------------------------
     Chi indica un'età FUORI da questo intervallo viene squalificato.
     Cambia i due numeri quando vuoi (estremi inclusi).                    */
  ageMin: 18,
  ageMax: 27,

  /* -----------------------------------------------------------------------
     3) MESSAGGI MOSTRATI
     ----------------------------------------------------------------------- */
  messages: {
    // Mostrato a chi viene SQUALIFICATO durante il form.
    disqualified: {
      title: "Grazie, ma non è la selezione giusta per te.",
      body: "Per questa ricerca cerchiamo un profilo diverso. Ti ringraziamo per il tempo che ci hai dedicato e ti auguriamo il meglio."
    },
    // Mostrato a chi COMPLETA con successo tutta la candidatura (thank you page).
    success: {
      title: "Candidatura ricevuta.",
      body: "La tua candidatura è arrivata ed entra nella selezione. Se il tuo profilo è in linea, il prossimo step è un colloquio video conoscitivo con il direttore: verrai ricontattato per organizzarlo. Adesso tocca a noi leggerti con attenzione."
    },
    // Mostrato se l'invio all'endpoint fallisce (es. rete assente).
    error: {
      title: "Qualcosa è andato storto.",
      body: "Non siamo riusciti a inviare la candidatura. Controlla la connessione e riprova tra poco."
    }
  },

  /* -----------------------------------------------------------------------
     4) SCHERMATA DI APERTURA DEL FORM
     ----------------------------------------------------------------------- */
  intro: {
    title: "Diventa uno dei nostri 2 venditori",
    subtitle: "Compila il form e candidati alla selezione.",
    startButton: "Inizia"
  },

  /* Etichette dei bottoni di navigazione (le puoi cambiare) */
  labels: {
    next: "Avanti",
    back: "Indietro",
    submit: "Invia candidatura",
    sending: "Invio in corso…"
  }
};

/* =========================================================================
   5) LE DOMANDE  (una per schermata, nell'ordine in cui compaiono)
   -------------------------------------------------------------------------
   Ogni domanda ha un "type" che decide come si comporta:

     "name"      -> due campi: Nome e Cognome
     "number"    -> campo numerico (usato per l'età; usa la soglia qui sopra)
     "email"     -> email con validazione del formato
     "phone"     -> prefisso + numero
     "choice"    -> bottoni Sì / No (o le opzioni che metti in "options")
     "select"    -> menu a tendina (opzioni in "options")
     "textarea"  -> risposta aperta

   COME SI SQUALIFICA:
     - Per le domande "choice"/"select": aggiungi "disqualifyOn" con la lista
       dei valori che squalificano.  Esempio:  disqualifyOn: ["No"]
     - Per l'età: la squalifica è automatica in base a SETTINGS.ageMin/ageMax.
     - Le domande aperte (textarea) NON squalificano mai: servono solo a
       valutare chi chiamare al colloquio.
     - Per NON far squalificare una domanda, togli "disqualifyOn" (o mettilo []).
   ========================================================================= */
const QUESTIONS = [

  {
    id: "nome_cognome",
    type: "name",
    question: "Come ti chiami?",
    required: true
  },

  {
    id: "eta",
    type: "number",
    question: "Quanti anni hai?",
    subtitle: "", // la soglia è gestita da SETTINGS.ageMin / ageMax
    required: true,
    disqualifyByAge: true, // squalifica in automatico se fuori range
    min: 14,
    max: 99
  },

  {
    id: "email",
    type: "email",
    question: "Qual è la tua email?",
    required: true
  },

  {
    id: "telefono",
    type: "phone",
    question: "E il tuo numero di telefono?",
    required: true
  },

  {
    id: "esperienza_si_no",
    type: "choice",
    question: "Hai già esperienza come venditore?",
    options: ["Sì", "No"],
    required: true,
    disqualifyOn: ["No"]        // <-- "No" SQUALIFICA
  },

  {
    id: "esperienza_racconto",
    type: "textarea",
    question: "Raccontaci la tua esperienza da venditore.",
    subtitle: "Da quanto tempo lo fai, che esperienze hai avuto e che risultati hai ottenuto. Se non hai esperienza scrivi “Non ho ancora esperienza”.",
    required: true
  },

  {
    id: "formazione",
    type: "textarea",
    question: "Hai già studiato vendita prima d'ora? Da quali formatori o autori?",
    subtitle: "Corsi, eventi, libri, formatori, o qualunque cosa ritieni utile farci sapere.",
    required: false
  },

  {
    id: "strumenti",
    type: "choice",
    question: "Sai già usare i principali strumenti di lavoro di un venditore, o impareresti in fretta?",
    subtitle: "Ad esempio CRM, Google Sheet, calendari, Slack.",
    options: ["Sì", "No"],
    required: true
    // Nessun disqualifyOn: questa domanda NON squalifica, serve a valutare.
  },

  {
    id: "attrezzatura",
    type: "choice",
    question: "Hai già un computer, una buona connessione internet e un telefono da usare per lavorare?",
    options: ["Sì", "No"],
    required: true,
    disqualifyOn: ["No"]        // <-- "No" SQUALIFICA
  },

  {
    id: "full_time",
    type: "select",
    question: "Sei disponibile a lavorare full-time solo con noi?",
    subtitle: "Cerchiamo SOLO persone disponibili full time, in esclusiva.",
    options: [
      "Sì, ho disponibilità full-time",
      "No, non sono disponibile (NON INVIARE)"
    ],
    required: true,
    disqualifyOn: ["No, non sono disponibile (NON INVIARE)"]   // <-- SQUALIFICA
  },

  {
    id: "motivazione",
    type: "textarea",
    question: "Cosa ti ha convinto a candidarti per lavorare con noi?",
    subtitle: "Qualunque motivo: economico, di crescita, di ruolo…",
    required: true
  },

  {
    id: "obiettivi",
    type: "textarea",
    question: "Che obiettivi vuoi raggiungere lavorando con noi? Dove vuoi essere nei prossimi anni?",
    required: true
  },

  {
    id: "perche_te",
    type: "textarea",
    question: "Perché dovremmo scegliere te?",
    subtitle: "Cosa ti renderà una figura chiave del nostro gruppo in futuro?",
    required: true
  }

];

/* Esposizione globale (usato da app.js) */
window.OC = { SETTINGS, QUESTIONS };
