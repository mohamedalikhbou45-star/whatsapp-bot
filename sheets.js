// ============================================================
// sheets.js — Append rows to Google Sheets
// ============================================================

const { google } = require("googleapis");

let sheetsClient = null;

/**
 * Initialize the Google Sheets API client
 */
function getClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

/**
 * Append one applicant's answers as a new row
 *
 * @param {Object} answers — { sachkunde, erfahrung, bereiche, ... }
 * @param {string} phone   — WhatsApp phone number
 */
async function appendRow(answers, phone) {
  const sheets = getClient();
  const now = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  const row = [
    now,                         // A — Datum
    phone,                       // B — Telefonnummer
    answers.sachkunde || "",     // C — Sachkundeprüfung §34a
    answers.erfahrung || "",     // D — Bereits gearbeitet
    answers.bereiche || "",      // E — Erfahrungsbereiche
    answers.fuehrerschein || "", // F — Führerschein B
    answers.schichtdienst || "", // G — Schichtdienst
    answers.antritt || "",       // H — Stellenantritt
    answers.telefon_ok || "",    // I — Telefonisch OK
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Bewerbungen!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  console.log(`✅ Row appended for ${phone}`);
}

/**
 * Create headers if the sheet is empty
 */
async function ensureHeaders() {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Bewerbungen!A1:I1",
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Bewerbungen!A1:I1",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "Datum",
            "Telefonnummer",
            "Sachkundeprüfung §34a",
            "Bereits gearbeitet",
            "Erfahrungsbereiche",
            "Führerschein B",
            "Schichtdienst",
            "Stellenantritt",
            "Telefonisch OK",
          ],
        ],
      },
    });
    console.log("📋 Headers created in Google Sheet");
  }
}

module.exports = { appendRow, ensureHeaders };
