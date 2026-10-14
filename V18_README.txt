AOK VERSION 18 — FIVE LANGUAGE SITE / GIVING / INSTALLATION

WHAT WORKS
- All five language pages retained.
- Prominent sponsorship links on home and Support pages.
- Seven needs, inquiry forms for money, items, services, volunteering, anonymous preference.
- Approved-only public progress data and sponsor history templates.
- iPhone Add to Home Screen and Android install guidance in all five languages.
- The website is still a PWA, NOT an App Store app. iOS has no automatic install prompt.

CLUB ACTIONS REQUIRED
1. Edit giving-public-data.json ONLY with verified, club-approved public records.
2. To publish a need, set approved=true, supply target_eur and secured_eur, dates, progress_updates, outcome_report as appropriate. Never put private donor details here.
3. To publish a sponsor, append to sponsors with approved=true and publication_consent_recorded=true ONLY after documented, specific consent. Fields: public_name, description, contributions (each approved=true, date, need, type, outcome; amount_eur only when amount_public_consent=true). Never publish minors' images without appropriate permission.
4. Provide payment provider and merchant setup; no card payments are active.
5. Provide accounting/legal procedures for receipts, data retention, access control, GDPR rights and secure submission processing. Current forms use third-party FormSubmit and need activation, verification, club-approved privacy notice and service review BEFORE accepting live personal information.
6. Test on real iPhone Safari and Android Chrome; website cannot install automatically on iOS.
7. Replace demo match and club information with official data before launch.

Deploy all ZIP contents to GitHub Pages repository root. Preserve CNAME.
