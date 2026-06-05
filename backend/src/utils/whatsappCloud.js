function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function sendWhatsAppText({ to, message }) {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  const recipient = normalizePhone(to);

  if (!token || !phoneNumberId || !recipient || !message) {
    return { skipped: true };
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { skipped: false, sent: false, error: data.error?.message || "WhatsApp notification failed" };
  }

  return { skipped: false, sent: true, response: data };
}

export async function sendWhatsAppTextToMany({ recipients = [], message }) {
  const uniqueRecipients = [...new Set(recipients.map(normalizePhone).filter(Boolean))];

  if (!uniqueRecipients.length) {
    return { skipped: true, results: [] };
  }

  const results = await Promise.all(
    uniqueRecipients.map(async (recipient) => ({
      recipient,
      result: await sendWhatsAppText({ to: recipient, message })
    }))
  );

  return {
    skipped: results.every((item) => item.result.skipped),
    sent: results.some((item) => item.result.sent),
    results
  };
}
