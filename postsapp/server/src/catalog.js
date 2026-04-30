import fs from 'fs';

const LANGS = ['es', 'en', 'fr', 'de', 'nl'];

export function loadCatalogFromStateFile(stateFile) {
  const raw = fs.readFileSync(stateFile, 'utf8');
  const state = JSON.parse(raw);
  const products = Array.isArray(state.products) ? state.products : [];
  const uploadedImages = Array.isArray(state.uploadedImages) ? state.uploadedImages : [];

  return {
    products: products.map((p) => normalizeProduct(p)),
    uploadedImages,
    standaloneBlocks: Array.isArray(state.standaloneBlocks) ? state.standaloneBlocks : [],
    templates: Array.isArray(state.templates) ? state.templates : []
  };
}

function normalizeProduct(p) {
  const localized = {};
  for (const lang of LANGS) {
    const tr = (p.i18n && p.i18n[lang]) || {};
    localized[lang] = {
      desc: tr.desc || p.desc || '',
      price: tr.price || p.price || '',
      link: tr.link || p.link || '',
      feat1: tr.feat1 || p.feat1 || '',
      feat2: tr.feat2 || p.feat2 || '',
      badge: tr.badge || p.badge || '',
      img: tr.img || p.img || ''
    };
  }

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    area: p.area || '',
    img: p.img || '',
    link: p.link || '',
    desc: p.desc || '',
    i18n: localized
  };
}

export function collectImageLibrary(catalog) {
  const set = new Set();
  const push = (url) => {
    if (url && typeof url === 'string') set.add(url.trim());
  };

  for (const p of catalog.products || []) {
    push(p.img);
    for (const lang of Object.keys(p.i18n || {})) push(p.i18n[lang].img);
  }

  for (const row of catalog.uploadedImages || []) {
    if (typeof row === 'string') push(row);
    if (row && typeof row === 'object') push(row.url || row.src);
  }

  return Array.from(set);
}
