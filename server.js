import express from "express";
import axios from "axios";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const products = [
  {
    id: "redmi-watch-5-pulsera",
    keywords: ["pulsera redmi watch 5", "correa redmi watch 5", "repuesto redmi watch 5"],
    name: "Pulsera De Repuesto Para Redmi Watch 5",
    category: "pulsera",
    model: "Redmi Watch 5",
    price: "16.900",
    colors: ["Aguamarina", "Amarillo", "Azul oscuro", "Blanco", "Caqui", "Claro", "Gris", "Lila", "Negro", "Rojo", "Rosa pálido", "Verde oscuro"]
  },
  {
    id: "redmi-watch-5-active-pulsera",
    keywords: ["pulsera redmi watch 5 active", "correa redmi watch 5 active", "repuesto redmi watch 5 active"],
    name: "Pulsera De Repuesto Para Redmi Watch 5 Active",
    category: "pulsera",
    model: "Redmi Watch 5 Active",
    price: "16.900",
    colors: ["Aguamarina", "Azul Claro", "Azul oscuro", "Blanco", "Caqui", "Claro", "Gris", "Lila", "Negro", "Rojo", "Rosa pálido", "Verde Claro", "Verde oscuro"]
  },
  {
    id: "redmi-watch-5-lite-pulsera",
    keywords: ["pulsera redmi watch 5 lite", "correa redmi watch 5 lite", "repuesto redmi watch 5 lite"],
    name: "Pulsera De Repuesto Para Redmi Watch 5 Lite",
    category: "pulsera",
    model: "Redmi Watch 5 Lite",
    price: "16.900",
    colors: ["Aguamarina", "Azul Claro", "Azul oscuro", "Blanco", "Caqui", "Claro", "Gris", "Lila", "Negro", "Rojo", "Rosa pálido", "Verde Claro", "Verde oscuro"]
  },
  {
    id: "redmi-watch-5-funda",
    keywords: ["funda redmi watch 5", "protector redmi watch 5", "funda protectora redmi watch 5"],
    name: "Funda Protector De Pantalla Para Redmi Watch 5",
    category: "funda",
    model: "Redmi Watch 5",
    price: "16.900",
    colors: ["Azul Oscuro", "Azul TPU", "Negro", "Negro TPU", "Rosa", "Rosa TPU", "Transparente", "Transparente TPU"]
  },
  {
    id: "redmi-watch-5-active-funda",
    keywords: ["funda redmi watch 5 active", "protector redmi watch 5 active", "funda protectora redmi watch 5 active"],
    name: "Funda Protector De Pantalla Para Redmi Watch 5 Active",
    category: "funda",
    model: "Redmi Watch 5 Active",
    price: "16.900",
    colors: ["Azul Oscuro", "Azul TPU", "Negro", "Negro TPU", "Rosa", "Rosa TPU", "Transparente", "Transparente TPU"]
  },
  {
    id: "galaxy-watch-7-pulsera",
    keywords: ["pulsera galaxy watch 7", "correa galaxy watch 7", "repuesto galaxy watch 7"],
    name: "Pulsera De Repuesto Para Samsung Galaxy Watch 7 / 6 / 5 / 4 / FE",
    category: "pulsera",
    model: "Samsung Galaxy Watch 7",
    price: "21.900",
    colors: ["Amarillo", "Azul Claro", "Azul Oscuro", "Azul", "Blanco", "Caqui", "Gris Claro", "Gris Oscuro", "Lila", "Naranja", "Negro", "Rosa pálido", "Verde Militar", "Verde Oliva"]
  },
  {
    id: "galaxy-watch-7-funda",
    keywords: ["funda galaxy watch 7", "protector galaxy watch 7", "funda protectora galaxy watch 7"],
    name: "Funda Protector De Pantalla Para Samsung Galaxy Watch 7 TPU",
    category: "funda",
    model: "Samsung Galaxy Watch 7",
    price: "17.900",
    colors: ["Azul 40mm/44mm", "Dorado 40mm/44mm", "Negro 40mm/44mm", "Plateado 40mm/44mm", "Rosa 40mm/44mm", "Transparente 40mm/44mm"]
  },
  {
    id: "galaxy-watch-8-pulsera",
    keywords: ["pulsera galaxy watch 8", "correa galaxy watch 8", "repuesto galaxy watch 8", "pulsera galaxy watch 8 classic"],
    name: "Pulsera De Repuesto Para Samsung Galaxy Watch 8 / 8 Classic",
    category: "pulsera",
    model: "Samsung Galaxy Watch 8 / 8 Classic",
    price: "22.900",
    colors: ["Azul Claro", "Azul Oscuro", "Blanco", "Caqui", "Gris", "Lila", "Naranja", "Negro", "Rosa pálido", "Verde Militar"]
  },
  {
    id: "galaxy-watch-8-funda",
    keywords: ["funda galaxy watch 8", "protector galaxy watch 8", "funda protectora galaxy watch 8"],
    name: "Funda Protector De Pantalla Para Samsung Galaxy Watch 8 TPU",
    category: "funda",
    model: "Samsung Galaxy Watch 8",
    price: "18.900",
    colors: ["Azul 40mm/44mm", "Dorado 40mm/44mm", "Negro 40mm/44mm", "Plateado 40mm/44mm", "Rosa 40mm/44mm", "Transparente 40mm/44mm", "Oro Rosa 40mm/44mm"]
  },
  {
    id: "galaxy-watch-8-classic-lateral",
    keywords: ["funda galaxy watch 8 classic", "protector galaxy watch 8 classic", "funda lateral galaxy watch 8 classic"],
    name: "Funda Protector Lateral Para Samsung Galaxy Watch 8 Classic",
    category: "funda",
    model: "Samsung Galaxy Watch 8 Classic",
    price: "18.900",
    colors: ["Azul 40mm/44mm", "Dorado 40mm/44mm", "Negro 40mm/44mm", "Plateado 40mm/44mm", "Rosa 40mm/44mm", "Transparente 40mm/44mm", "Oro Rosa 40mm/44mm"]
  },
  {
    id: "iphone-17-pro-funda",
    keywords: ["funda iphone 17 pro", "funda iphone 17 pro max", "funda premium iphone 17 pro", "funda premium iphone 17 pro max"],
    name: "Funda Premium para iPhone 17 Pro y 17 Pro Max, con soporte magnético giratorio 360",
    category: "funda",
    model: "iPhone 17 Pro / 17 Pro Max",
    price: "49.900",
    colors: ["Blanco", "Naranja", "Negro", "Transparente"]
  },
  {
    id: "iphone-17-pro-lente",
    keywords: ["protector lente iphone 17 pro", "protector lente iphone 17 pro max", "lente iphone 17 pro", "lente iphone 17 pro max"],
    name: "Protector Lente iPhone 17 Pro / 17 Pro Max Premium",
    category: "protector lente",
    model: "iPhone 17 Pro / 17 Pro Max",
    price: "29.900",
    colors: ["Azul", "Naranja", "Negro", "Gris"]
  },
  {
    id: "xiaomi-67w-cargador",
    keywords: ["cargador xiaomi 67w", "cargador 67w xiaomi", "turbo xiaomi 67w"],
    name: "Cargador Xiaomi 67W Turbo original",
    category: "cargador",
    model: "Xiaomi 67W",
    price: "116.900",
    colors: ["Blanco"]
  },
  {
    id: "xiaomi-cable-usb-c",
    keywords: ["cable xiaomi tipo c", "cable usb tipo c xiaomi", "cable xiaomi 6a", "cable turbo xiaomi"],
    name: "Cable Usb Original Tipo C 6A Xiaomi Carga Turbo / Rapida",
    category: "cable",
    model: "Xiaomi Tipo C",
    price: "34.900",
    colors: ["Blanco"]
  }
];

const conversationState = new Map();

function getState(wa_id) {
  if (!conversationState.has(wa_id)) {
    conversationState.set(wa_id, {
      product: null,
      color: null,
      quantity: null,
      city: null,
      paymentMethod: null,
      step: null
    });
  }
  return conversationState.get(wa_id);
}

function resetState(wa_id) {
  conversationState.set(wa_id, {
    product: null,
    color: null,
    quantity: null,
    city: null,
    paymentMethod: null,
    step: null
  });
}

function startNewOrderFromProduct(state, product) {
  state.product = product;
  state.color = null;
  state.quantity = null;
  state.city = null;
  state.paymentMethod = null;
  state.step = "awaiting_color";
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function isSimilarWord(input, target, maxDistance = 2) {
  const a = normalizeText(input);
  const b = normalizeText(target);
  if (a.includes(b) || b.includes(a)) return true;
  return levenshtein(a, b) <= maxDistance;
}

function findProductFromText(text) {
  const normalized = normalizeText(text);
  for (const product of products) {
    for (const keyword of product.keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        return product;
      }
    }
  }
  return null;
}

function detectColor(text, product) {
  if (!product?.colors?.length) return null;

  const normalizedText = normalizeText(text);
  const words = normalizedText.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const color of product.colors) {
    const normalizedColor = normalizeText(color);
    const colorWords = normalizedColor.split(/\s+/);

    let score = 0;

    if (normalizedText.includes(normalizedColor)) {
      return color;
    }

    for (const cw of colorWords) {
      for (const w of words) {
        if (isSimilarWord(w, cw, 2)) {
          score++;
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = color;
    }
  }

  if (bestScore >= 1) return bestMatch;
  return null;
}

function detectQuantity(text) {
  const match = String(text).match(/\b([1-9][0-9]?)\b/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function detectCity(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  const cities = [
    "bogota",
    "soacha",
    "medellin",
    "cali",
    "barranquilla",
    "cartagena",
    "bucaramanga",
    "cucuta",
    "ibague",
    "pereira",
    "manizales",
    "armenia",
    "santa marta",
    "villavicencio",
    "pasto",
    "monteria",
    "neiva",
    "popayan",
    "tunja"
  ];

  for (const city of cities) {
    const cityWords = city.split(" ");
    let matches = 0;

    for (const cw of cityWords) {
      for (const w of words) {
        if (isSimilarWord(w, cw, 2)) {
          matches++;
          break;
        }
      }
    }

    if (matches >= cityWords.length) {
      return city;
    }
  }

  return text.trim();
}

function detectPaymentMethod(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  const contraWords = ["contraentrega", "contra", "entrega"];
  const transferWords = ["transferencia", "nequi", "daviplata", "bancolombia"];

  let contraScore = 0;
  let transferScore = 0;

  for (const word of words) {
    for (const target of contraWords) {
      if (isSimilarWord(word, target, 2)) contraScore++;
    }

    for (const target of transferWords) {
      if (isSimilarWord(word, target, 2)) transferScore++;
    }
  }

  if (normalized.includes("contraentrega") || normalized.includes("contra entrega") || contraScore >= 2) {
    return "Contraentrega";
  }

  if (transferScore >= 1) {
    return "Transferencia";
  }

  return null;
}

function parsePrice(priceText) {
  return Number(String(priceText).replace(/\./g, "").replace(/,/g, "").trim()) || 0;
}

function getShippingInfo(city, quantity = 1, productPrice = 0) {
  const normalizedCity = normalizeText(city || "");
  const total = (productPrice || 0) * (quantity || 1);

  if (total >= 99000) {
    return "Tu compra aplica para envío gratis 🚚";
  }

  if (normalizedCity.includes("bogota") || normalizedCity.includes("soacha")) {
    return "Para Bogotá o Soacha, el envío inicia desde 10.000 en zonas seleccionadas y puede llegar el mismo día si compras antes de la 1:00 pm 🚀";
  }

  return "Para tu ciudad, el envío tarda de 1 a 3 días hábiles y el valor se confirma según ubicación exacta 📦";
}

function buildProductReply(product, userText = "") {
  const wantsPrice = /precio|cuanto|cu[aá]nto vale|cuesta/i.test(userText);
  const wantsColors = /color|colores/i.test(userText);

  if (wantsColors) {
    return `Sí lo manejamos 🔥 Los colores disponibles para ${product.name} son: ${product.colors.join(", ")}. ¿Qué color te gustaría?`;
  }

  if (wantsPrice) {
    return `${product.name} está en ${product.price}. ${product.colors?.length ? `Colores disponibles: ${product.colors.join(", ")}. ` : ""}¿Qué color te gustaría?`;
  }

  return `Si lo manejamos 🔥 ${product.name} está en ${product.price}. ${product.colors?.length ? `Tengo disponible en: ${product.colors.join(", ")}. ` : ""}¿Qué color te gustaría?`;
}

function buildOrderSummary(state) {
  return [
    "Perfecto 🔥 Te resumo tu pedido:",
    `- Producto: ${state.product?.name || "No definido"}`,
    `- Color: ${state.color || "No definido"}`,
    `- Cantidad: ${state.quantity || "No definida"}`,
    `- Ciudad: ${state.city || "No definida"}`,
    `- Método de pago: ${state.paymentMethod || "No definido"}`
  ].join("\n");
}

function detectIntent(text) {
  const t = normalizeText(text);

  if (
    t.includes("quiero cambiar el pedido") ||
    t.includes("cambiar pedido") ||
    t.includes("quiero otro producto") ||
    t.includes("mejor otro producto") ||
    t.includes("quiero empezar de nuevo") ||
    t.includes("empecemos de nuevo") ||
    t.includes("empezar de nuevo") ||
    t.includes("borra ese pedido") ||
    t.includes("ya no quiero ese")
  ) {
    return "restart_order";
  }

  return "continue_flow";
}

function inferStage(userText) {
  if (/(quiero|lo compro|pagar|hacer pedido|comprar)/i.test(userText)) return "Cerrando";
  if (/(precio|cu[aá]nto)/i.test(userText)) return "Cotizado";
  if (/(env[ií]o|contraentrega|transferencia)/i.test(userText)) return "Interesado";
  return "Nuevo";
}

function ruleEngine(text) {
  const t = normalizeText(text);

  if (/^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches)$/.test(t)) {
    return "Hola, bienvenido a MundoNetTech 👋 ¿Qué producto estás buscando? Si quieres, dime el modelo exacto y te ayudo de una vez.";
  }

  if (/^(si|sí|dale|ok|bueno|de una|listo)$/.test(t)) {
    return null;
  }

  if (/(pago|transferencia|contraentrega|contra entrega|nequi|daviplata|bancolombia)/i.test(t)) {
    return "Manejamos transferencia y pago contraentrega según ciudad. Si quieres, te confirmo cuál te aplica según tu ubicación.";
  }

  if (/precio/i.test(t) && !/iphone|redmi|galaxy|watch|xiaomi|cargador|cable|pulsera|funda|protector/i.test(t)) {
    return "Claro. Dime el producto exacto o el modelo de tu equipo y te doy el precio de una vez 👌";
  }

  if (/(env[ií]o|envios|entrega|tarda|domicilio)/i.test(t)) {
    return "¿En qué ciudad y barrio estás? Con eso te confirmo tiempo exacto y si aplica contraentrega.";
  }

  if (/(garantia)/i.test(t)) {
    return "Sí, todos nuestros productos tienen garantía por defectos de fábrica ✅";
  }

  if (/colores?/i.test(t)) {
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
Productos disponibles:
${products.map((p) => `- ${p.name} | Precio: ${p.price} | Colores: ${p.colors.join(", ")}`).join("\n")}
`;

  const messages = [
    { role: "system", content: system },
    ...(contextMessages || []),
    { role: "user", content: userText }
  ];

  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model: "gpt-4o-mini", temperature: 0.6, messages },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );

  return resp.data.choices?.[0]?.message?.content?.trim() || "Dime el modelo exacto y ciudad y te ayudo.";
}

async function sendWhatsAppText(to, body) {
  const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function saveMessage(wa_id, direction, body) {
  try {
    await supabase.from("messages").insert([{ wa_id, direction, body }]);
  } catch (err) {
    console.error("saveMessage error:", err.message);
  }
}

async function upsertLead(wa_id, wa_name, last_message, fields = {}) {
  try {
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("wa_id", wa_id)
      .maybeSingle();

    const payload = {
      wa_id,
      wa_name,
      last_message,
      updated_at: new Date().toISOString(),
      ...fields
    };

    if (existing?.id) {
      await supabase.from("leads").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("leads").insert([payload]);
    }
  } catch (err) {
    console.error("upsertLead error:", err.message);
  }
}

async function getRecentContext(wa_id, limit = 10) {
  try {
    const { data } = await supabase
      .from("messages")
      .select("direction, body, created_at")
      .eq("wa_id", wa_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    const ordered = (data || []).reverse();
    return ordered.map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body
    }));
  } catch (err) {
    console.error("getRecentContext error:", err.message);
    return [];
  }
}

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

    const state = getState(wa_id);
    const intent = detectIntent(text);

    if (intent === "restart_order") {
      resetState(wa_id);

      const reply = "Listo 👌 cambiamos el pedido sin problema. ¿Qué producto quieres ahora?";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      await upsertLead(wa_id, wa_name, text, { stage: "Reinicia pedido" });
      return res.sendStatus(200);
    }

    if (/(asesor|humano|persona|llámame|llamame)/i.test(text)) {
      const reply = "Listo. Ya te atiende un asesor. Dime tu modelo exacto y ciudad para ir adelantando.";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      await upsertLead(wa_id, wa_name, text, { stage: "Pide asesor" });
      return res.sendStatus(200);
    }

    const forcedProduct = findProductFromText(text);
    if (forcedProduct && state.step) {
      startNewOrderFromProduct(state, forcedProduct);

      const reply = `Perfecto 👌 cambiamos al nuevo producto. ${buildProductReply(forcedProduct, text)}`;
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      await upsertLead(wa_id, wa_name, text, {
        stage: "Cambio de producto",
        product_model: forcedProduct.model,
        accessory_type: forcedProduct.category
      });
      return res.sendStatus(200);
    }

    if (!state.step) {
      const detectedProduct = findProductFromText(text);

      if (detectedProduct) {
        startNewOrderFromProduct(state, detectedProduct);

        const reply = buildProductReply(detectedProduct, text);
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        await upsertLead(wa_id, wa_name, text, {
          stage: "Producto detectado",
          product_model: detectedProduct.model,
          accessory_type: detectedProduct.category
        });
        return res.sendStatus(200);
      }
    }

    if (state.step === "awaiting_color" && state.product) {
      const detectedColor = detectColor(text, state.product);

      if (detectedColor) {
        state.color = detectedColor;
        state.step = "awaiting_quantity";

        const reply = `Perfecto 🔥 ${detectedColor}. ¿Cuántas unidades vas a llevar?`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        await upsertLead(wa_id, wa_name, text, {
          stage: "Color elegido",
          product_model: state.product.model,
          accessory_type: state.product.category,
          color: detectedColor
        });
        return res.sendStatus(200);
      }

      const reply = `Tengo estos colores disponibles para ${state.product.name}: ${state.product.colors.join(", ")}. ¿Qué color te gustaría?`;
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      return res.sendStatus(200);
    }

    if (state.step === "awaiting_quantity" && state.product) {
      const quantity = detectQuantity(text);

      if (quantity) {
        state.quantity = quantity;
        state.step = "awaiting_city";

        const reply = `Listo, ${quantity} unidad(es). ¿En qué ciudad estás para confirmarte el envío?`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const reply = "Perfecto. ¿Cuántas unidades vas a llevar?";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      return res.sendStatus(200);
    }

    if (state.step === "awaiting_city" && state.product) {
      const city = detectCity(text);
      state.city = city;
      state.step = "awaiting_payment";

      const shippingInfo = getShippingInfo(
        city,
        state.quantity || 1,
        parsePrice(state.product.price)
      );

      const reply = `${shippingInfo} ¿Prefieres pagar por transferencia o contraentrega?`;
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      return res.sendStatus(200);
    }

    if (state.step === "awaiting_payment" && state.product) {
      const paymentMethod = detectPaymentMethod(text);

      if (paymentMethod) {
        state.paymentMethod = paymentMethod;
        state.step = "awaiting_order_details";

        const summary = buildOrderSummary(state);
        const reply = `${summary}\n\nAhora para dejarte el pedido listo envíame por favor:\n- Nombre\n- Dirección\n- Teléfono\n\nSi es entrega en oficina, también la cédula.`;

        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        await upsertLead(wa_id, wa_name, text, {
          stage: "Listo para cerrar",
          product_model: state.product.model,
          accessory_type: state.product.category,
          color: state.color,
          city: state.city,
          payment_method: state.paymentMethod
        });
        return res.sendStatus(200);
      }

      const reply = "¿Prefieres pagar por transferencia o contraentrega?";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      return res.sendStatus(200);
    }

    if (state.step === "awaiting_order_details" && state.product) {
      const changedProduct = findProductFromText(text);
      if (changedProduct) {
        startNewOrderFromProduct(state, changedProduct);

        const reply = `Claro 👌 cambiamos el pedido. ${buildProductReply(changedProduct, text)}`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const changedColor = detectColor(text, state.product);
      if (changedColor) {
        state.color = changedColor;

        const reply = `${buildOrderSummary(state)}\n\nListo, ya actualicé el color ✅ Ahora envíame por favor:\n- Nombre\n- Dirección\n- Teléfono`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const changedQuantity = detectQuantity(text);
      if (changedQuantity) {
        state.quantity = changedQuantity;

        const reply = `${buildOrderSummary(state)}\n\nListo, ya actualicé la cantidad ✅ Ahora envíame por favor:\n- Nombre\n- Dirección\n- Teléfono`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const changedCity = detectCity(text);
      if (changedCity && normalizeText(text).length > 3 && !/\d/.test(text)) {
        state.city = changedCity;

        const reply = `${buildOrderSummary(state)}\n\nListo, ya actualicé la ciudad ✅ Ahora envíame por favor:\n- Nombre\n- Dirección\n- Teléfono`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const changedPayment = detectPaymentMethod(text);
      if (changedPayment) {
        state.paymentMethod = changedPayment;

        const reply = `${buildOrderSummary(state)}\n\nPerfecto, ya actualicé el método de pago ✅ Ahora envíame por favor:\n- Nombre\n- Dirección\n- Teléfono`;
        await sendWhatsAppText(wa_id, reply);
        await saveMessage(wa_id, "out", reply);
        return res.sendStatus(200);
      }

      const reply = "Perfecto, quedo atento a tus datos para dejarte el pedido listo ✅";
      await sendWhatsAppText(wa_id, reply);
      await saveMessage(wa_id, "out", reply);
      return res.sendStatus(200);
    }

    const ruleReply = ruleEngine(text);
    if (ruleReply) {
      await sendWhatsAppText(wa_id, ruleReply);
      await saveMessage(wa_id, "out", ruleReply);
      await upsertLead(wa_id, wa_name, text, { stage: inferStage(text) });
      return res.sendStatus(200);
    }

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

app.get("/", (_req, res) => {
  res.status(200).send("Bot listo");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Bot listo");
});