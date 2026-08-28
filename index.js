require("dotenv").config();
const express = require("express");
const { STEPS, FINAL_MESSAGE, FINAL_MESSAGE_NO_CALL } = require("./flow");
const { sendText, sendStep } = require("./whatsapp");
const { appendRow, ensureHeaders, phoneExists } = require("./sheets");

const app = express();

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

const sessions = new Map();

const ALREADY_DONE_MESSAGE =
  "Du hast den Fragebogen bereits ausgefüllt. ✅\n\n" +
  "Deine Bewerbung wird bearbeitet. Wir melden uns bei dir!";

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  console.log("📨 Webhook POST received:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("ℹ️ No message in payload");
      return;
    }

    const phone = message.from;
    const msgBody = extractBody(message);
    console.log(`📩 Message from ${phone}: "${msgBody}" (type: ${message.type})`);

    // --- DUPLICATE CHECK (permanent — checks Google Sheet) ---
    if (!sessions.has(phone)) {
      const alreadyExists = await phoneExists(phone);
      if (alreadyExists) {
        console.log(`🔁 User ${phone} already in Google Sheet. Sending duplicate message.`);
        await sendText(phone, ALREADY_DONE_MESSAGE);
        return;
      }
    }

    // Get or create session
    if (!sessions.has(phone)) {
      sessions.set(phone, { step: 0, answers: {} });
      console.log(`🆕 New session for ${phone}, sending step 0`);
      await sendStep(phone, STEPS[0]);
      return;
    }

    const session = sessions.get(phone);
    const currentStep = STEPS[session.step];
    console.log(`📋 Session step ${session.step} (${currentStep.id}) for ${phone}`);

    let answer = msgBody;

    if (currentStep.type === "button") {
      const valid = currentStep.buttons.map((b) => b.toLowerCase());
      if (!valid.includes(msgBody.toLowerCase())) {
        if (currentStep.id === "antritt" && msgBody.toLowerCase() === "später") {
          answer = "Später";
        } else {
          console.log(`⚠️ Invalid button answer: "${msgBody}"`);
          await sendText(phone, `Bitte wähle eine der Optionen: ${currentStep.buttons.join(", ")}`);
          return;
        }
      }
    }

    if (currentStep.type === "text" && currentStep.parse) {
      const parsed = currentStep.parse(msgBody);
      if (!parsed) {
        console.log(`⚠️ Invalid text answer: "${msgBody}"`);
        await sendText(phone, currentStep.errorMessage || "Ungültige Eingabe.");
        return;
      }
      answer = parsed;
    }

    session.answers[currentStep.id] = answer;
    session.step++;
    console.log(`✅ Answer saved: ${currentStep.id} = "${answer}"`);

    if (session.step < STEPS.length) {
      console.log(`➡️ Sending step ${session.step}`);
      await sendStep(phone, STEPS[session.step]);
    } else {
      console.log(`🏁 Conversation complete for ${phone}`);
      const finalMsg = session.answers.telefon_ok?.toLowerCase() === "ja" ? FINAL_MESSAGE : FINAL_MESSAGE_NO_CALL;
      await sendText(phone, finalMsg);
      await appendRow(session.answers, phone);
      sessions.delete(phone);
    }
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
});

function extractBody(message) {
  if (message.type === "interactive") return message.interactive?.button_reply?.title || "";
  if (message.type === "text") return message.text?.body || "";
  return "";
}

app.get("/", (req, res) => {
  res.send("🤖 WhatsApp Bewerbungsbot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 PHONE_ID: ${process.env.WHATSAPP_PHONE_ID}`);
  console.log(`🔑 TOKEN starts with: ${process.env.WHATSAPP_TOKEN?.substring(0, 10)}...`);
  try { await ensureHeaders(); } catch (err) { console.warn("⚠️ Sheet headers:", err.message); }
});
