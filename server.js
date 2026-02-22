import express from "express";
import axios from "axios";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Verificación webhook (Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recibe mensajes
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const wa_id = message.from;
    const text = message?.text?.body?.trim() || "";
    const wa_name = value?.contacts?.[0]?.profile?.name || null;

    await saveMessage(wa_id, "in", text);

    // Handoff
    if (/(asesor|humano|persona|llámame)/i.test(text)) {
      const reply = "Listo. Ya te atiende un asesor. Dime tu modelo exacto y ciudad para ir adelantando.";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      await upsertLead(wa_id, wa_name, text, { stage: "Pide asesor" });
      return res.sendStatus(200);
    }

    // Reglas baratas
    const ruleReply = ruleEngine(text);
    if (ruleReply) {
      await sendWhatsAppText(wa_id, ruleReply);
      await saveMessage(wa_id, "out", ruleReply);
      await upsertLead(wa_id, wa_name, text, {});
      return res.sendStatus(200);
    }

    // IA
    const context = await getRecentContext(wa_id, 10);
    const aiReply = await chatWithAI(text, context);

    await sendWhatsAppText(wa_id, aiReply);
    await saveMessage(wa_id, "out", aiReply);
    await upsertLead(wa_id, wa_name, text, { stage: inferStage(text) });

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.sendStatus(200);
  }
});

function ruleEngine(text) {
  if (/precio/i.test(text) && !/mi band|redmi|galaxy|watch|apple/i.test(text)) {
    return "Dime el modelo exacto (ej: Mi Band 9 Active / Redmi Watch 4 / Galaxy Watch 6) y qué accesorio buscas (pulsera/funda/protector) y te doy el precio.";
  }
  if (/(env[ií]o|envios|entrega|tarda)/i.test(text)) {
    return "¿En qué ciudad y barrio estás? Con eso te confirmo tiempo exacto y si aplica contraentrega.";
  }
  if (/(pago|transferencia|contraentrega)/i.test(text)) {
    return "Manejamos transferencia y contraentrega (según ciudad/zona). ¿En qué ciudad estás?";
  }
  if (/colores?/i.test(text)) {
    return "¿Para qué modelo exacto es? Así te confirmo colores disponibles hoy.";
  }
  return null;
}

async function chatWithAI(userText, contextMessages) {
  const system = `
Eres el asesor comercial de MundoNettech. Hablas como Andrés: directo, claro, estratégico y humano.
Cambias el tono según necesidad: técnico cuando preguntan compatibilidad/calidad, cercano cuando dudan, firme cuando cierran.
No inventes stock, precio ni tiempos exactos si no están dados: pide ciudad/modelo.
Máximo 1 pregunta a la vez. Respuestas cortas. Sin emojis en exceso.
Objetivo: confirmar modelo exacto → accesorio → ciudad → pago → tomar datos y cerrar.
Si el cliente quiere comprar: pide datos completos (producto/modelo, color, ciudad+barrio, dirección, pago).
`;

  const messages = [
    { role: "system", content: system },
    ...contextMessages,
    { role: "user", content: userText }
  ];

  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-4o-mini", temperature: 0.6, messages },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  return resp.data.choices?.[0]?.message?.content?.trim() || "Dime el modelo exacto y ciudad y te ayudo.";
}

function inferStage(userText) {
  if (/(quiero|lo compro|pagar|hacer pedido|comprar)/i.test(userText)) return "Cerrando";
  if (/(precio|cu[aá]nto)/i.test(userText)) return "Cotizado";
  if (/(env[ií]o|contraentrega|transferencia)/i.test(userText)) return "Interesado";
  return "Nuevo";
}

async function sendWhatsAppText(to, body) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await axios.post(
    url,
    { messaging_product: "whatsapp", to, type: "text", text: { body } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
}

async function saveMessage(wa_id, direction, body) {
  await supabase.from("messages").insert([{ wa_id, direction, body }]);
}

async function upsertLead(wa_id, wa_name, last_message, fields) {
  const { data: existing } = await supabase.from("leads").select("id").eq("wa_id", wa_id).maybeSingle();
  const payload = { wa_id, wa_name, last_message, updated_at: new Date().toISOString(), ...fields };

  if (existing?.id) await supabase.from("leads").update(payload).eq("wa_id", wa_id);
  else await supabase.from("leads").insert([payload]);
}

async function getRecentContext(wa_id, limit = 10) {
  const { data } = await supabase
    .from("messages")
    .select("direction, body, created_at")
    .eq("wa_id", wa_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const ordered = (data || []).reverse();
  return ordered.map(m => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }));
}

app.listen(process.env.PORT || 3000, () => console.log("Bot listo"));