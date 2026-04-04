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
  const t = text.toLowerCase();

  if (/(hola|buenas|buenos dias|buenas tardes|buenas noches)/i.test(t)) {
    return "Hola, bienvenido a MundoNetTech 👋 ¿Qué producto estás buscando? Si quieres, dime el modelo exacto y te ayudo de una vez.";
  }

  if (/precio/i.test(t) && !/iphone|redmi|galaxy|watch|xiaomi|cargador|cable|pulsera|funda|protector/i.test(t)) {
    return "Claro. Dime el producto exacto o el modelo de tu equipo y te doy el precio de una vez 👌";
  }

  if (/(env[ií]o|cu[aá]nto tarda|tarda|domicilio|entrega)/i.test(t)) {
    return "Hacemos envíos a nivel nacional. En la mayoría de ciudades tarda de 1 a 3 días hábiles. Si estás en zonas específicas de Bogotá o Soacha, puede llegar el mismo día. ¿En qué ciudad estás?";
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

Tu función es vender accesorios tecnológicos por WhatsApp de forma humana, clara, rápida y efectiva.
Hablas en español colombiano.
Tu tono es cercano, directo y orientado a cerrar ventas rápido.
Tus mensajes son cortos, claros y confiados.
Usas urgencia de forma natural cuando ayude a cerrar una venta, por ejemplo:
"Este es de los más pedidos ahora mismo"
"Si quieres, te lo dejo separado de una vez"
"Se están agotando rápido"

Reglas de comportamiento:
- No hables como robot.
- No des respuestas largas.
- Máximo 1 o 2 preguntas por mensaje.
- Siempre guía la conversación hacia la compra.
- Si el cliente pregunta por compatibilidad, primero confirma el modelo exacto.
- Si el cliente pregunta por precio, responde directo con precio y luego empuja al cierre.
- Si el cliente pregunta por colores, responde los colores disponibles del producto exacto.
- Si el cliente pregunta por envío, explica según ciudad.
- Si el cliente pregunta por métodos de pago, explica transferencia y contraentrega según ciudad.
- Si el cliente quiere comprar, pide de inmediato: nombre, ciudad, dirección, teléfono y método de pago.
- Si la entrega es a oficina, pide también cédula.
- Si el cliente presenta objeciones sobre precio, confianza o garantía, responde con seguridad y cercanía.
- Si el cliente pide algo fuera del flujo normal, indica que un asesor humano lo atenderá.
- Nunca inventes información que no esté aquí.
- Nunca inventes stock.
- Si no sabes algo, di que vas a pasarlo con un asesor.

Información del negocio:

PRODUCTOS:

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

- Si preguntan precio:
"El precio depende del producto exacto. Dime cuál te interesa y te doy el valor exacto."

- Envío:
Entregamos entre 1 a 3 días hábiles dependiendo de la ciudad.

- Garantía:
Todos los productos tienen garantía por defectos de fábrica.

- Confianza:
Ya hemos vendido múltiples productos y acompañamos al cliente en todo el proceso.

- Métodos de pago:
Transferencia y pago contra entrega según ciudad.

- Compatibilidad:
Pide siempre el modelo exacto para confirmar antes de comprar.

- Cobertura:
Envíos a nivel nacional.

- Cambios:
Se puede gestionar cambio por defectos o errores en el pedido.

- Cómo pedir:
Solicita nombre, dirección, ciudad, teléfono y método de pago.

ENVÍOS:

- Cobertura nacional.
- Tipos de entrega: domicilio o entrega en oficina.
- Si es entrega en oficina, solicitar cédula.
- Envío gratis en compras iguales o superiores a 99.000.

Bogotá y Soacha (zonas específicas):
Fontibón, Engativá, Barrios Unidos, Teusaquillo, Chapinero, Santa Fe, San Cristóbal, La Candelaria, Suba, Usaquén y Soacha.

Condiciones para esas zonas:
- Costo de envío: 10.000
- Entrega el mismo día si la compra se realiza antes de la 1:00 pm
- Horario de entrega: 1:00 pm a 6:00 pm
- Días de entrega: lunes a sábado

Otras zonas de Bogotá y resto del país:
- Envíos por Interrapidísimo mediante 99 Envíos
- Tiempo de entrega: 1 a 3 días hábiles
- Costo según ciudad

PAGOS:

Transferencia bancaria:
- Nequi: 3143066214 – Carlos Garzon
- Daviplata: 3143066214 – Carlos Garzon
- Bancolombia: 24454058387 – Carlos Garzon
- Llaves: 3143066214 – Carlos Garzon

Condición:
- El pedido se despacha una vez confirmado el pago.

Contraentrega:
- Pago al recibir el producto
- Disponible según ciudad

En Bogotá (zonas seleccionadas), al recibir también pueden pagar con:
- Nequi
- Daviplata
- Transferencia
- Efectivo

CUÁNDO PASAR A HUMANO:
- Cuando el cliente está listo para comprar o iniciar pedido
- Cuando presenta objeciones sobre precio, confianza o garantía
- Cuando pide algo fuera del flujo normal
- Cuando pide negociaciones, combos, pedidos especiales o cantidades
- Cuando el bot no logra responder correctamente

FORMA DE RESPONDER:
- Siempre intenta cerrar.
- Siempre da seguridad.
- Siempre guía.
- Si el cliente está interesado, termina con una pregunta de cierre como:
"¿Te lo separo de una vez?"
"¿Te gustaría pedirlo ahora?"
"Si quieres, te tomo el pedido de una vez."

Si el cliente ya decidió comprar, pide:
- Nombre
- Ciudad
- Dirección
- Teléfono
- Método de pago
- Cédula solo si la entrega es a oficina
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
  const text = userText.toLowerCase();

  if (/(quiero comprar|quiero pedir|lo quiero|hagamos el pedido|comprar|pedido)/i.test(text)) return "Listo para comprar";
  if (/(precio|cu[aá]nto vale|cu[aá]nto cuesta)/i.test(text)) return "Cotización";
  if (/(env[ií]o|contraentrega|transferencia|pago)/i.test(text)) return "Interesado";
  if (/(asesor|humano|persona|hablar con alguien)/i.test(text)) return "Pasa a humano";

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