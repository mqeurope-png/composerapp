/* ───────────── OPENAI HELPERS (ported from v2) ─────────────
   API key lives in sessionStorage (cleared when the tab closes — never sent
   to Supabase). Per-language style prompts live in localStorage so they
   persist across sessions. callOpenAI() wraps a chat.completions request to
   gpt-4o-mini and returns a Promise<string>.
*/

const LANG_NAME_MAP = { es: 'español', fr: 'français', de: 'Deutsch', en: 'English', nl: 'Nederlands' }

const DEFAULT_AI_STYLES = {
  es: 'Tono cercano y profesional. Tutea al cliente. Estilo directo, frases cortas.',
  fr: 'Ton professionnel et courtois. Vouvoyez le client. Style clair et commercial.',
  de: 'Professioneller, sachlicher Ton. Siezen Sie den Kunden. Klar und präzise.',
  en: 'Professional but friendly tone. Clear, concise commercial style.',
  nl: 'Professionele maar vriendelijke toon. Duidelijk en commercieel.',
}

/* The OpenAI key now lives in appState (synced to Supabase + localStorage so
   it's available on every device). We expose a getter that reads the value
   the App publishes onto window.OPENAI_KEY. setOpenaiKey() is kept as a
   compatibility no-op — the actual write goes through setAppState in the
   AISettingsPanel.

   Legacy fallback: if there's still a sessionStorage entry from older
   sessions and appState hasn't loaded yet, return that. The App also runs a
   migration useEffect that promotes any sessionStorage key into appState. */
function getOpenaiKey() {
  if (typeof window !== 'undefined' && typeof window.OPENAI_KEY === 'string' && window.OPENAI_KEY) return window.OPENAI_KEY
  try { return sessionStorage.getItem('bomedia_openai_key') || '' } catch (e) { return '' }
}

function setOpenaiKey(key) {
  // Kept for backwards compat — UI now writes through appState directly.
  try {
    if (key) sessionStorage.setItem('bomedia_openai_key', key)
    else sessionStorage.removeItem('bomedia_openai_key')
  } catch (e) {}
}

/* Per-user tone prompts now live in appState.users[i].aiStyles, published by
   App onto window.AI_STYLES whenever the current user changes. The legacy
   localStorage entry is kept as a one-shot fallback. */
function getAiStyles() {
  if (typeof window !== 'undefined' && window.AI_STYLES && Object.keys(window.AI_STYLES).length > 0) {
    return Object.assign({}, DEFAULT_AI_STYLES, window.AI_STYLES)
  }
  try {
    const raw = localStorage.getItem('bomedia_ai_styles')
    if (raw) return Object.assign({}, DEFAULT_AI_STYLES, JSON.parse(raw))
  } catch (e) {}
  return Object.assign({}, DEFAULT_AI_STYLES)
}

/* Kept for backwards compat — tone prompts now travel with the user record
   and are written via setAppState in the user editor. */
function saveAiStyle(langKey, value) {
  const next = Object.assign({}, getAiStyles(), { [langKey]: value })
  try { localStorage.setItem('bomedia_ai_styles', JSON.stringify(next)) } catch (e) {}
  return next
}

/* Generate a sales-style paragraph from notes. Returns Promise<string>.
   `mode` can be 'generate' (default — write from notes) or 'rewrite' (rephrase
   the input). `existing` is used in rewrite mode. */
function callOpenAI({ notes, lang, mode, existing }) {
  // Trim aggressively — copy-paste from the OpenAI dashboard often brings
  // along trailing whitespace or newlines that break the Authorization header
  const key = (getOpenaiKey() || '').trim()
  if (!key) return Promise.reject(new Error('Configura tu API key de OpenAI en Backoffice → Asistente IA'))
  if (!key.startsWith('sk-')) return Promise.reject(new Error('La API key no parece válida (debería empezar por "sk-")'))

  const langKey = lang || 'es'
  const langName = LANG_NAME_MAP[langKey] || 'español'
  const styles = getAiStyles()
  const styleInstr = styles[langKey] || ''

  const systemPrompt = (
    'Eres un copywriter comercial experto en maquinaria de impresión UV-LED. '
    + 'Redactas textos breves, naturales y persuasivos para emails B2B. '
    + 'No uses emojis. No uses formato markdown. '
    + 'Escribe en ' + langName + '.'
    + (styleInstr ? ' Instrucciones de estilo: ' + styleInstr : '')
  )

  let userPrompt
  if (mode === 'rewrite' && existing) {
    userPrompt = 'Reescribe este texto manteniendo la idea pero mejorando el tono y la fluidez. Texto:\n\n'
      + existing
      + (notes ? '\n\nInstrucciones adicionales: ' + notes : '')
      + '\n\nIdioma: ' + langName
  } else {
    userPrompt = 'Redacta un párrafo comercial breve (2-4 frases) para un email de ventas a partir de estos puntos clave:\n\n'
      + (notes || existing || '')
      + '\n\nIdioma: ' + langName
  }

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  }).then(async r => {
    // Surface non-2xx responses with the actual API message (auth errors,
    // quota errors, model errors) so the user sees the cause instead of a
    // generic "failed to fetch"
    if (!r.ok) {
      let detail = ''
      try { const j = await r.json(); detail = j.error?.message || JSON.stringify(j) } catch (e) { detail = await r.text() }
      throw new Error('OpenAI ' + r.status + ': ' + detail.slice(0, 240))
    }
    return r.json()
  }).then(data => {
    if (data.error) throw new Error(data.error.message || 'Error OpenAI')
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim()
    }
    throw new Error('Respuesta inesperada de OpenAI')
  }).catch(err => {
    // Network-level failures (CORS, offline, DNS) come through as "Failed to
    // fetch" — wrap with a friendlier message that hints at causes.
    if (err && /failed to fetch|network/i.test(err.message || '')) {
      throw new Error(
        'No se pudo conectar con OpenAI (revisa la red, bloqueadores o que la key esté bien). '
        + 'Detalle: ' + err.message
      )
    }
    throw err
  })
}

Object.assign(window, {
  LANG_NAME_MAP, DEFAULT_AI_STYLES,
  getOpenaiKey, setOpenaiKey,
  getAiStyles, saveAiStyle,
  callOpenAI,
})
