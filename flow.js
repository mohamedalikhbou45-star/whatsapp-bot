const STEPS = [
  // STEP 0 — Welcome + Sachkundeprüfung
  {
    id: "sachkunde",
    message:
      "👋 Vielen Dank für deine Bewerbung bei uns!\n\n" +
      "Mit den folgenden Fragen möchten wir deine Qualifikation und deine " +
      "Einstiegsmöglichkeiten im Sicherheitsdienst einschätzen. " +
      "Die Beantwortung dauert nur etwa 2 Minuten.\n\n" +
      "Hast du die *Sachkundeprüfung nach §34a GewO*? Wir meinen den großen Schein!",
    type: "button",
    buttons: ["Ja", "Nein"],
  },

  // STEP 1 — Bereits im Sicherheitsdienst gearbeitet?
  {
    id: "erfahrung",
    message: "Hast du bereits im Sicherheitsdienst gearbeitet?",
    type: "button",
    buttons: ["Ja", "Nein"],
  },

  // STEP 2 — Erfahrungsbereiche (Mehrfachauswahl als Liste)
  {
    id: "bereiche",
    message:
      "In welchen Bereichen hast du Erfahrung?\n\n" +
      "Bitte antworte mit den *Nummern* (z.B. 1,3,5):\n\n" +
      "1️⃣ Objektschutz\n" +
      "2️⃣ Veranstaltungsschutz\n" +
      "3️⃣ Revierdienst\n" +
      "4️⃣ Empfangs- und Pfortendienst\n" +
      "5️⃣ Einzelhandel / Ladendetektiv\n" +
      "6️⃣ Flüchtlingsunterkunft\n" +
      "0️⃣ Keine Erfahrung",
    type: "text",
    parse: (input) => {
      const map = {
        1: "Objektschutz",
        2: "Veranstaltungsschutz",
        3: "Revierdienst",
        4: "Empfangs- und Pfortendienst",
        5: "Einzelhandel / Ladendetektiv",
        6: "Flüchtlingsunterkunft",
        0: "Keine Erfahrung",
      };
      const nums = input.match(/[0-6]/g) || [];
      const unique = [...new Set(nums)];
      const result = unique.map((n) => map[n]).filter(Boolean);
      return result.length > 0 ? result.join(", ") : null;
    },
    errorMessage:
      "Bitte antworte mit den Nummern (z.B. 1,3,5) oder 0 für keine Erfahrung.",
  },

  // STEP 3 — Führerschein
  {
    id: "fuehrerschein",
    message: "Besitzt du einen Führerschein der Klasse B?",
    type: "button",
    buttons: ["Ja", "Nein"],
  },

  // STEP 4 — Schichtdienst
  {
    id: "schichtdienst",
    message: "Bist du bereit, im Schichtdienst zu arbeiten?",
    type: "button",
    buttons: ["Ja", "Nein"],
  },

  // STEP 5 — Stellenantritt
  {
    id: "antritt",
    message: "Wann könntest du eine Stelle antreten?",
    type: "button",
    buttons: ["Sofort", "In 2 Wochen", "In 1 Monat"],
    // WhatsApp buttons limited to 3, so "Später" goes as a note
    extraNote: "Oder schreibe *Später* falls keines passt.",
  },

  // STEP 6 — Telefon OK?
  {
    id: "telefon_ok",
    message:
      "Vielen Dank! 🙏\n\nDeine Angaben werden geprüft.\n\n" +
      "Ist es OK, wenn ein Mitarbeiter sich zeitnah telefonisch bei dir melden wird?",
    type: "button",
    buttons: ["Ja", "Nein"],
  },
];

// Final thank-you message
const FINAL_MESSAGE =
  "Perfekt! Vielen Dank für deine Angaben. ✅\n\n" +
  "Wir melden uns in Kürze bei dir. Bis bald! 👋";

const FINAL_MESSAGE_NO_CALL =
  "Verstanden! Vielen Dank für deine Angaben. ✅\n\n" +
  "Wir werden deine Bewerbung prüfen und uns per WhatsApp bei dir melden. Bis bald! 👋";

module.exports = { STEPS, FINAL_MESSAGE, FINAL_MESSAGE_NO_CALL };
