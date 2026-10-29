const { google } = require("googleapis");

let sheetsClient = null;

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
 * Check if a phone number already exists in the sheet
 */
async function phoneExists(phone) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Bewerbungen!B:B",
  });
  const rows = res.data.values || [];
  // Check every row in column B (phone numbers)
  for (const row of rows) {
    if (row[0] && row[0].replace(/\D/g, "") === phone.replace(/\D/g, "")) {
      return true;
    }
  }
  return false;
}

/**
 * Append one applicant's answers as a new row
 */
async function appendRow(answers, phone) {
  // Double-check for duplicates before writing
  const exists = await phoneExists(phone);
  if (exists) {
    console.log("⚠️ Phone already in sheet — skipping duplicate");
    return false;
  }

  const sheets = getClient();
  const now = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

  const row = [
    now,
    phone,
    answers.sachkunde || "",
    answers.erfahrung || "",
    answers.bereiche || "",
    answers.fuehrerschein || "",
    answers.schichtdienst || "",
    answers.antritt || "",
    answers.telefon_ok || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Bewerbungen!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });

  console.log("✅ Row appended to Google Sheet");
  return true;
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

module.exports = { appendRow, ensureHeaders, phoneExists };
