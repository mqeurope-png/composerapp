import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { loadCatalogFromStateFile, collectImageLibrary } from './catalog.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const stateFile = process.env.APP_STATE_FILE || '';
let catalog = { products: [], uploadedImages: [] };
if (stateFile) {
  try {
    catalog = loadCatalogFromStateFile(stateFile);
    console.log(`[catalog] loaded ${catalog.products.length} products from ${stateFile}`);
  } catch (e) {
    console.warn('[catalog] could not load APP_STATE_FILE:', e.message);
  }
}

const PROMPTS = {
  instagram: 'Escribe un post para Instagram con gancho inicial, texto emocional y CTA corto.',
  facebook: 'Escribe un post para Facebook más explicativo, cercano y con CTA claro.',
  linkedin: 'Escribe un post para LinkedIn profesional, con estructura y cierre orientado a conversación.'
};

app.get('/health', (_req, res) => res.json({ ok: true }));

function findProductById(productId) {
  if (!productId) return null;
  return (catalog.products || []).find((p) => String(p.id) === String(productId)) || null;
}

function localizeProduct(product, lang = 'es') {
  if (!product) return null;
  const tr = (product.i18n && product.i18n[lang]) || {};
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    area: product.area,
    desc: tr.desc || product.desc || '',
    price: tr.price || '',
    link: tr.link || product.link || '',
    img: tr.img || product.img || ''
  };
}

app.post('/api/generate-post', async (req, res) => {
  try {
    const { platform, tone, objective, audience, product, productId, lang = 'es', cta } = req.body ?? {};

    if (!platform || !PROMPTS[platform]) {
      return res.status(400).json({ error: 'platform inválida. Usa: instagram|facebook|linkedin' });
    }

    const selected = localizeProduct(findProductById(productId), lang);

    const productContext = selected
      ? `Producto de catálogo seleccionado (NO inventar datos):
- id: ${selected.id}
- nombre: ${selected.name}
- marca: ${selected.brand}
- área: ${selected.area || 'N/A'}
- descripción: ${selected.desc || 'N/A'}
- precio: ${selected.price || 'N/A'}
- link: ${selected.link || 'N/A'}
- imagen: ${selected.img || 'N/A'}`
      : `Producto/Servicio libre: ${product || 'N/A'}`;

    const prompt = `
${PROMPTS[platform]}

Idioma objetivo: ${lang}
Contexto:
- Tono: ${tone || 'profesional'}
- Objetivo: ${objective || 'informar'}
- Audiencia: ${audience || 'general'}
- CTA: ${cta || 'Descubre más'}
- ${productContext}

Reglas:
- Si hay producto de catálogo, usa su link exacto y no lo modifiques.
- No inventes precios ni características no presentes.
- Si falta un dato, omítelo elegantemente.

Devuelve JSON válido con esta forma exacta:
{
  "post": "...",
  "variations": ["...", "..."],
  "hashtags": ["#...", "#..."],
  "recommendedAsset": {
    "imageUrl": "...",
    "linkUrl": "..."
  }
}`;

    const response = await client.responses.create({
      model: process.env.MODEL || 'gpt-4.1-mini',
      input: prompt
    });

    const text = response.output_text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { post: text, variations: [], hashtags: [] };
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Error generando post', detail: error?.message || 'unknown' });
  }
});


app.post('/api/catalog/import', (req, res) => {
  try {
    const state = req.body || {};
    const raw = JSON.stringify(state);
    const parsed = JSON.parse(raw);
    const products = Array.isArray(parsed.products) ? parsed.products : [];
    const uploadedImages = Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages : [];

    catalog = {
      products: products.map((p) => {
        const tr = p.i18n || {};
        return {
          id: p.id,
          name: p.name,
          brand: p.brand,
          area: p.area || '',
          img: p.img || '',
          link: p.link || '',
          desc: p.desc || '',
          i18n: tr
        };
      }),
      uploadedImages
    };

    return res.json({ ok: true, products: catalog.products.length, images: collectImageLibrary(catalog).length });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'JSON inválido', detail: e?.message || 'unknown' });
  }
});

app.get('/api/catalog/products', (req, res) => {
  const lang = String(req.query.lang || 'es');
  const items = (catalog.products || []).map((p) => {
    const tr = (p.i18n && p.i18n[lang]) || {};
    return {
      id: p.id, name: p.name, brand: p.brand, area: p.area,
      img: tr.img || p.img,
      desc: tr.desc || p.desc,
      price: tr.price || '',
      link: tr.link || p.link
    };
  });
  res.json({ count: items.length, lang, items });
});

app.get('/api/catalog/images', (_req, res) => {
  const images = collectImageLibrary(catalog);
  res.json({ count: images.length, images });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../../client');

app.use(express.static(clientDir));
app.get('/', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));

app.listen(port, () => {
  console.log(`postsapp beta running on http://localhost:${port}`);
});
