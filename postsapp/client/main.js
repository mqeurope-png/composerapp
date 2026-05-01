const form = document.getElementById('post-form');
const result = document.getElementById('result');
const productSelect = document.getElementById('product-id');

async function loadCatalog() {
  const data = Object.fromEntries(new FormData(form).entries());
  const apiUrl = data.apiUrl;
  const lang = data.lang || 'es';
  try {
    const resp = await fetch(`${apiUrl}/api/catalog/products?lang=${encodeURIComponent(lang)}`);
    if (!resp.ok) return;
    const json = await resp.json();
    const current = productSelect.value;
    productSelect.innerHTML = '<option value="">(texto libre)</option>';
    for (const p of json.items || []) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} · ${p.brand}`;
      productSelect.appendChild(opt);
    }
    productSelect.value = current;
  } catch {
    // beta: silencio si catálogo no está configurado
  }
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'lang' || event.target.name === 'apiUrl') loadCatalog();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const { apiUrl, ...payload } = data;

  result.textContent = 'Generando...';

  const resp = await fetch(`${apiUrl}/api/generate-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await resp.json();
  result.textContent = JSON.stringify(json, null, 2);
});

loadCatalog();


const importBtn = document.getElementById('import-catalog');
const importStatus = document.getElementById('import-status');
const catalogJson = document.getElementById('catalog-json');

importBtn?.addEventListener('click', async () => {
  const data = Object.fromEntries(new FormData(form).entries());
  const apiUrl = data.apiUrl;
  importStatus.textContent = 'Importando...';
  try {
    const parsed = JSON.parse(catalogJson.value || '{}');
    const resp = await fetch(`${apiUrl}/api/catalog/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    });
    const json = await resp.json();
    if (!resp.ok || !json.ok) throw new Error(json.error || 'Error importando');
    importStatus.textContent = `OK: ${json.products} productos, ${json.images} imágenes`;
    await loadCatalog();
  } catch (e) {
    importStatus.textContent = `Error: ${e.message}`;
  }
});
