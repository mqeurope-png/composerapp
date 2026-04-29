/* ───────────── EMAIL HTML GENERATION (ported from v2) ───────────── */
/* Table-based HTML for email client compatibility. */

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function productCardHtml(p, lang) {
  // Sizes rebalanced 2026-04: image bumped to 220×170 (was 160×130) and
  // text sizes increased one step so they read at a comfortable 11-12px
  // body. Button padding reduced slightly so it doesn't dominate the card.
  const areaLabel = lang==='fr'?'Surface':lang==='de'?'Fläche':lang==='en'?'Area':lang==='nl'?'Oppervlak':'Área'
  const altLabel = lang==='fr'?'Haut. max.':lang==='de'?'Max. Höhe':lang==='en'?'Max. height':lang==='nl'?'Max. hoogte':'Alt. máx.'
  let areaBlock = ''
  if (p.area !== '-') {
    areaBlock = '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0">' +
      '<tr><td width="38%" style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">' + areaLabel + '</td><td style="font-size:11px;font-weight:700;color:#334155">' + p.area + '</td></tr>' +
      (p.alt !== '-' ? '<tr><td style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">' + altLabel + '</td><td style="font-size:11px;font-weight:700;color:#334155">' + p.alt + '</td></tr>' : '') +
      '</table>'
  }
  const priceExtra = p.price !== 'Consultar' && p.price !== 'Sur demande' && p.price !== 'Auf Anfrage' && p.price !== 'On request' && p.price !== 'Op aanvraag' ? ' <span style="font-size:11px;font-weight:500;color:#475569">' + (lang==='fr'?'+ TVA':lang==='de'?'+ MwSt':lang==='en'?'+ VAT':lang==='nl'?'+ BTW':'+ IVA') + '</span>' : ''
  const ctaLabel = p.brand === 'pimpam' ? (lang==='fr'?'Détails':lang==='de'?'Details':lang==='en'?'Details':lang==='nl'?'Details':'Detalles') : (lang==='fr'?"Plus d'infos":lang==='de'?'Mehr Infos':lang==='en'?'More info':lang==='nl'?'Meer info':'Más info')
  const bgExtra = p.brand === 'pimpam' ? ';background:#fff7ed' : ''
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid ' + (p.brand==='pimpam'?'#fed7aa':'#e2e8f0') + ';border-radius:12px;overflow:hidden;background:#fff">' +
    '<tr><td style="background:#fff;padding:8px 4px 4px;border-bottom:1px solid ' + (p.brand==='pimpam'?'#ffedd5':'#f1f5f9') + ';text-align:center">' +
    // Image fills the entire column. No max-width caps so it grows with the
    // card; height stays proportional via height:auto.
    '<img src="' + p.img + '" alt="' + p.name + '" style="display:block;width:100%;max-width:100%;height:auto;border-radius:8px">' +
    '</td></tr>' +
    '<tr><td style="padding:14px' + bgExtra + '">' +
    '<span style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;margin-bottom:8px;background:' + p.badgeBg + ';color:' + p.badgeColor + '">' + p.badge + '</span>' +
    '<p style="font-size:15px;font-weight:900;color:#0f172a;margin:0;line-height:1.3">' + p.name + '</p>' +
    '<p style="font-size:12px;color:#64748b;margin:5px 0 0;line-height:1.5">' + p.desc + '</p>' +
    areaBlock +
    '<p style="font-size:11px;color:#475569;padding:2px 0;margin:' + (p.area==='-'?'8px':'0') + ' 0 0">✓ ' + p.feat1 + '</p>' +
    '<p style="font-size:11px;color:#475569;padding:2px 0;margin:0">✓ ' + p.feat2 + '</p>' +
    '<p style="font-size:16px;font-weight:900;color:' + p.accent + ';margin:10px 0 0;text-align:center">' + p.price + priceExtra + '</p>' +
    '<a href="' + p.link + '" style="display:block;text-align:center;font-size:12px;font-weight:700;text-decoration:none;padding:8px 10px;border-radius:8px;text-transform:uppercase;letter-spacing:0.4px;background:' + p.gradient + ';color:#fff;margin-top:8px">' + ctaLabel + ' →</a>' +
    '</td></tr></table>'
}

function productCardCompactHtml(p, lang) {
  // Compact (trio) — same rebalance applied at smaller scale: image 160×120
  // (was 120×90), text 9-13px (was 7-11), button slightly less heavy.
  const areaLabel = lang==='fr'?'Surface':lang==='de'?'Fläche':lang==='en'?'Area':lang==='nl'?'Oppervlak':'Área'
  const altLabel = lang==='fr'?'Haut.':lang==='de'?'Höhe':lang==='en'?'Height':lang==='nl'?'Hoogte':'Alt'
  let areaBlock = ''
  if (p.area !== '-') {
    areaBlock = '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0">' +
      '<tr><td style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">' + areaLabel + ': ' + p.area + '</td></tr>' +
      (p.alt !== '-' ? '<tr><td style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">' + altLabel + ': ' + p.alt + '</td></tr>' : '') +
      '</table>'
  }
  const priceExtra = p.price !== 'Consultar' && p.price !== 'Sur demande' && p.price !== 'Auf Anfrage' && p.price !== 'On request' && p.price !== 'Op aanvraag' ? ' <span style="font-size:9px;font-weight:500;color:#475569">(' + (lang==='fr'?'+ TVA':lang==='de'?'+ MwSt':lang==='en'?'+ VAT':lang==='nl'?'+ BTW':'+ IVA') + ')</span>' : ''
  const ctaLabel = p.brand === 'pimpam' ? (lang==='fr'?'Détails':lang==='de'?'Details':lang==='en'?'Details':lang==='nl'?'Details':'Detalles') : 'Info'
  const bgExtra = p.brand === 'pimpam' ? ';background:#fff7ed' : ''
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' + (p.brand==='pimpam'?'#fed7aa':'#e2e8f0') + ';border-radius:10px;overflow:hidden;background:#fff">' +
    '<tr><td style="background:#fff;padding:6px 3px 3px;border-bottom:1px solid ' + (p.brand==='pimpam'?'#ffedd5':'#f1f5f9') + ';text-align:center">' +
    '<img src="' + p.img + '" alt="' + p.name + '" style="display:block;width:100%;max-width:100%;height:auto;border-radius:6px">' +
    '</td></tr>' +
    '<tr><td style="padding:10px' + bgExtra + '">' +
    '<span style="display:inline-block;font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:2px 7px;border-radius:16px;margin-bottom:4px;background:' + p.badgeBg + ';color:' + p.badgeColor + '">' + p.badge + '</span>' +
    '<p style="font-size:13px;font-weight:900;color:#0f172a;margin:0;line-height:1.3">' + p.name + '</p>' +
    '<p style="font-size:10px;color:#64748b;margin:3px 0 0;line-height:1.4">' + p.desc + '</p>' +
    areaBlock +
    '<p style="font-size:10px;color:#475569;padding:1px 0;margin:' + (p.area==='-'?'6px':'0') + ' 0 0">✓ ' + p.feat1 + '</p>' +
    '<p style="font-size:10px;color:#475569;padding:1px 0;margin:0">✓ ' + p.feat2 + '</p>' +
    '<p style="font-size:13px;font-weight:900;color:' + p.accent + ';margin:8px 0 0;text-align:center">' + p.price + priceExtra + '</p>' +
    '<a href="' + p.link + '" style="display:block;text-align:center;font-size:10px;font-weight:700;text-decoration:none;padding:7px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.3px;background:' + p.gradient + ';color:#fff;margin-top:6px">' + ctaLabel + ' →</a>' +
    '</td></tr></table>'
}

function brandStripHtml(key, lang, brands) {
  const b = brands.find(br => br.id === key)
  if (!b) return ''
  const url = (typeof b.url === 'object') ? (b.url[lang] || b.url.es) : b.url
  const urlLabel = (typeof b.urlLabel === 'object') ? (b.urlLabel[lang] || b.urlLabel.es) : b.urlLabel
  const h = parseInt(b.logoHeight) || 28
  const mw = parseInt(b.logoMaxWidth) || 180
  const imgTag = b.logo
    ? '<img src="' + b.logo + '" alt="' + b.label + '" style="max-height:' + h + 'px;max-width:' + mw + 'px;width:auto;height:auto;display:block">'
    : '<span style="font-size:14px;font-weight:800;color:' + b.color + '">' + b.label + '</span>'
  const linkTag = '<a href="' + url + '" style="font-size:12px;font-weight:700;color:' + b.color + ';text-decoration:none;white-space:nowrap">' + urlLabel + '</a>'
  if (b.logoBg) {
    return '<tr><td style="padding:16px 8px 8px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + b.logoBg + ';border-radius:10px"><tr>' +
      '<td valign="middle" width="70%" style="padding:16px 24px">' + imgTag + '</td>' +
      '<td valign="middle" width="30%" align="right" style="padding:16px 24px">' + linkTag + '</td>' +
      '</tr></table></td></tr>'
  }
  return '<tr><td style="padding:16px 8px 8px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td valign="middle" width="70%" style="padding:4px 0">' + imgTag + '</td>' +
    '<td valign="middle" width="30%" align="right" style="padding:4px 0">' + linkTag + '</td>' +
    '</tr></table><div style="height:1px;background:' + b.divider + ';margin-top:8px"></div></td></tr>'
}

function textBlockHtml(text, opts) {
  const fs = (opts && opts.fontSize) || 14
  const align = (opts && opts.align) || 'left'
  const wrapOpen = '<tr><td style="padding:16px 8px;font-size:' + fs + 'px;color:#1e293b;line-height:1.65;text-align:' + align + '">\n'
  const wrapClose = '</td></tr>'
  if (text && /<[a-z][\s\S]*>/i.test(text)) {
    let richHtml = sanitizeHtml(text)
    richHtml = richHtml.replace(/<h1[^>]*>/gi, '<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;font-family:system-ui,sans-serif">')
    richHtml = richHtml.replace(/<h2[^>]*>/gi, '<h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 10px;font-family:system-ui,sans-serif">')
    richHtml = richHtml.replace(/<h3[^>]*>/gi, '<h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 8px;font-family:system-ui,sans-serif">')
    richHtml = richHtml.replace(/<p[^>]*>/gi, '<p style="margin:0 0 14px">')
    richHtml = richHtml.replace(/<ul[^>]*>/gi, '<ul style="margin:0 0 14px;padding-left:20px">')
    richHtml = richHtml.replace(/<ol[^>]*>/gi, '<ol style="margin:0 0 14px;padding-left:20px">')
    richHtml = richHtml.replace(/<li[^>]*>/gi, '<li style="margin:0 0 4px">')
    richHtml = richHtml.replace(/<a /gi, '<a style="color:#2563eb;text-decoration:underline" ')
    return wrapOpen + richHtml + wrapClose
  }
  const lines = String(text || '').split('\n')
  let html = ''
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) html += '<p style="margin:0 0 14px">' + escapeHtml(lines[i]) + '</p>\n'
  }
  return wrapOpen + html + wrapClose
}

function productSingleHtml(p, lang) {
  return '<tr><td style="padding:8px 8px 16px"><table width="320" cellpadding="0" cellspacing="0" border="0" style="margin:0"><tr><td>' +
    productCardHtml(p, lang) + '</td></tr></table></td></tr>'
}

function productPairHtml(p1, p2, lang) {
  return '<tr><td style="padding:8px 8px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr class="prod-row">' +
    '<td class="col-half prod-cell" width="50%" valign="top" style="padding:0 5px 0 0">' + productCardHtml(p1, lang) + '</td>' +
    '<td class="col-half prod-cell" width="50%" valign="top" style="padding:0 0 0 5px">' + productCardHtml(p2, lang) + '</td>' +
    '</tr></table></td></tr>'
}

function productTrioHtml(p1, p2, p3, lang) {
  return '<tr><td style="padding:8px 8px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr class="prod-row">' +
    '<td class="col-third prod-cell" width="33%" valign="top" style="padding:0 4px 0 0">' + productCardCompactHtml(p1, lang) + '</td>' +
    '<td class="col-third prod-cell" width="33%" valign="top" style="padding:0 4px">' + productCardCompactHtml(p2, lang) + '</td>' +
    '<td class="col-third prod-cell" width="33%" valign="top" style="padding:0 0 0 4px">' + productCardCompactHtml(p3, lang) + '</td>' +
    '</tr></table></td></tr>'
}

function freebirdHtml(config, lang) {
  config = config || {}
  const youtubeUrl = config.youtubeUrl || 'https://www.youtube.com/watch?v=gp-x_jRBRcE'
  let thumbnailUrl = config.thumbnailOverride
  if (!thumbnailUrl && youtubeUrl) {
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (videoIdMatch) thumbnailUrl = 'https://img.youtube.com/vi/' + videoIdMatch[1] + '/hqdefault.jpg'
  }
  if (!thumbnailUrl) thumbnailUrl = 'https://artisjet-printers.eu/wp-content/uploads/2025/02/3000-pro-freebirdok.png'
  const videoLabel = lang==='fr'?'Voir la vidéo':lang==='de'?'Video ansehen':lang==='en'?'Watch video':lang==='nl'?'Video bekijken':'Ver vídeo'
  return '<tr><td style="padding:8px 8px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;overflow:hidden;background:#0f172a">' +
    '<tr><td style="text-align:center;padding:0">' +
    '<a href="' + youtubeUrl + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">' +
    '<img src="' + thumbnailUrl + '" alt="Video" width="480" style="width:100%;max-width:480px;display:block;margin:0 auto;opacity:0.85"/>' +
    '</a></td></tr>' +
    '<tr><td style="text-align:center;padding:12px 16px;background:#0f172a">' +
    '<a href="' + youtubeUrl + '" target="_blank" rel="noopener noreferrer" style="color:#93c5fd;font-size:14px;font-weight:700;text-decoration:none;font-family:system-ui,sans-serif">▶ ' + videoLabel + '</a>' +
    '</td></tr></table></td></tr>'
}

function pimpamHeroHtml(config, lang) {
  const cfg = config || {}
  const hi = (cfg.i18n && lang && lang !== 'es' && cfg.i18n[lang]) ? cfg.i18n[lang] : null
  const imgUrl = cfg.heroImage || 'https://pimpam-vending.com/wp-content/uploads/2026/01/ChatGPT-Image-22-ene-2026-16_17_36.png'
  const title = (hi && hi.heroTitle) || cfg.heroTitle || 'Personaliza, imprime y vende… sin operario'
  const subtitle = (hi && hi.heroSubtitle) || cfg.heroSubtitle || 'Impresión UV-LED directa sobre fundas de móvil en autoservicio completo.'
  const bullets = (hi && hi.heroBullets) || cfg.heroBullets || ['Autoservicio 100% — sin personal','Pago con tarjeta, móvil o QR','Funda impresa en HD en 30 segundos','Compatible con +600 modelos de móvil']
  const imgLink = cfg.heroImageLink || ''
  const ctaText = (hi && hi.heroCtaText) || cfg.heroCtaText || ''
  const ctaUrl = (hi && hi.heroCtaUrl) || cfg.heroCtaUrl || ''
  const bgColor = cfg.heroBgColor || '#fff'

  let isDark = false
  const hexMatch = bgColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (hexMatch) {
    const r = parseInt(hexMatch[1],16), g = parseInt(hexMatch[2],16), bv = parseInt(hexMatch[3],16)
    isDark = (r*0.299 + g*0.587 + bv*0.114) < 128
  }
  const titleColor = isDark ? '#ffffff' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'
  const bulletColor = isDark ? '#cbd5e1' : '#475569'
  const ctaBg = isDark ? (cfg.heroCtaColor || '#00d4ff') : '#ea580c'
  const ctaTextColor = isDark ? '#0f172a' : '#fff'

  // Email-safe image: a plain <img> with width:100% / height:auto. Gmail and
  // Outlook ignore position:absolute and padding-bottom percentage tricks,
  // which made the previous square-wrapper version render the body cell
  // much taller than the image. Letting the image keep its natural aspect
  // ratio while the row aligns middle keeps both columns visually balanced.
  let imgInner = '<img src="' + imgUrl + '" alt="Hero" width="270" style="display:block;width:100%;max-width:100%;height:auto;border-radius:10px 0 0 10px">'
  if (imgLink) {
    imgInner = '<a href="' + imgLink + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:block">' + imgInner + '</a>'
  }
  const imgHtml = imgInner

  let bulletsHtml = ''
  for (let i = 0; i < bullets.length; i++) {
    bulletsHtml += '<p style="font-size:12px;color:' + bulletColor + ';margin:0 0 4px;line-height:1.5">✓ ' + bullets[i] + '</p>'
  }

  let ctaHtml = ''
  let ctaButtons = cfg.heroCtaButtons || []
  if (ctaButtons.length === 0 && ctaText && ctaUrl) ctaButtons = [{ text: ctaText, url: ctaUrl }]
  if (hi && hi.heroCtaButtons && hi.heroCtaButtons.length > 0) ctaButtons = hi.heroCtaButtons
  if (ctaButtons.length > 0) {
    let btnCells = ''
    for (let bi = 0; bi < ctaButtons.length; bi++) {
      const btn = ctaButtons[bi]
      if (btn.text && btn.url) {
        const btnBg = btn.bg || ctaBg
        const btnTxtC = btn.color || ctaTextColor
        if (bi > 0) btnCells += '<td style="width:8px"></td>'
        btnCells += '<td style="background:' + btnBg + ';border-radius:6px;padding:9px 20px"><a href="' + btn.url + '" target="_blank" rel="noopener noreferrer" style="color:' + btnTxtC + ';font-size:13px;font-weight:700;text-decoration:none;font-family:system-ui,sans-serif;white-space:nowrap">' + btn.text + '</a></td>'
      }
    }
    if (btnCells) ctaHtml = '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px"><tr>' + btnCells + '</tr></table>'
  }

  return '<tr><td style="padding:12px 8px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + bgColor + ';border-radius:10px;overflow:hidden"><tr>' +
    '<td class="pp-img-cell" width="45%" valign="middle" style="padding:0;font-size:0;line-height:0">' + imgHtml + '</td>' +
    '<td class="pp-body-cell" valign="middle" style="padding:18px 20px 18px 18px">' +
    '<p style="font-size:17px;font-weight:900;color:' + titleColor + ';margin:0 0 10px;line-height:1.3">' + title + '</p>' +
    '<p style="font-size:13px;color:' + subColor + ';margin:0 0 12px;line-height:1.5">' + subtitle + '</p>' +
    bulletsHtml + ctaHtml +
    '</td></tr></table></td></tr>'
}

function pimpamStepsHtml(config, lang) {
  const cfg = config || {}
  const steps = cfg.steps || [
    {n:"1️⃣",t:"Elige diseño",s:"Pantalla táctil"},
    {n:"2️⃣",t:"Personaliza",s:"Texto, colores…"},
    {n:"3️⃣",t:"Paga",s:"Tarjeta / QR"},
    {n:"4️⃣",t:"¡Listo!",s:"Funda en 30s"},
  ]
  const bgColor = cfg.stepsBgColor || '#fff7ed'
  const borderColor = cfg.stepsBorderColor || '#fed7aa'
  let cells = ''
  for (let i = 0; i < steps.length; i++) {
    const pad = i===0?'0 4px 0 0':i===steps.length-1?'0 0 0 4px':'0 4px'
    cells += '<td class="step-cell" width="' + (100/steps.length) + '%" valign="top" style="padding:'+pad+'">' +
      '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;padding:10px;text-align:center">' +
      '<div style="font-size:22px;margin-bottom:4px">'+steps[i].n+'</div>' +
      '<p style="font-size:10px;font-weight:800;color:#0f172a;margin:0 0 2px">'+steps[i].t+'</p>' +
      '<p style="font-size:9px;color:#64748b;margin:0">'+steps[i].s+'</p></div></td>'
  }
  return '<tr><td style="padding:0 8px 16px"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'+cells+'</tr></table></td></tr>'
}

const CSS_BLOCK = '<style>' +
  'body,table,td,p,a,h1,h2,h3,h4{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}' +
  'table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}' +
  'img{border:0;display:block;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;max-width:100%}' +
  'body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;background:#ffffff;color:#1e293b}' +
  '@media only screen and (max-width:600px){' +
  '.wrap{width:100%!important}.col-half,.col-third{width:100%!important;display:block!important;padding:0 0 12px 0!important}' +
  '.prod-row{display:block!important;width:100%!important}.prod-cell{display:block!important;width:100%!important;padding:0 0 16px 0!important}' +
  '.prod-cell table{width:100%!important}.pp-img-cell{display:block!important;width:100%!important}' +
  '.pp-body-cell{display:block!important;width:100%!important;padding:18px 16px!important}' +
  '.step-cell{width:50%!important;display:inline-block!important;padding:0 4px 12px!important}' +
  '}' +
  '</style>'

function generateFullHtml(blocks, products, lang, brands, appState) {
  lang = lang || 'es'
  appState = appState || {}
  let rows = ''

  function resolveText(block) {
    // Per-lang rich HTML wins (newer schema). Fall back to legacy single
    // _richHtml only for ES so other languages don't get the wrong content.
    if (block._richHtmlByLang && block._richHtmlByLang[lang]) return block._richHtmlByLang[lang]
    if (block._richHtml != null && lang === 'es') return block._richHtml
    if (block._sourceType) return getTextInLanguage(block, lang, appState)
    if (block.i18n) return getLocalizedText(block, 'text', lang)
    return block.text || ''
  }

  function resolveHero(block) {
    if (block._sourceType) return getHeroDataInLanguage(block, lang, appState)
    return block
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    switch (b.type) {
      case 'text': {
        const resolvedText = resolveText(b)
        if (resolvedText) rows += textBlockHtml(resolvedText, { fontSize: b.fontSize, align: b.align })
        break
      }
      case 'brand_artisjet': rows += brandStripHtml(b.brand||'artisjet', lang, brands); break
      case 'brand_mbo': rows += brandStripHtml(b.brand||'mbo', lang, brands); break
      case 'brand_pimpam': rows += brandStripHtml(b.brand||'pimpam', lang, brands); break
      case 'brand_smartjet': rows += brandStripHtml(b.brand||'smartjet', lang, brands); break
      case 'brand_flux': rows += brandStripHtml(b.brand||'flux', lang, brands); break
      case 'brand_strip': rows += brandStripHtml(b.brand||'artisjet', lang, brands); break
      case 'product_single': {
        let ps = products.find(p => p.id === b.product1)
        if (ps) { ps = getLocalizedProduct(ps, lang); rows += productSingleHtml(ps, lang) }
        break
      }
      case 'product_pair': {
        let p1 = products.find(p => p.id === b.product1)
        let p2 = products.find(p => p.id === b.product2)
        if (p1 && p2) { p1 = getLocalizedProduct(p1, lang); p2 = getLocalizedProduct(p2, lang); rows += productPairHtml(p1, p2, lang) }
        break
      }
      case 'product_trio': {
        let pt1 = products.find(p => p.id === b.product1)
        let pt2 = products.find(p => p.id === b.product2)
        let pt3 = products.find(p => p.id === b.product3)
        if (pt1 && pt2 && pt3) { pt1 = getLocalizedProduct(pt1, lang); pt2 = getLocalizedProduct(pt2, lang); pt3 = getLocalizedProduct(pt3, lang); rows += productTrioHtml(pt1, pt2, pt3, lang) }
        break
      }
      case 'freebird':
      case 'video': rows += freebirdHtml(b.config || b, lang); break
      case 'hero':
      case 'product_hero':
      case 'pimpam_hero': {
        const heroData = resolveHero(b)
        if (heroData === b) rows += pimpamHeroHtml(b, lang)
        else rows += pimpamHeroHtml(heroData, null)
        break
      }
      case 'pimpam_steps': rows += pimpamStepsHtml(b.config || b, lang); break
      case 'composed': {
        const ibs = b.innerBlocks || []
        if (ibs.length === 0) {
          if (b.introText) ibs.push({type:'text', text:b.introText})
          if (b.brandStrip && b.brandStrip !== 'none') ibs.push({type:'brand_strip', brand:b.brandStrip})
          if (b.includeHero) ibs.push({type:'pimpam_hero'})
          const cProds = b.products || []
          if (b.blockType === 'product_trio' && cProds.length >= 3) ibs.push({type:'product_trio', product1:cProds[0], product2:cProds[1], product3:cProds[2]})
          else if (b.blockType === 'product_pair' && cProds.length >= 2) ibs.push({type:'product_pair', product1:cProds[0], product2:cProds[1]})
          else if (b.blockType === 'product_single' && cProds.length >= 1) ibs.push({type:'product_single', product1:cProds[0]})
          if (b.includeSteps) ibs.push({type:'pimpam_steps'})
        }
        ibs.forEach(ib => {
          if (ib.type === 'text') {
            const ibText = resolveText(ib)
            if (ibText) rows += textBlockHtml(ibText)
          } else if (ib.type === 'brand_strip' && ib.brand) {
            rows += brandStripHtml(ib.brand, lang, brands)
          } else if (ib.type === 'pimpam_hero') {
            const ibHero = resolveHero(ib)
            if (ibHero === ib) rows += pimpamHeroHtml(ib.heroImage ? ib : b, lang)
            else rows += pimpamHeroHtml(ibHero, null)
          } else if (ib.type === 'pimpam_steps') {
            rows += pimpamStepsHtml(ib.steps ? ib : b, lang)
          } else if (ib.type === 'separator') {
            rows += '<tr><td style="padding:8px 20px"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0"></td></tr>'
          } else if (ib.type === 'product_trio') {
            let ct1 = products.find(p => p.id === ib.product1)
            let ct2 = products.find(p => p.id === ib.product2)
            let ct3 = products.find(p => p.id === ib.product3)
            if (ct1 && ct2 && ct3) { ct1 = getLocalizedProduct(ct1, lang); ct2 = getLocalizedProduct(ct2, lang); ct3 = getLocalizedProduct(ct3, lang); rows += productTrioHtml(ct1, ct2, ct3, lang) }
          } else if (ib.type === 'product_pair') {
            let cp1 = products.find(p => p.id === ib.product1)
            let cp2 = products.find(p => p.id === ib.product2)
            if (cp1 && cp2) { cp1 = getLocalizedProduct(cp1, lang); cp2 = getLocalizedProduct(cp2, lang); rows += productPairHtml(cp1, cp2, lang) }
          } else if (ib.type === 'product_single') {
            let cps = products.find(p => p.id === ib.product1)
            if (cps) { cps = getLocalizedProduct(cps, lang); rows += productSingleHtml(cps, lang) }
          }
        })
        break
      }
    }
  }
  return '<html><head>'+CSS_BLOCK+'</head><body style="font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;margin:0;padding:0;background:#ffffff;color:#1e293b">' +
    '<table class="wrap" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">' + rows + '</table></body></html>'
}

/* ───────────── v3 → v2 BLOCK BRIDGE ─────────────
   Converts v3 block shapes into v2 block shapes that generateFullHtml expects.
   Supports both the v3-only simplified types (product/brandstrip/hero/header/footer)
   AND v2-native types coming straight from STANDALONE_BLOCKS (product_pair, pimpam_hero, etc.). */
function v3BlocksToV2Blocks(v3Blocks, appState) {
  const out = []
  const standalone = (appState && appState.standaloneBlocks) || []
  const composedList = (appState && appState.composedBlocks) || []
  const v3Brands = ((appState && appState.brands) || []).filter(b => b.id !== 'bomedia').map(b => b.id)

  function resolveStandaloneConfig(b) {
    if (b._sourceId) {
      const sb = standalone.find(s => s.id === b._sourceId)
      return (sb && sb.config) || {}
    }
    if (b.standaloneId) {
      const sb = standalone.find(s => s.id === b.standaloneId)
      return (sb && sb.config) || {}
    }
    return {}
  }

  for (const b of (v3Blocks || [])) {
    switch (b.type) {
      // ─── text ────────────────────────────────────────────────
      case 'text': {
        const src = b.textId
        const base = src
          ? { type:'text', _sourceType:'prewritten', _sourceId:src, _overrides:b.overridesByLang }
          : { type:'text', _sourceType:'manual', _overrides:b.overridesByLang || (b.overrideText ? { es:b.overrideText } : undefined) }
        if (b._richHtml != null) base._richHtml = b._richHtml
        if (b._richHtmlByLang) base._richHtmlByLang = b._richHtmlByLang
        // Carry the typography fields through so the renderer can apply them
        if (b.fontSize) base.fontSize = b.fontSize
        if (b.align) base.align = b.align
        out.push(base)
        break
      }

      // ─── products ────────────────────────────────────────────
      case 'product': {
        out.push({ type:'product_single', product1:b.productId })
        break
      }
      case 'product_single': {
        out.push({ type:'product_single', product1: b.product1 })
        break
      }
      case 'product_pair': {
        out.push({ type:'product_pair', product1: b.product1, product2: b.product2 })
        break
      }
      case 'product_trio': {
        out.push({ type:'product_trio', product1: b.product1, product2: b.product2, product3: b.product3 })
        break
      }

      // ─── brand strips ────────────────────────────────────────
      case 'brandstrip': {
        // v3-only: a multi-brand strip. Emit one brand_strip per enabled brand.
        const enabled = b.brands || v3Brands
        for (const brandId of enabled) out.push({ type:'brand_strip', brand:brandId })
        break
      }
      case 'brand_strip': {
        out.push({ type:'brand_strip', brand: b.brand })
        break
      }
      case 'brand_artisjet':
      case 'brand_mbo':
      case 'brand_pimpam':
      case 'brand_smartjet':
      case 'brand_flux': {
        out.push({ type: b.type, brand: b.brand || b.type.replace('brand_', '') })
        break
      }

      // ─── pimpam hero ─────────────────────────────────────────
      case 'hero': {
        // v3-only hero type → convert to pimpam_hero
        const heroSbConf = resolveStandaloneConfig(b)
        out.push({
          type: 'pimpam_hero',
          _sourceType: b._sourceType, _sourceId: b._sourceId, _overrides: b._overrides,
          heroTitle: b.heroTitle, heroSubtitle: b.heroSubtitle,
          heroBullets: b.heroBullets, heroCtaButtons: b.heroCtaButtons,
          heroImage: b.heroImage || heroSbConf.heroImage,
          heroBgColor: b.heroBgColor || heroSbConf.heroBgColor,
          heroCtaText: b.heroCtaText, heroCtaUrl: b.heroCtaUrl,
          heroImageLink: b.heroImageLink,
          i18n: heroSbConf.i18n,
        })
        break
      }
      case 'product_hero':
      case 'pimpam_hero': {
        const phSbConf = resolveStandaloneConfig(b)
        out.push({
          type: 'pimpam_hero',
          _sourceType: b._sourceType, _sourceId: b._sourceId, _overrides: b._overrides,
          heroTitle: b.heroTitle || phSbConf.heroTitle,
          heroSubtitle: b.heroSubtitle || phSbConf.heroSubtitle,
          heroBullets: (b.heroBullets && b.heroBullets.length) ? b.heroBullets : phSbConf.heroBullets,
          heroCtaButtons: (b.heroCtaButtons && b.heroCtaButtons.length) ? b.heroCtaButtons : phSbConf.heroCtaButtons,
          heroImage: b.heroImage || phSbConf.heroImage,
          heroBgColor: b.heroBgColor || phSbConf.heroBgColor,
          heroCtaText: b.heroCtaText || phSbConf.heroCtaText,
          heroCtaUrl: b.heroCtaUrl || phSbConf.heroCtaUrl,
          heroImageLink: b.heroImageLink || phSbConf.heroImageLink,
          i18n: phSbConf.i18n,
        })
        break
      }

      // ─── pimpam steps ────────────────────────────────────────
      case 'pimpam_steps': {
        const psSbConf = resolveStandaloneConfig(b)
        out.push({
          type: 'pimpam_steps',
          config: {
            steps: b.steps || psSbConf.steps,
            stepsBgColor: b.stepsBgColor || psSbConf.stepsBgColor,
            stepsBorderColor: b.stepsBorderColor || psSbConf.stepsBorderColor,
          }
        })
        break
      }

      // ─── video / freebird ────────────────────────────────────
      case 'video':
      case 'freebird': {
        const vSbConf = resolveStandaloneConfig(b)
        out.push({
          type: 'freebird',
          config: {
            youtubeUrl: b.youtubeUrl || vSbConf.youtubeUrl,
            thumbnailOverride: b.thumbnailOverride || vSbConf.thumbnailOverride,
          }
        })
        break
      }

      // ─── composed ───────────────────────────────────────────
      case 'composed': {
        const cb = b.composedId ? composedList.find(c => c.id === b.composedId) : null
        if (cb) {
          out.push(Object.assign({}, cb, { type: 'composed' }))
        }
        break
      }

      // ─── header / footer (v3-only) ──────────────────────────
      case 'header': {
        const headerBrand = b.brand || 'bomedia'
        const headerSub = b.subtitle || 'Distribuidor oficial'
        out.push({ type:'text', _sourceType:'manual', _overrides:{ es:'<h2 style="text-align:center;font-size:18px;font-weight:800;color:#1a1918;margin:0">' + escapeHtml(headerBrand) + '</h2><p style="text-align:center;font-size:11px;color:#6b7280;margin:4px 0 0">' + escapeHtml(headerSub) + '</p>' } })
        break
      }
      case 'footer': {
        const legal = b.legal || 'Bomedia S.L.'
        const contact = b.contact || 'info@bomedia.es'
        const unsub = b.showUnsubscribe !== false ? ' · <a href="#" style="color:#6b7280">Darse de baja</a>' : ''
        out.push({ type:'text', _sourceType:'manual', _overrides:{ es:'<p style="text-align:center;font-size:11px;color:#6b7280;margin:0">' + escapeHtml(legal) + ' · ' + escapeHtml(contact) + unsub + '</p>' } })
        break
      }

      default:
        break
    }
  }
  return out
}

function renderEmailHtml(v3Blocks, appState, lang) {
  const v2Blocks = v3BlocksToV2Blocks(v3Blocks, appState)
  return generateFullHtml(v2Blocks, (appState && appState.products) || [], lang || 'es', (appState && appState.brands) || [], appState)
}

Object.assign(window, {
  CSS_BLOCK, escapeHtml,
  productCardHtml, productCardCompactHtml, productSingleHtml, productPairHtml, productTrioHtml,
  brandStripHtml, textBlockHtml, freebirdHtml, pimpamHeroHtml, pimpamStepsHtml,
  generateFullHtml, v3BlocksToV2Blocks, renderEmailHtml,
})