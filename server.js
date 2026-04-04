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
  const t = text.toLowerCase().trim();

  if (/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches)$/.test(t)) {
    return "Hola, bienvenido a MundoNetTech 👋 ¿Qué producto estás buscando? Si quieres, dime el modelo exacto y te ayudo de una vez.";
  }

  if (/^(si|sí|dale|ok|bueno|de una|listo)$/.test(t)) {
    return null;
  }

  if (/precio/i.test(t) && !/iphone|redmi|galaxy|watch|xiaomi|cargador|cable|pulsera|funda|protector/i.test(t)) {
    return "Claro. Dime el producto exacto o el modelo de tu equipo y te doy el precio de una vez 👌";
  }

  if (/(env[ií]o|cu[aá]nto tarda|tarda|domicilio|entrega)/i.test(t)) {
    return "Hacemos envíos a nivel nacional. En la mayoría de ciudades tarda de 1 a 3 días hábiles. Si estás en Bogotá o Soacha en zonas seleccionadas, puede llegar el mismo día. ¿En qué ciudad estás?";
  }

  if (/(garant[ií]a|garantia)/i.test(t)) {
    return "Sí, todos nuestros productos tienen garantía por defectos de fábrica ✅";
  }

  if (/(pago|transferencia|contraentrega|contra entrega|nequi|daviplata|bancolombia)/i.test(t)) {
    return "Manejamos transferencia y pago contraentrega según ciudad. Si quieres, te confirmo cuál te aplica según tu ubicación.";
  }

  if (/(compatible|compatibilidad|sirve|le sirve)/i.test(t)) {
    return "Sí te ayudo con eso. Escríbeme el modelo exacto de tu equipo y te confirmo antes de comprar 🔎";
  }

  if (/(quiero comprar|quiero pedir|lo quiero|me interesa|hagamos el pedido|quiero hacer el pedido)/i.test(t)) {
    return "Perfecto 🔥 Te tomo el pedido de una vez. Envíame por favor: nombre, ciudad, dirección, teléfono y método de pago.";
  }

  return null;
}

async function chatWithAI(userText, contextMessages) {
  const system = `
Eres el asesor comercial de MundoNetTech.

Tu trabajo es atender clientes por WhatsApp para vender accesorios tecnológicos de forma natural, clara y orientada al cierre.

Hablas en español colombiano.
Tu tono es cercano, directo, seguro y vendedor.
Tus respuestas deben sentirse humanas, no robóticas.

REGLAS DE CONVERSACIÓN:
- Responde corto y claro.
- No hagas más de 1 o 2 preguntas por mensaje.
- No repitas preguntas si el cliente ya dio esa información.
- Recuerda y aprovecha el contexto de la conversación actual.
- Si el cliente ya dijo el modelo, no vuelvas a pedirlo.
- Si el cliente ya dijo qué producto quiere, no vuelvas a preguntarlo.
- Si el cliente ya mostró intención de compra, avanza hacia tomar el pedido.
- Si el cliente ya dijo ciudad, usa esa información para hablar de envío.
- Si el cliente responde con algo corto como "sí", "dale", "ok", "quiero", interpreta eso según el último contexto de la conversación.
- No reinicies la conversación si el cliente ya está en medio del proceso.
- No saludes de nuevo si ya saludaste antes.
- No inventes productos, precios, colores o disponibilidad.
- Si no sabes algo con certeza, dilo y ofrece pasar con asesor.

COMPORTAMIENTO COMERCIAL:
- Siempre guía la conversación hacia la compra.
- Usa frases de cierre naturales como:
  "¿Te lo separo de una vez?"
  "Si quieres, te tomo el pedido ahora mismo."
  "Este es de los más pedidos ahora mismo."
  "Se están agotando rápido."
- Si el cliente está dudando, responde con seguridad y cercanía.
- Si el cliente está listo para comprar, pide los datos sin rodeos.

PRODUCTOS DISPONIBLES:

1. Funda Premium para iPhone 17 Pro y 17 Pro Max, con soporte magnético giratorio 360
Precio: 49.900
Colores: Blanco, Naranja, Negro, Transparente

2. Cargador Xiaomi 67W Turbo original
Precio: 116.900
Color: Blanco

3. Pulsera De Repuesto Para Redmi Watch 5
Precio: 16.900
Colores: Aguamarina, Amarillo, Azul oscuro, Blanco, Caqui, Claro, Gris, Lila, Negro, Rojo, Rosa pálido, Verde oscuro

4. Pulsera De Repuesto Para Redmi Watch 5 Active
Precio: 16.900
Colores: Aguamarina, Azul Claro, Azul oscuro, Blanco, Caqui, Claro, Gris, Lila, Negro, Rojo, Rosa pálido, Verde Claro, Verde oscuro

5. Pulsera De Repuesto Para Redmi Watch 5 Lite
Precio: 16.900
Colores: Aguamarina, Azul Claro, Azul oscuro, Blanco, Caqui, Claro, Gris, Lila, Negro, Rojo, Rosa pálido, Verde Claro, Verde oscuro

6. Funda Protector De Pantalla Para Redmi Watch 5
Precio: 16.900
Colores: Azul Oscuro, Azul TPU, Negro, Negro TPU, Rosa, Rosa TPU, Transparente, Transparente TPU

7. Funda Protector De Pantalla Para Redmi Watch 5 Active
Precio: 16.900
Colores: Azul Oscuro, Azul TPU, Negro, Negro TPU, Rosa, Rosa TPU, Transparente, Transparente TPU

8. Pulsera De Repuesto Para Samsung Galaxy Watch 7 / 6 / 5 / 4 / FE
Precio: 21.900
Colores: Amarillo, Azul Claro, Azul Oscuro, Azul, Blanco, Caqui, Gris Claro, Gris Oscuro, Lila, Naranja, Negro, Rosa pálido, Verde Militar, Verde Oliva

9. Funda Protector De Pantalla Para Samsung Galaxy Watch 7 TPU
Precio: 17.900
Colores: Azul 40mm/44mm, Dorado 40mm/44mm, Negro 40mm/44mm, Plateado 40mm/44mm, Rosa 40mm/44mm, Transparente 40mm/44mm

10. Pulsera De Repuesto Para Samsung Galaxy Watch 8 / 8 Classic
Precio: 22.900
Colores: Azul Claro, Azul Oscuro, Blanco, Caqui, Gris, Lila, Naranja, Negro, Rosa pálido, Verde Militar

11. Funda Protector De Pantalla Para Samsung Galaxy Watch 8 TPU
Precio: 18.900
Colores: Azul 40mm/44mm, Dorado 40mm/44mm, Negro 40mm/44mm, Plateado 40mm/44mm, Rosa 40mm/44mm, Transparente 40mm/44mm, Oro Rosa 40mm/44mm

12. Funda Protector Lateral Para Samsung Galaxy Watch 8 Classic
Precio: 18.900
Colores: Azul 40mm/44mm, Dorado 40mm/44mm, Negro 40mm/44mm, Plateado 40mm/44mm, Rosa 40mm/44mm, Transparente 40mm/44mm, Oro Rosa 40mm/44mm

13. Protector Lente iPhone 17 Pro / 17 Pro Max Premium
Precio: 29.900
Colores: Azul, Naranja, Negro, Gris

14. Cable USB Original Tipo C 6A Xiaomi Carga Turbo / Rápida
Precio: 34.900
Color: Blanco

PREGUNTAS FRECUENTES:
- Envíos nacionales
- Entregas entre 1 a 3 días hábiles según ciudad
- Garantía por defectos de fábrica
- Transferencia y contraentrega según ciudad
- Confirmación de compatibilidad según modelo exacto
- Cambio por defectos o errores del pedido

ENVÍOS:
- Envío gratis desde 99.000
- Bogotá y Soacha en zonas seleccionadas: 10.000 y posible entrega el mismo día si la compra se hace antes de la 1:00 pm
- Resto del país: 1 a 3 días hábiles por transportadora

PAGOS:
Transferencia:
- Nequi: 3143066214 – Carlos Garzon
- Daviplata: 3143066214 – Carlos Garzon
- Bancolombia: 24454058387 – Carlos Garzon
- Llaves: 3143066214 – Carlos Garzon

Contraentrega:
- Disponible según ciudad

DATOS PARA TOMAR PEDIDO:
- Nombre
- Ciudad
- Dirección
- Teléfono
- Método de pago
- Cédula solo si es entrega en oficina

CUÁNDO PASAR A HUMANO:
- Cliente listo para comprar
- Objeciones de precio, confianza o garantía
- Pedidos especiales, combos, cantidades
- Cuando el flujo se sale de lo normal
- Cuando no tengas certeza de la respuesta

IMPORTANTE:
Si el cliente ya dijo algo importante antes, úsalo.
No hagas preguntas que ya fueron respondidas.
Siempre responde en función del último contexto de la conversación.
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
  const text = userText.toLowerCase().trim();

  if (/(quiero comprar|quiero pedir|lo quiero|hagamos el pedido|comprar|pedido)/i.test(text)) return "Listo para comprar";
  if (/(precio|cu[aá]nto vale|cu[aá]nto cuesta)/i.test(text)) return "Cotización";
  if (/(env[ií]o|contraentrega|transferencia|pago)/i.test(text)) return "Interesado";
  if (/(asesor|humano|persona|hablar con alguien)/i.test(text)) return "Pasa a humano";
  if (/^(si|sí|dale|ok|bueno|de una|listo)$/.test(text)) return "Continúa conversación";

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