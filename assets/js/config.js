/* =====================================================================
   CLUB SETTINGS — the only file most updates need.
   Fill in the values marked TODO when the club sends them.
   Anything left empty is hidden or replaced by a sensible fallback.
   ===================================================================== */
window.AOK_CONFIG = {
  // Forms are delivered by Web3Forms (web3forms.com). Each address has its own
  // access key, created while logged in to Web3Forms with that address.
  // The keys are meant to be public; the email addresses below are only shown
  // on the site and used as a fallback link if sending fails.
  formKeys: {
    info: "08a75b60-83af-4438-b8b5-dcb7a17bd735",     // info@aokoropiou.gr: Contact form
    sales: "ee21bd44-d1ef-41e1-b7e1-d5d18564f1ed",    // sales@aokoropiou.gr: tickets, sponsorship, store
    academy: "935adb60-6cfb-4ae9-9052-49e49344e091"   // academy@aokoropiou.gr: Academy form and Academy questions
  },

  // Email shown for general contact (Contact form, except Academy questions).
  clubEmail: "info@aokoropiou.gr",

  // Email shown for season tickets, sponsorship and store orders.
  salesEmail: "sales@aokoropiou.gr",

  // Email shown for everything about the Academy.
  academyEmail: "academy@aokoropiou.gr",

  // Contact details shown on the site (TODO)
  phone: "+30 699 697 1765",
  mobile: "",           // optional second number
  address: { el: "Γήπεδο «Αντώνης Πρίφτης», Κορωπί 194 00", en: "Antonis Priftis Stadium, Koropi 194 00, Greece" },
  officeHours: { el: "Δευτέρα–Παρασκευή, 18:00–21:00", en: "Monday–Friday, 18:00–21:00" },

  // Social media — leave "" to hide an icon
  social: {
    facebook: "https://www.facebook.com/aokoropiou/",
    instagram: "https://www.instagram.com/ao_koropi_1903",
    youtube: "",
    tiktok: ""
  },

  // EPSANA pages for results and standings (open in a new tab).
  // At the start of each season, change the number at the end of both links
  // (and league_id in data/epsana-config.json).
  epsanaResults: "https://www.epsana.gr/results/display_schedule.php?league_id=749",
  epsanaStandings: "https://www.epsana.gr/results/display_ranking.php?league_id=749",

  // Online store: paste a link to an external shop if the club opens one
  // (e.g. a Shopify or Viva Wallet page). Empty = products in data/store.json
  // are shown with an order form that emails salesEmail.
  storeUrl: "",

  // Season tickets: paste the payment/booking page link (Viva Wallet,
  // Stripe Payment Link, more.com, etc.). Empty = request form that emails salesEmail.
  seasonTicketUrl: "",

  // Set to true once the club confirms the prices below (removes the "indicative prices" note).
  ticketPricesConfirmed: false,

  // Season-ticket packages shown on tickets.html. Prices in euro. (TODO: confirm)
  seasonTickets: [
    { id: "adult",   el: "Ενήλικες", en: "Adults",            price: 50, featured: true,
      desc: { el: "Όλοι οι εντός έδρας αγώνες πρωταθλήματος.", en: "Every home league match." } },
    { id: "concession", el: "Μειωμένο", en: "Concession",     price: 30,
      desc: { el: "Φοιτητές, άνεργοι, άνω των 65.", en: "Students, unemployed, over-65s." } },
    { id: "family",  el: "Οικογενειακό", en: "Family",        price: 90,
      desc: { el: "Δύο ενήλικες και έως δύο παιδιά.", en: "Two adults and up to two children." } },
    { id: "kids",    el: "Παιδιά έως 12", en: "Children under 12", price: 0,
      desc: { el: "Δωρεάν είσοδος με συνοδό.", en: "Free entry with an adult." } }
  ],

  // Donations — bank transfer details (TODO). Section appears once iban is set.
  bank: {
    beneficiary: "ΑΘΛΗΤΙΚΟΣ ΟΜΙΛΟΣ ΚΟΡΩΠΙ 1903",
    bankName: "",
    iban: "",
    bic: ""
  },
  // Optional card/Apple Pay/Google Pay donation page that pays into the
  // same bank account (Viva Wallet "Smart Checkout", Stripe Payment Link,
  // PayPal Donate button link). Empty = button hidden.
  donateUrl: "",

  // Shown in footers and structured data
  siteUrl: "https://aokoropiou.gr"
};
