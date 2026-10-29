const axios = require("axios");

const API_URL = "https://graph.facebook.com/v19.0";

/**
 * Send a plain text message
 */
async function sendText(to, text) {
  const url = `${API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Send an interactive message with reply buttons (max 3)
 */
async function sendButtons(to, bodyText, buttons) {
  const url = `${API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((label, i) => ({
            type: "reply",
            reply: {
              id: `btn_${i}`,
              title: label.substring(0, 20), // WhatsApp max 20 chars
            },
          })),
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Send the right message type based on the step
 */
async function sendStep(to, step) {
  if (step.type === "button") {
    let msg = step.message;
    if (step.extraNote) msg += `\n\n${step.extraNote}`;
    await sendButtons(to, msg, step.buttons);
  } else {
    await sendText(to, step.message);
  }
}

module.exports = { sendText, sendButtons, sendStep };
