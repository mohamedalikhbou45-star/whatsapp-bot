// ============================================================
// index.js — WhatsApp Bewerbungsbot (Sicherheitsdienst)
// ============================================================

require("dotenv").config();
const express = require("express");
const { STEPS, FINAL_MESSAGE, FINAL_MESSAGE_NO_CALL } = require("./flow");
const { sendText, sendStep } = require("./whatsapp");
const { appendRow, ensureHeaders } = require("./sheets");

const app = express();
app.use(express.json());

// ----- In-memory session store -----
// Key: phone number, Value: { step: number, answers: {} }
// In production, replace with Redis or a database
const sessions = new Map();

// ----- Webhook verification (GET) -----
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

// ----- Incoming messages (POST) -----
app.post("/webhook", async (req, res) => {
  // Respond 200 immediately so WhatsApp doesn't retry
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return; // status update, not a message

    const phone = message.from;
    const msgBody = extractBody(message);

    console.log(`📩 ${phone}: ${msgBody}`);

    // Get or create session
    if (!sessions.has(phone)) {
      sessions.set(phone, { step: 0, answers: {} });
      // Send the first question
      await sendStep(phone, STEPS[0]);
      return;
    }

    const session = sessions.get(phone);
    const currentStep = STEPS[session.step];

    // ----- Validate & store the answer -----
    let answer = msgBody;

    if (currentStep.type === "button") {
      // Accept button reply or typed text that matches
      const valid = currentStep.buttons.map((b) => b.toLowerCase());
      if (!valid.includes(msgBody.toLowerCase())) {
        // For step "antritt" also accept "Später"
        if (currentStep.id === "antritt" && msgBody.toLowerCase() === "später") {
          answer = "Später";
        } else {
          await sendText(
            phone,
            `Bitte wähle eine der Optionen: ${currentStep.buttons.join(", ")}`
          );
          return;
        }
      }
    }

    if (currentStep.type === "text" && currentStep.parse) {
      const parsed = currentStep.parse(msgBody);
      if (!parsed) {
        await sendText(phone, currentStep.errorMessage || "Ungültige Eingabe.");
        return;
      }
      answer = parsed;
    }

    // Save answer
    session.answers[currentStep.id] = answer;
    session.step++;

    // ----- Next step or finish -----
    if (session.step < STEPS.length) {
      await sendStep(phone, STEPS[session.step]);
    } else {
      // Conversation complete → save to Google Sheets
      const finalMsg =
        session.answers.telefon_ok?.toLowerCase() === "ja"
          ? FINAL_MESSAGE
          : FINAL_MESSAGE_NO_CALL;

      await sendText(phone, finalMsg);
      await appendRow(session.answers, phone);

      // Clean up session
      sessions.delete(phone);
    }
  } catch (err) {
    console.error("❌ Error processing message:", err.message);
  }
});

// ----- Extract text from different message types -----
function extractBody(message) {
  if (message.type === "interactive") {
    // Button reply
    return message.interactive?.button_reply?.title || "";
  }
  if (message.type === "text") {
    return message.text?.body || "";
  }
  return "";
}

// ----- Health check -----
app.get("/", (req, res) => {
  res.send("🤖 WhatsApp Bewerbungsbot is running!");
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await ensureHeaders();
  } catch (err) {
    console.warn("⚠️  Could not check Google Sheet headers:", err.message);
  }
});
