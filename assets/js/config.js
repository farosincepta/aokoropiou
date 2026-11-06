/* =====================================================================
   ΑΕ ΔΟΞΑ ΚΟΡΩΠΙΟΥ — settings
   Most day-to-day changes only need this file. Empty values are hidden.
   ===================================================================== */
window.DOXA = {
  // Web3Forms access keys (web3forms.com). A key sends to the email address
  // that was logged in when the key was created.
  // TODO: create one key while logged in as igix88@outlook.com and paste it
  // into all three slots. The keys below are temporary placeholders.
  forms: {
    general: "08a75b60-83af-4438-b8b5-dcb7a17bd735",   // contact form
    office: "ee21bd44-d1ef-41e1-b7e1-d5d18564f1ed",    // tickets, sponsorship, store
    academy: "935adb60-6cfb-4ae9-9052-49e49344e091"    // Academy registration
  },

  // Addresses shown on the site and used as a fallback if sending fails
  email: "igix88@outlook.com",
  officeEmail: "igix88@outlook.com",
  academyEmail: "igix88@outlook.com",

  phone: "697 665 3272",
  area: { el: "Κορωπί, Αττική", en: "Koropi, Attica" },
  homeGround: { el: "Γήπεδο «Αντώνης Πρίφτης», Κορωπί", en: "Antonis Priftis Stadium, Koropi" },
  hours: { el: "", en: "" },          // e.g. { el: "Δευτέρα–Παρασκευή 18:00–21:00", en: "Monday–Friday 18:00–21:00" }

  social: {
    facebook: "https://www.facebook.com/doxakoropi",
    instagram: "https://www.instagram.com/doxakoropi/"
  },

  // EPSANA pages, opened in a new tab. Change the number each season
  // (and league_id in data/epsana-config.json).
  epsanaSchedule: "https://www.epsana.gr/results/display_schedule.php?league_id=748",
  epsanaTable: "https://www.epsana.gr/results/display_ranking.php?league_id=748",

  // Optional external shop link. Empty = products from data/store.json with an order form.
  shopUrl: "",

  // Season tickets. Paste a payment link to replace the request form.
  ticketUrl: "",
  pricesConfirmed: false,             // true removes the "indicative prices" note
  tickets: [
    { id: "adult", name: { el: "Ενήλικες", en: "Adults" }, price: 40, best: true,
      text: { el: "Όλοι οι εντός έδρας αγώνες πρωταθλήματος στο «Αντώνης Πρίφτης».", en: "Every home league match at the Antonis Priftis." } },
    { id: "reduced", name: { el: "Μειωμένο", en: "Reduced" }, price: 25,
      text: { el: "Φοιτητές, άνεργοι και άνω των 65.", en: "Students, unemployed and over-65s." } },
    { id: "family", name: { el: "Οικογένεια", en: "Family" }, price: 70,
      text: { el: "Δύο ενήλικες και έως δύο παιδιά.", en: "Two adults and up to two children." } },
    { id: "kids", name: { el: "Παιδιά έως 12", en: "Under-12s" }, price: 0,
      text: { el: "Δωρεάν, με συνοδό.", en: "Free with an adult." } }
  ],

  // Donations. The bank box appears once iban is filled in.
  bank: { holder: "Α.Ε. ΔΟΞΑ ΚΟΡΩΠΙΟΥ", bank: "", iban: "", bic: "" },
  donateUrl: "",

  site: "https://aokusatsc.com"
};
