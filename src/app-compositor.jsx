/* ───────────── COMPOSITOR VIEW ───────────── */

/* Always read live data published by App from appState — without this the
   Sidebar / BlockCard / CommandPalette show stale info after Backoffice
   edits (or after Supabase hydration with IDs different from the bundled
   defaults). */
const _liveProducts2 = () => (typeof window !== 'undefined' && window.PRODUCTS) || PRODUCTS || [];
const _liveBrands2   = () => (typeof window !== 'undefined' && window.BRANDS) || BRANDS || [];

/* Tiny localStorage-backed useState — used to persist sidebar filters */
function usePersistentState(key, defaultValue) {
  const [value, setValue] = React.useState(() => {
    try {
      const raw = localStorage.getItem('bomedia-ui-' + key);
      return raw != null ? JSON.parse(raw) : defaultValue;
    } catch (e) { return defaultValue; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('bomedia-ui-' + key, JSON.stringify(value)); } catch (e) {}
  }, [key, value]);
  return [value, setValue];
}

/* Parse a price string into a number (rough). Returns null for "Consultar" / "On request". */
function priceToNumber(price) {
  if (!price) return null;
  const s = String(price).toLowerCase();
  if (s.includes('consultar') || s.includes('request') || s.includes('demande') || s.includes('anfrage') || s.includes('aanvraag')) return null;
  // Strip currency, "desde/from/à partir de", "/mes" etc., keep digits and separators.
  const m = s.replace(/[€$]/g, '').match(/(\d[\d.,\s]*)/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/[.,\s]/g, ''));
  return Number.isFinite(num) ? num : null;
}

/* Map a numeric price into a coarse bucket for the price filter. */
function priceBucket(price) {
  const n = priceToNumber(price);
  if (n == null) return 'consultar';
  if (n < 10000) return 'low';
  if (n < 20000) return 'mid';
  return 'high';
}

/* Map a standalone blockType to the unified type filter taxonomy. */
function standaloneTypeKey(blockType) {
  if (blockType === 'pimpam_hero' || blockType === 'product_hero' || blockType === 'hero') return 'heroes';
  if (blockType === 'pimpam_steps') return 'pasos';
  if (blockType === 'video' || blockType === 'freebird') return 'videos';
  if (blockType === 'brand_strip') return 'marcas';
  if (blockType === 'product_single' || blockType === 'product_pair' || blockType === 'product_trio') return 'productos';
  return 'otros';
}

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'productos', label: 'Productos' },
  { id: 'compuestos', label: 'Compuestos' },
  { id: 'heroes', label: 'Heroes' },
  { id: 'videos', label: 'Vídeos' },
  { id: 'marcas', label: 'Marcas' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: '< 10k' },
  { id: 'mid', label: '10–20k' },
  { id: 'high', label: '≥ 20k' },
  { id: 'consultar', label: 'Consultar' },
];

/* Returns true if `id` is in the current user's per-collection hidden list. */
function isHiddenForUser(currentUser, collection, id) {
  if (!currentUser) return false;
  const list = currentUser.hiddenItems?.[collection];
  return Array.isArray(list) && list.includes(id);
}

function Sidebar({ collapsed, onToggle, blocks, onAddBlock, brandFilter, setBrandFilter, lang, currentUser }) {
  const [tab, setTab] = usePersistentState('sidebar-tab', 'library');
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = usePersistentState('sidebar-type', 'all');
  const [priceFilter, setPriceFilter] = usePersistentState('sidebar-price', 'all');

  if (collapsed) {
    return (
      <aside className="sidebar">
        <div className="sidebar-rail">
          <button className="rail-btn active" onClick={onToggle} title="Expandir">
            <Icon name="sidebar" />
          </button>
          <button className="rail-btn" title="Biblioteca"><Icon name="layers" /></button>
          <button className="rail-btn" title="Plantillas"><Icon name="template" /></button>
          <button className="rail-btn" title="Productos"><Icon name="box" /></button>
          <button className="rail-btn" title="Textos"><Icon name="text" /></button>
        </div>
      </aside>
    );
  }

  const q = search.trim().toLowerCase();
  const matchesQ = (s) => !q || (s || '').toLowerCase().includes(q);
  const matchesBrand = (b) => brandFilter === 'all' || b === brandFilter || b === 'mix';

  const showProducts = typeFilter === 'all' || typeFilter === 'productos';
  const showCompuestos = typeFilter === 'all' || typeFilter === 'compuestos';
  const showStandaloneType = (sbType) => {
    if (typeFilter === 'all') return true;
    return standaloneTypeKey(sbType) === typeFilter;
  };

  // Read live data published from appState (so Backoffice / Supabase edits are visible)
  // with fallback to the module-level defaults.
  const productsAll  = (typeof window !== 'undefined' && window.PRODUCTS) || PRODUCTS || [];
  const textsAll     = (typeof window !== 'undefined' && window.PREWRITTEN_TEXTS) || PREWRITTEN_TEXTS || [];
  const templatesAll = (typeof window !== 'undefined' && window.TEMPLATES) || TEMPLATES || [];
  const standaloneAll = (typeof window !== 'undefined' && window.STANDALONE_BLOCKS) || STANDALONE_BLOCKS || [];
  const composedAll  = (typeof window !== 'undefined' && window.COMPOSED_BLOCKS) || COMPOSED_BLOCKS || [];

  const filteredProducts = showProducts
    ? productsAll.filter(p =>
        p.visible !== false &&
        !isHiddenForUser(currentUser, 'products', p.id) &&
        matchesBrand(p.brand) &&
        matchesQ(p.name) &&
        (priceFilter === 'all' || priceBucket(p.price) === priceFilter)
      )
    : [];

  const filteredTexts = textsAll.filter(t =>
    t.visible !== false && !isHiddenForUser(currentUser, 'prewrittenTexts', t.id)
    && matchesBrand(t.brand) && (matchesQ(t.name) || matchesQ(t.text))
  );

  const filteredTemplates = templatesAll.filter(t =>
    t.visible !== false && !isHiddenForUser(currentUser, 'templates', t.id)
    && matchesBrand(t.brand) && (matchesQ(t.name) || matchesQ(t.desc))
  );

  const filteredStandalone = standaloneAll.filter(b =>
    b.visible !== false && !isHiddenForUser(currentUser, 'standaloneBlocks', b.id)
    && matchesBrand(b.brand) && matchesQ(b.title) && showStandaloneType(b.blockType || b.type)
  );
  // Composed blocks don't carry an explicit `brand` field — derive it from
  // brandStrip (preferred) or the first product, so the brand chip filter
  // actually has something to match against.
  const composedBrand = (c) => {
    if (c.brand) return c.brand;
    if (c.brandStrip && c.brandStrip !== 'none') return c.brandStrip;
    const firstPid = (c.products || [])[0];
    if (firstPid) {
      const p = productsAll.find(x => x.id === firstPid);
      if (p && p.brand) return p.brand;
    }
    return 'mix';
  };

  const filteredComposed = showCompuestos
    ? composedAll.filter(c =>
        c.visible !== false &&
        !isHiddenForUser(currentUser, 'composedBlocks', c.id) &&
        matchesBrand(composedBrand(c)) &&
        (matchesQ(c.title) || matchesQ(c.desc))
      )
    : [];

  const onLibraryTab = tab === 'library';
  const showPriceRow = onLibraryTab && (typeFilter === 'all' || typeFilter === 'productos');

  const totalLibrary = filteredProducts.length + filteredComposed.length + filteredStandalone.length;
  const noResults = onLibraryTab && totalLibrary === 0
    || tab === 'templates' && filteredTemplates.length === 0
    || tab === 'texts' && filteredTexts.length === 0;

  const resetFilters = () => {
    setSearch('');
    setBrandFilter('all');
    setTypeFilter('all');
    setPriceFilter('all');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Biblioteca</span>
        <button className="icon-btn" onClick={onToggle} title="Colapsar" style={{width:24,height:24}}>
          <Icon name="sidebar" size={14} />
        </button>
      </div>

      <div className="local-search">
        <Icon name="search" size={14} />
        <input
          placeholder="Buscar en biblioteca…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="brand-chips">
        <button
          className={'brand-chip' + (brandFilter === 'all' ? ' active' : '')}
          onClick={() => setBrandFilter('all')}
        >Todas</button>
        {BRANDS.filter(b => b.id !== 'bomedia').map(b => (
          <button
            key={b.id}
            className={'brand-chip' + (brandFilter === b.id ? ' active' : '')}
            onClick={() => setBrandFilter(b.id)}
            style={brandFilter === b.id ? {} : { color: b.color }}
          >
            <span className="brand-chip-dot" style={{ background: b.color }} />
            {b.label}
          </button>
        ))}
      </div>

      {onLibraryTab && (
        <>
          <div className="filter-row">
            <span className="filter-row-label">Tipo</span>
            {TYPE_FILTERS.map(f => (
              <button
                key={f.id}
                className={'filter-chip' + (typeFilter === f.id ? ' active' : '')}
                onClick={() => setTypeFilter(f.id)}
              >{f.label}</button>
            ))}
          </div>
          {showPriceRow && (
            <div className="filter-row">
              <span className="filter-row-label">Precio</span>
              {PRICE_FILTERS.map(f => (
                <button
                  key={f.id}
                  className={'filter-chip' + (priceFilter === f.id ? ' active' : '')}
                  onClick={() => setPriceFilter(f.id)}
                >{f.label}</button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="nav-tabs">
        {[
          { id: 'library', label: 'Bloques' },
          { id: 'templates', label: 'Plantillas' },
          { id: 'texts', label: 'Textos' },
        ].map(t => (
          <button
            key={t.id}
            className={'nav-tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      <div className="sidebar-body scroll">
        {onLibraryTab && (
          <>
            {filteredProducts.length > 0 && (
              <div className="group">
                <div className="group-header">
                  Productos <span className="count mono">{filteredProducts.length}</span>
                </div>
                {filteredProducts.map(p => {
                  const brand = BRANDS.find(b => b.id === p.brand);
                  return (
                    <button key={p.id} className="lib-item"
                            draggable
                            onClick={() => onAddBlock({ type: 'product', productId: p.id })}>
                      <div className={'lib-icon ' + p.brand}>
                        <img src={p.img} alt="" style={{width:28,height:28,objectFit:'contain'}} />
                      </div>
                      <div style={{minWidth:0}}>
                        <div className="lib-title">{p.name}</div>
                        <div className="lib-sub">{p.area} · <span className="mono">{p.price}</span></div>
                        <div className="lib-meta">
                          {brand && (
                            <span className="lib-brand-tag" style={{ color: brand.color }}>{brand.label}</span>
                          )}
                          {p.badge && (
                            <span className="lib-badge" style={{ background: p.badgeBg || 'var(--bg-sunken)', color: p.badgeColor || 'var(--text-muted)' }}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="lib-add"><Icon name="plus" size={14} /></span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredComposed.length > 0 && (
              <div className="group">
                <div className="group-header">
                  Compuestos <span className="count mono">{filteredComposed.length}</span>
                </div>
                {filteredComposed.map(c => {
                  const brand = BRANDS.find(b => b.id === c.brand);
                  return (
                    <button key={c.id} className="lib-item"
                            onClick={() => onAddBlock({ type: 'composed', composedId: c.id })}>
                      <div className={'lib-icon ' + (c.brand || 'mix')}>
                        <Icon name="layers" size={14} />
                      </div>
                      <div style={{minWidth:0}}>
                        <div className="lib-title">
                          {c.colorTag && <span className={'lib-color-tag ' + c.colorTag} />}
                          {c.title}
                        </div>
                        <div className="lib-sub">{c.desc}</div>
                        <div className="lib-meta">
                          {brand && (
                            <span className="lib-brand-tag" style={{ color: brand.color }}>{brand.label}</span>
                          )}
                          {c.priceRange && c.priceRange !== '-' && (
                            <span className="lib-badge" style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {c.priceRange}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="lib-add"><Icon name="plus" size={14} /></span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredStandalone.length > 0 && (
              <div className="group">
                <div className="group-header">
                  Composiciones <span className="count mono">{filteredStandalone.length}</span>
                </div>
                {filteredStandalone.map(b => {
                  const brand = BRANDS.find(x => x.id === b.brand);
                  return (
                    <button key={b.id} className="lib-item"
                            onClick={() => onAddBlock({ type: b.type, standaloneId: b.id })}>
                      <div className={'lib-icon ' + b.brand}>{b.icon}</div>
                      <div style={{minWidth:0}}>
                        <div className="lib-title">{b.title}</div>
                        <div className="lib-sub serif">{b.section}</div>
                        <div className="lib-meta">
                          {brand && b.brand !== 'mix' && (
                            <span className="lib-brand-tag" style={{ color: brand.color }}>{brand.label}</span>
                          )}
                        </div>
                      </div>
                      <span className="lib-add"><Icon name="plus" size={14} /></span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'templates' && (
          <div className="group">
            <div className="group-header">
              Plantillas <span className="count mono">{filteredTemplates.length}</span>
            </div>
            {filteredTemplates.map(t => {
              const brand = BRANDS.find(b => b.id === t.brand);
              return (
                <button key={t.id} className="lib-item"
                        onClick={() => onAddBlock({ type: 'template', templateId: t.id })}>
                  <div className={'lib-icon ' + t.brand}><Icon name="template" size={14} /></div>
                  <div style={{minWidth:0}}>
                    <div className="lib-title">
                      {t.colorClass && <span className={'lib-color-tag ' + t.colorClass} />}
                      {t.name}
                    </div>
                    <div className="lib-sub">{t.desc}</div>
                    <div className="lib-meta">
                      {brand && (
                        <span className="lib-brand-tag" style={{ color: brand.color }}>{brand.label}</span>
                      )}
                      <span className="lib-badge" style={{ background: 'var(--bg-sunken)', color: 'var(--text-muted)' }}>
                        {((t.blocks && t.blocks.length) || (t.compositorBlocks && t.compositorBlocks.length) || 0)} bloques
                      </span>
                    </div>
                  </div>
                  <span className="lib-add"><Icon name="plus" size={14} /></span>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'texts' && (
          <div className="group">
            <div className="group-header">
              Texto <span className="count mono">{filteredTexts.length + 1}</span>
            </div>
            {/* Always-on "blank text" item — adds an empty editable text block to the canvas */}
            <button className="lib-item"
                    onClick={() => onAddBlock({ type: 'text-blank' })}>
              <div className="lib-icon mix"><Icon name="text" size={14} /></div>
              <div style={{minWidth:0}}>
                <div className="lib-title">Texto en blanco</div>
                <div className="lib-sub">Bloque vacío para escribir desde cero</div>
                <div className="lib-meta">
                  <span className="lib-badge" style={{background:'color-mix(in oklch, var(--accent) 12%, transparent)', color:'var(--accent-ink)', fontWeight:600}}>nuevo</span>
                </div>
              </div>
              <span className="lib-add"><Icon name="plus" size={14} /></span>
            </button>
            {filteredTexts.map(t => {
              const brand = BRANDS.find(b => b.id === t.brand);
              return (
                <button key={t.id} className="lib-item"
                        onClick={() => onAddBlock({ type: 'text', textId: t.id })}>
                  <div className={'lib-icon ' + t.brand}>{t.icon}</div>
                  <div style={{minWidth:0}}>
                    <div className="lib-title">{t.name}</div>
                    <div className="lib-sub">{(t.text || '').slice(0, 60)}…</div>
                    <div className="lib-meta">
                      {brand && t.brand !== 'mix' && (
                        <span className="lib-brand-tag" style={{ color: brand.color }}>{brand.label}</span>
                      )}
                    </div>
                  </div>
                  <span className="lib-add"><Icon name="plus" size={14} /></span>
                </button>
              );
            })}
          </div>
        )}

        {noResults && (
          <div style={{padding:'24px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:12}}>
            <div className="serif" style={{fontSize:14, marginBottom:6}}>Sin resultados</div>
            <div style={{fontSize:11, marginBottom:10}}>Prueba a quitar algún filtro o cambiar el término.</div>
            <button className="btn btn-ghost" style={{fontSize:11}} onClick={resetFilters}>
              <Icon name="x" size={11} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* Small reusable mini-card for product references inside a block. */
function MiniProduct({ p, lang, compact }) {
  if (!p) {
    return (
      <div style={{
        border:'1px dashed var(--border-strong)', borderRadius:'var(--r-sm)',
        padding:12, textAlign:'center', fontSize:11, color:'var(--text-subtle)',
      }}>
        Producto no seleccionado
      </div>
    );
  }
  const lp = (typeof getLocalizedProduct === 'function') ? getLocalizedProduct(p, lang) : p;
  return (
    <div style={{
      border: '1px solid ' + (p.brand === 'pimpam' ? '#fed7aa' : 'var(--border)'),
      borderRadius: 'var(--r-sm)',
      background: p.brand === 'pimpam' ? '#fff7ed' : 'var(--bg-panel)',
      padding: compact ? 8 : 10,
      overflow: 'hidden',
    }}>
      <div style={{textAlign:'center', marginBottom:6}}>
        <img src={lp.img} alt="" style={{maxWidth:'100%', maxHeight: compact ? 70 : 100, objectFit:'contain'}} />
      </div>
      {lp.badge && (
        <span style={{
          display:'inline-block', fontSize:8, fontWeight:800, letterSpacing:1,
          textTransform:'uppercase', padding:'2px 6px', borderRadius:10,
          background: lp.badgeBg || '#f1f5f9', color: lp.badgeColor || '#475569',
          marginBottom: 4,
        }}>{lp.badge}</span>
      )}
      <div style={{fontWeight:800, fontSize: compact ? 11 : 12, color:'var(--text)'}}>{lp.name}</div>
      {!compact && (
        <div style={{fontSize:10, color:'var(--text-muted)', marginTop:3, lineHeight:1.4}}>
          {lp.desc}
        </div>
      )}
      <div style={{fontWeight:800, fontSize: compact ? 11 : 13, color: lp.accent || 'var(--text)', marginTop:6, textAlign:'center'}}>
        {lp.price}
      </div>
    </div>
  );
}

/* Single-brand strip (logo + localized URL). */
function BrandStripPreview({ brandId, lang }) {
  const _brands = (typeof window !== 'undefined' && window.BRANDS) || BRANDS || [];
  const b = _brands.find(x => x.id === brandId);
  if (!b) return <div style={{padding:12, fontSize:12, color:'var(--text-subtle)'}}>Marca no encontrada: {brandId}</div>;
  const url = (typeof b.url === 'object') ? (b.url[lang] || b.url.es) : b.url;
  const urlLabel = (typeof b.urlLabel === 'object') ? (b.urlLabel[lang] || b.urlLabel.es) : b.urlLabel;
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, padding:'12px 4px', borderBottom: `1px solid ${b.divider || 'var(--border)'}`}}>
      {b.logo ? (
        <img src={b.logo} alt={b.label} style={{maxHeight: (b.logoHeight || 22) + 'px', maxWidth:180, width:'auto', height:'auto'}} />
      ) : (
        <strong style={{color: b.color, fontSize:14}}>{b.label}</strong>
      )}
      <a href={url || '#'} target="_blank" rel="noreferrer" style={{
        marginLeft:'auto', fontSize:12, fontWeight:700,
        color:b.color, textDecoration:'none', whiteSpace:'nowrap',
      }} onClick={e => e.stopPropagation()}>
        {urlLabel}
      </a>
    </div>
  );
}

/* Inline editor for text blocks rendered inside the canvas. Always rich —
   plain mode was confusing and added little value (the toggle constantly
   needed re-syncing). Plain content from old blocks is auto-promoted to
   rich on first display. */
function InlineTextBlock({ block, text, selected, lang, onUpdate }) {
  const [aiOpen, setAiOpen] = React.useState(false);

  // Resolve the source text in the current language. Prewritten texts have
  // translations under text.i18n[lang].text — without this, the canvas
  // would always show Spanish even when EN/FR/DE/NL are active.
  const localizedSourceText = (text && typeof window.getLocalizedText === 'function')
    ? window.getLocalizedText(text, 'text', lang)
    : (text?.text || '');
  const plainSeed = block.overridesByLang?.[lang] ?? block.overrideText ?? localizedSourceText ?? '';
  // Rich HTML is now stored per-language. Legacy blocks with a single
  // _richHtml string are honoured for ES.
  const richByLang = block._richHtmlByLang || {};
  const legacyRich = lang === 'es' && typeof block._richHtml === 'string' ? block._richHtml : null;
  const storedRich = richByLang[lang] ?? legacyRich;
  const richHtml = storedRich != null
    ? storedRich
    : (plainSeed
      ? '<p>' + String(plainSeed).split('\n').filter(Boolean).join('</p><p>') + '</p>'
      : '');
  const fontSize = block.fontSize || 14;

  const setRich = (html) => {
    const stripped = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const nextRichByLang = { ...(block._richHtmlByLang || {}), [lang]: html };
    const next = {
      ...block,
      _richHtmlByLang: nextRichByLang,
      overridesByLang: { ...block.overridesByLang, [lang]: stripped },
    };
    // Drop the legacy single-string field so it doesn't shadow per-lang
    if ('_richHtml' in next) delete next._richHtml;
    onUpdate(block.id, next);
  };

  const applyAi = (generated) => {
    const html = '<p>' + generated.split(/\n\n+/).map(p => p.trim()).filter(Boolean).join('</p><p>') + '</p>';
    setRich(html);
  };

  // Read-only preview when not selected
  if (!selected) {
    const sanitized = (typeof window !== 'undefined' && window.sanitizeHtml) ? window.sanitizeHtml(richHtml || '') : (richHtml || '');
    return (
      <div className="block-text">
        <div
          className="block-text-rich"
          style={{ padding: '8px 0', minHeight: 60, textAlign: block.align || 'left', fontSize: fontSize + 'px' }}
          dangerouslySetInnerHTML={{ __html: sanitized || '<span style="color:var(--text-subtle); font-style:italic">Texto vacío</span>' }}
        />
      </div>
    );
  }

  // Selected: rich editor inline
  return (
    <div className="block-text inline-edit" onClick={e => e.stopPropagation()}>
      <div className="inline-edit-toolbar">
        <button className="btn btn-ghost" style={{fontSize:11, padding:'4px 10px', marginLeft:'auto'}} onClick={() => setAiOpen(true)} title="Generar/reescribir con IA">
          <Icon name="sparkles" size={11} /> IA
        </button>
      </div>
      {typeof RichTextEditor !== 'undefined'
        ? <RichTextEditor value={richHtml || ''} onChange={setRich} placeholder="Escribe el texto…" fontSize={fontSize} />
        : <div style={{padding:10, fontSize:12, color:'var(--text-muted)'}}>RichTextEditor no cargado.</div>}
      {aiOpen && typeof window.AiTextPopover === 'function' && (
        <window.AiTextPopover
          lang={lang}
          currentText={(richHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
          onApply={applyAi}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}

function BlockCard({ block, idx, total, selected, onSelect, onUpdate, onDelete, onMove, onDuplicate, lang }) {
  // Read live data published from appState — never the frozen module-level
  // copy (otherwise blocks added from templates with newer product IDs show
  // "no seleccionado").
  const _products = (typeof window !== 'undefined' && window.PRODUCTS) || PRODUCTS || [];
  const _texts = (typeof window !== 'undefined' && window.PREWRITTEN_TEXTS) || PREWRITTEN_TEXTS || [];
  const _brands = (typeof window !== 'undefined' && window.BRANDS) || BRANDS || [];

  const product = block.type === 'product' && _products.find(p => p.id === block.productId);
  const text = block.type === 'text' && _texts.find(t => t.id === block.textId);

  // Derive brand for the top-bar dot
  const typeBrandFromPrefix = block.type && block.type.startsWith('brand_') && block.type !== 'brand_strip'
    ? block.type.replace('brand_', '') : null;
  const pairFirstProd = (block.type === 'product_single' || block.type === 'product_pair' || block.type === 'product_trio') && _products.find(p => p.id === block.product1);
  const brandId = product?.brand || text?.brand || block.brand || typeBrandFromPrefix || pairFirstProd?.brand || 'mix';
  const brand = _brands.find(b => b.id === brandId);

  const typeLabel = {
    text: 'Texto',
    product: 'Producto',
    product_single: 'Producto',
    product_pair: '2 Productos',
    product_trio: '3 Productos',
    // Unified hero: pimpam_hero / product_hero / hero all surface as "Hero"
    hero: 'Hero',
    pimpam_hero: 'Hero',
    product_hero: 'Hero',
    pimpam_steps: '4 Pasos',
    brand_strip: 'Strip de marca',
    brand_artisjet: 'Strip artisJet',
    brand_mbo: 'Strip MBO',
    brand_pimpam: 'Strip PimPam',
    brand_flux: 'Strip FLUX',
    freebird: 'Vídeo YouTube',
    video: 'Vídeo',
    brandstrip: 'Strip multi-marca',
    header: 'Cabecera',
    footer: 'Pie',
    composed: 'Bloque compuesto',
  }[block.type] || block.type;

  // Treat the three legacy hero variants as a single "Hero" concept for
  // rendering — same fields, same editor, same email markup.
  const isHero = block.type === 'pimpam_hero' || block.type === 'product_hero' || block.type === 'hero';

  // Look up a composed block (for type='composed') — prefer live appState data via window.*
  const composedSource = (typeof window !== 'undefined' && window.COMPOSED_BLOCKS) || (typeof COMPOSED_BLOCKS !== 'undefined' ? COMPOSED_BLOCKS : []);
  const composed = block.type === 'composed' && block.composedId
    ? composedSource.find(c => c.id === block.composedId)
    : null;

  // Look up standalone source (for hero/steps/video) — prefer live data.
  // Accept either `_sourceId` (older blocks) or `standaloneId` (set by
  // addBlock when picked from the sidebar) so the hero variants from
  // Supabase resolve correctly.
  const standaloneSource = (typeof window !== 'undefined' && window.STANDALONE_BLOCKS) || (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []);
  const sbLookupId = block._sourceId || block.standaloneId;
  const sbSource = sbLookupId
    ? standaloneSource.find(s => s.id === sbLookupId)
    : null;

  return (
    <div className={'block' + (selected ? ' selected' : '')} onClick={() => onSelect(block.id)}>
      {selected && <span className="block-edit-hint">Editando</span>}
      <div className="block-bar">
        <span className="block-handle" title="Arrastrar">
          <Icon name="drag" size={14} />
        </span>
        <span className="block-tag">
          <span className="dot" style={{ background: brand?.color || 'var(--text-subtle)' }} />
          {typeLabel}
        </span>
        {product && (
          <span style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>
            {product.name}
          </span>
        )}
        {text && (
          <span style={{fontSize:11, color:'var(--text-muted)'}}>
            {text.name}
          </span>
        )}
        <div className="block-bar-actions">
          <button className="block-action edit-btn" onClick={e => { e.stopPropagation(); onSelect(block.id); }} title="Editar bloque" style={{
            paddingLeft: 8, paddingRight: 8, width: 'auto',
            background: selected ? 'var(--accent)' : 'transparent',
            color: selected ? 'white' : 'var(--text-muted)',
            fontSize: 11, fontWeight: 500, gap: 4, display:'inline-flex', alignItems:'center',
          }}>
            <Icon name="settings" size={12} />
            {selected ? 'Editando' : 'Editar'}
          </button>
          <button className="block-action" disabled={idx === 0} onClick={e => { e.stopPropagation(); onMove(block.id, -1); }} title="Subir">
            <Icon name="arrowUp" size={13} />
          </button>
          <button className="block-action" disabled={idx === total - 1} onClick={e => { e.stopPropagation(); onMove(block.id, 1); }} title="Bajar">
            <Icon name="arrowDown" size={13} />
          </button>
          <button className="block-action" onClick={e => { e.stopPropagation(); onDuplicate(block.id); }} title="Duplicar">
            <Icon name="copy" size={13} />
          </button>
          <button className="block-action danger" onClick={e => { e.stopPropagation(); onDelete(block.id); }} title="Eliminar">
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>

      <div className="block-body">
        {block.type === 'text' && (
          <InlineTextBlock
            block={block}
            text={text}
            selected={selected}
            lang={lang}
            onUpdate={onUpdate}
          />
        )}

        {block.type === 'product' && product && (() => {
          const ov = block.overrides?.[lang] || {};
          const showPrice = block.showPrice !== false;
          const showSpecs = block.showSpecs !== false;
          return (
          <div className="prod-card">
            <img src={ov.img ?? product.img} alt={ov.name ?? product.name} className="prod-img" />
            <div className="prod-info">
              <div className="prod-name">{ov.name ?? product.name}</div>
              <div className="prod-desc">{ov.desc ?? product.desc}</div>
              {showSpecs && (
                <div className="prod-meta">
                  <span className="prod-meta-item">{ov.area ?? product.area}</span>
                  <span className="prod-meta-item">{ov.feat1 ?? product.feat1}</span>
                  <span className="prod-meta-item">{ov.feat2 ?? product.feat2}</span>
                </div>
              )}
              {showPrice && (
                <div className="prod-select">
                  <span>Precio</span>
                  <span className="prod-price">{ov.price ?? product.price}</span>
                </div>
              )}
              {block.showCta && (
                <div style={{marginTop:8}}>
                  <span style={{display:'inline-block', padding:'6px 12px', background:'var(--bg-inverse)', color:'var(--bg)', borderRadius:'var(--r-sm)', fontSize:12, fontWeight:600}}>
                    {block.ctaText || 'Más información'}
                  </span>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {block.type === 'brandstrip' && (
          <div className="brand-strip-preview">
            {BRANDS.filter(b => b.id !== 'bomedia').map(b => (
              <span key={b.id} style={{ color: b.color, fontWeight: 600 }}>{b.logoText}</span>
            ))}
          </div>
        )}

        {(block.type === 'brand_strip'
          || block.type === 'brand_artisjet' || block.type === 'brand_mbo'
          || block.type === 'brand_pimpam' || block.type === 'brand_flux') && (
          <BrandStripPreview
            brandId={block.brand || (block.type.startsWith('brand_') && block.type !== 'brand_strip' ? block.type.replace('brand_','') : 'artisjet')}
            lang={lang}
          />
        )}

        {block.type === 'product_single' && (() => {
          const p = _products.find(x => x.id === block.product1);
          return (
            <div style={{maxWidth:320, margin:'0 auto'}}>
              <MiniProduct p={p} lang={lang} />
            </div>
          );
        })()}

        {block.type === 'product_pair' && (() => {
          const p1 = _products.find(x => x.id === block.product1);
          const p2 = _products.find(x => x.id === block.product2);
          return (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <MiniProduct p={p1} lang={lang} />
              <MiniProduct p={p2} lang={lang} />
            </div>
          );
        })()}

        {block.type === 'product_trio' && (() => {
          const p1 = _products.find(x => x.id === block.product1);
          const p2 = _products.find(x => x.id === block.product2);
          const p3 = _products.find(x => x.id === block.product3);
          return (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6}}>
              <MiniProduct p={p1} lang={lang} compact />
              <MiniProduct p={p2} lang={lang} compact />
              <MiniProduct p={p3} lang={lang} compact />
            </div>
          );
        })()}

        {isHero && (() => {
          const cfg = Object.assign({}, sbSource?.config || {}, block);
          const ovr = (block._overrides && block._overrides[lang]) || {};
          const hi = cfg.i18n && cfg.i18n[lang] ? cfg.i18n[lang] : null;
          const title = ovr.heroTitle || (hi && hi.heroTitle) || cfg.heroTitle || 'Personaliza, imprime y vende';
          const subtitle = ovr.heroSubtitle || (hi && hi.heroSubtitle) || cfg.heroSubtitle || '';
          const bullets = ovr.heroBullets || (hi && hi.heroBullets) || cfg.heroBullets || [];
          const img = cfg.heroImage;
          const bg = cfg.heroBgColor || '#fff';
          let ctas = cfg.heroCtaButtons || [];
          if (!ctas.length && cfg.heroCtaText && cfg.heroCtaUrl) ctas = [{text:cfg.heroCtaText, url:cfg.heroCtaUrl}];
          return (
            <div style={{display:'flex', gap:14, padding:14, background:bg, borderRadius:'var(--r-md)', border:'1px solid var(--border)'}}>
              {img && (
                <div style={{flexShrink:0, width:120, height:120, borderRadius:'var(--r-sm)', overflow:'hidden'}}>
                  <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
              )}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:800, fontSize:14, color:'#0f172a'}}>{title}</div>
                {subtitle && <div style={{fontSize:12, color:'var(--text-muted)', margin:'4px 0 6px', lineHeight:1.5}}>{subtitle}</div>}
                {bullets.length > 0 && (
                  <ul style={{margin:'4px 0 0', padding:0, listStyle:'none'}}>
                    {bullets.map((b, i) => (
                      <li key={i} style={{fontSize:11, color:'var(--text-muted)', margin:'2px 0'}}>✓ {b}</li>
                    ))}
                  </ul>
                )}
                {ctas.length > 0 && (
                  <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                    {ctas.map((c, i) => c.text && (
                      <span key={i} style={{
                        display:'inline-block', padding:'5px 10px', borderRadius:6,
                        background: c.bg || '#ea580c', color: c.color || '#fff',
                        fontSize:11, fontWeight:700,
                      }}>{c.text}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {block.type === 'pimpam_steps' && (() => {
          const cfg = Object.assign({}, sbSource?.config || {}, block);
          const steps = cfg.steps || [];
          const bg = cfg.stepsBgColor || '#fff7ed';
          const border = cfg.stepsBorderColor || '#fed7aa';
          if (!steps.length) {
            return <div style={{padding:12, fontSize:12, color:'var(--text-subtle)'}}>Sin pasos configurados</div>;
          }
          return (
            <div style={{display:'grid', gridTemplateColumns:`repeat(${steps.length}, 1fr)`, gap:6}}>
              {steps.map((s, i) => (
                <div key={i} style={{background:bg, border:`1px solid ${border}`, borderRadius:'var(--r-sm)', padding:10, textAlign:'center'}}>
                  <div style={{fontSize:20, marginBottom:4}}>{s.n}</div>
                  <div style={{fontWeight:800, fontSize:11, color:'#0f172a'}}>{s.t}</div>
                  <div style={{fontSize:10, color:'var(--text-muted)', marginTop:2}}>{s.s}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {(block.type === 'freebird' || block.type === 'video') && (() => {
          const cfg = Object.assign({}, sbSource?.config || {}, block);
          const yt = cfg.youtubeUrl || 'https://www.youtube.com/watch?v=gp-x_jRBRcE';
          const m = yt.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
          const thumb = cfg.thumbnailOverride || (m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '');
          const videoLabel = lang==='fr'?'Voir la vidéo':lang==='de'?'Video ansehen':lang==='en'?'Watch video':lang==='nl'?'Video bekijken':'Ver vídeo';
          return (
            <div style={{borderRadius:'var(--r-md)', overflow:'hidden', background:'#0f172a'}}>
              {thumb && <img src={thumb} alt="" style={{display:'block', width:'100%', opacity:0.85}} />}
              <div style={{padding:'10px 14px', color:'#93c5fd', fontSize:13, fontWeight:700, textAlign:'center'}}>
                ▶ {videoLabel}
              </div>
            </div>
          );
        })()}

        {block.type === 'composed' && (() => {
          const cb = composed;
          if (!cb) return <div style={{padding:12, fontSize:12, color:'var(--text-subtle)'}}>Bloque compuesto no encontrado</div>;
          const intro = (cb.i18n && cb.i18n[lang] && cb.i18n[lang].introText) || cb.introText || '';
          const prods = (cb.products || []).map(pid => _products.find(p => p.id === pid)).filter(Boolean);
          return (
            <div style={{padding:12, border:'1px dashed var(--border-strong)', borderRadius:'var(--r-md)'}}>
              <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:1, color:'var(--text-subtle)', fontFamily:'var(--font-mono)'}}>
                Compuesto · {cb.blockType}
              </div>
              <div style={{fontWeight:700, fontSize:13, marginTop:4}}>{cb.title}</div>
              {intro && (
                <p style={{fontSize:12, color:'var(--text-muted)', margin:'6px 0 0', lineHeight:1.5}}>
                  {intro.length > 160 ? intro.slice(0,160) + '…' : intro}
                </p>
              )}
              {cb.brandStrip && cb.brandStrip !== 'none' && (
                <div style={{fontSize:11, color:'var(--text-subtle)', marginTop:6}}>→ Strip {cb.brandStrip}</div>
              )}
              {prods.length > 0 && (
                <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'wrap'}}>
                  {prods.map(p => (
                    <div key={p.id} style={{display:'flex', alignItems:'center', gap:6, background:'var(--bg-sunken)', padding:'3px 8px', borderRadius:4, fontSize:11}}>
                      <img src={p.img} alt="" style={{width:18, height:18, objectFit:'contain'}} />
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {cb.includeHero && <div style={{fontSize:11, color:'var(--text-subtle)', marginTop:6}}>+ Hero PimPam</div>}
              {cb.includeSteps && <div style={{fontSize:11, color:'var(--text-subtle)', marginTop:6}}>+ 4 pasos</div>}
            </div>
          );
        })()}

        {block.type === 'header' && (
          <div style={{padding:'14px 16px', background:'var(--bg-inverse)', color:'var(--bg)', borderRadius:'var(--r-sm)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <strong style={{fontSize:14}}>bomedia</strong>
            <span style={{fontSize:11, opacity:.7, fontFamily:'var(--font-mono)'}}>cabecera corporativa</span>
          </div>
        )}

        {block.type === 'footer' && (
          <div style={{padding:'12px 16px', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', fontSize:11, color:'var(--text-muted)', textAlign:'center'}}>
            Bomedia S.L. · Aviso legal · Política de privacidad · Darse de baja
          </div>
        )}
      </div>
    </div>
  );
}

function Canvas({ blocks, onUpdate, onDelete, onMove, onDuplicate, selectedId, setSelectedId, onOpenPalette, onAddBlock, onClearBlocks, onExpandPreview, editingTemplate, onExitTemplateEdit, onSaveCurrentTemplate, onSaveAsTemplate, lang, variant, emailHtml }) {
  const liveTemplates = (typeof window !== 'undefined' && window.TEMPLATES) || TEMPLATES || [];
  const visibleTemplates = liveTemplates.filter(t => t.visible !== false).slice(0, 6);
  const [toast, setToast] = React.useState('');
  const [htmlMenu, setHtmlMenu] = React.useState(false);
  const [saveTplModal, setSaveTplModal] = React.useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([emailHtml || '<html><body></body></html>'], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bomedia-email-' + new Date().toISOString().slice(0, 10) + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setHtmlMenu(false);
    showToast('HTML descargado');
  };

  const handleCopyHtml = async () => {
    const r = (typeof copyHtmlAsRich === 'function')
      ? await copyHtmlAsRich(emailHtml || '')
      : { ok: false, mode: null };
    if (r.ok && r.mode === 'rich') showToast('HTML copiado · pégalo en Gmail/Outlook y verás el email renderizado');
    else if (r.ok) showToast('HTML copiado (texto plano)');
    else showToast('No se pudo copiar (revisa permisos)');
    setHtmlMenu(false);
  };

  const handleSend = async () => {
    // Copy HTML as rich so Gmail/Outlook pastes the rendered email, then
    // open a blank mailto so the user picks the recipient.
    if (typeof copyHtmlAsRich === 'function') await copyHtmlAsRich(emailHtml || '');
    const subject = encodeURIComponent('Información Bomedia · Impresoras UV-LED');
    window.location.href = 'mailto:?subject=' + subject;
    showToast('HTML copiado · pégalo en el cuerpo del email');
  };

  const handleClear = () => {
    if (blocks.length === 0) return;
    const ok = window.confirm('¿Vaciar el lienzo? Se eliminarán los ' + blocks.length + ' bloques actuales.');
    if (ok && onClearBlocks) onClearBlocks();
  };

  // Close HTML menu on outside click
  React.useEffect(() => {
    if (!htmlMenu) return;
    const close = () => setHtmlMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [htmlMenu]);

  const inTplMode = !!editingTemplate;

  const handleSaveTpl = () => {
    if (onSaveCurrentTemplate) {
      onSaveCurrentTemplate();
      showToast('Plantilla "' + editingTemplate.name + '" actualizada');
    }
  };

  const handleSaveAsNewTpl = (name, brand, colorClass) => {
    const tpl = onSaveAsTemplate && onSaveAsTemplate(name, { brand, colorClass });
    setSaveTplModal(false);
    if (tpl) showToast('Plantilla "' + tpl.name + '" creada');
  };

  return (
    <main className="canvas scroll">
      <div className="canvas-inner">
        {inTplMode && (
          <div className="tpl-mode-banner">
            <Icon name="template" size={13} />
            <span>Editando plantilla: <strong>{editingTemplate.name}</strong></span>
            <span className="mono" style={{fontSize:10, opacity:0.7, marginLeft:4}}>· {blocks.length} bloques</span>
            <button className="btn btn-primary" style={{fontSize:11, padding:'4px 10px', marginLeft:'auto'}} onClick={handleSaveTpl}>
              <Icon name="zap" size={11}/> Guardar plantilla
            </button>
            <button className="btn btn-ghost" style={{fontSize:11, padding:'4px 10px'}} onClick={onExitTemplateEdit}>
              Salir sin guardar
            </button>
          </div>
        )}
        <div className="canvas-header">
          <div>
            {variant === 'serif' ? (
              <h1 className="canvas-title">
                {inTplMode ? <span style={{fontStyle:'italic'}}>{editingTemplate.name}</span> : <>Email <span style={{fontStyle:'italic'}}>sin título</span></>}
              </h1>
            ) : (
              <h1 className="canvas-title-plain">{inTplMode ? editingTemplate.name : 'Email sin título'}</h1>
            )}
            <div className="canvas-meta" style={{marginTop:6}}>
              <span className="sync-ok">●</span>
              <span>{inTplMode ? 'Plantilla' : 'Sincronizado'}</span>
              <span className="dot" />
              <span>{blocks.length} bloques</span>
              <span className="dot" />
              <span>{lang.toUpperCase()}</span>
            </div>
          </div>
          <div style={{display:'flex', gap:8, position:'relative', flexWrap:'wrap', justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={handleClear} title="Vaciar el lienzo y empezar uno nuevo">
              <Icon name="plus" size={14} /> Nuevo
            </button>
            {!inTplMode && onSaveAsTemplate && (
              <button className="btn btn-ghost" onClick={() => setSaveTplModal(true)} disabled={blocks.length === 0} title="Guardar este email como plantilla reutilizable">
                <Icon name="template" size={14} /> Guardar como plantilla
              </button>
            )}
            <div style={{position:'relative'}}>
              <button className="btn btn-outline" onClick={e => { e.stopPropagation(); setHtmlMenu(v => !v); }}>
                <Icon name="code" size={14} /> HTML
              </button>
              {htmlMenu && (
                <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
                  <button className="dropdown-item" onClick={handleCopyHtml}>
                    <Icon name="copy" size={13} /> Copiar al portapapeles
                  </button>
                  <button className="dropdown-item" onClick={handleDownloadHtml}>
                    <Icon name="download" size={13} /> Descargar .html
                  </button>
                  {onExpandPreview && (
                    <button className="dropdown-item" onClick={() => { onExpandPreview(); setHtmlMenu(false); }}>
                      <Icon name="eye" size={13} /> Vista previa ampliada
                    </button>
                  )}
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSend} disabled={inTplMode}>
              <Icon name="send" size={14} /> Enviar
            </button>
          </div>
        </div>
        {toast && <div className="canvas-toast">{toast}</div>}
        {saveTplModal && (
          <SaveAsTemplateModal
            onClose={() => setSaveTplModal(false)}
            onSave={handleSaveAsNewTpl}
            blocksCount={blocks.length}
          />
        )}

        {blocks.length === 0 ? (
          <div className="empty">
            <div className="empty-ill">
              <Icon name="layers" size={32} />
            </div>
            <div className="empty-title">Un lienzo en blanco</div>
            <div className="empty-sub">Empieza con una plantilla — o crea tu email desde cero</div>

            {visibleTemplates.length > 0 && onAddBlock && (
              <div className="empty-templates">
                {visibleTemplates.map(t => {
                  const brand = BRANDS.find(b => b.id === t.brand);
                  return (
                    <div key={t.id} className="empty-tpl"
                         onClick={() => onAddBlock({ type: 'template', templateId: t.id })}>
                      <div className={'empty-tpl-bar ' + (t.colorClass || 'gray')} />
                      <div className="empty-tpl-name">{t.name}</div>
                      <div className="empty-tpl-desc">{t.desc}</div>
                      <div className="empty-tpl-meta">
                        {brand?.label || t.brand} · {((t.blocks && t.blocks.length) || (t.compositorBlocks && t.compositorBlocks.length) || 0)} bloques
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="empty-divider">o</div>
            <button className="btn btn-accent" onClick={onOpenPalette}>
              <Icon name="plus" size={14} /> Añadir primer bloque
            </button>
          </div>
        ) : (
          <>
            {blocks.map((b, i) => (
              <React.Fragment key={b.id}>
                <BlockCard
                  block={b}
                  idx={i}
                  total={blocks.length}
                  selected={selectedId === b.id}
                  onSelect={setSelectedId}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onMove={onMove}
                  onDuplicate={onDuplicate}
                  lang={lang}
                />
                {i < blocks.length - 1 && (
                  <div className="insert-zone">
                    <button className="insert-btn" onClick={() => onOpenPalette(i)} title="Insertar bloque aquí">+</button>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div className="quick-add" onClick={onOpenPalette}>
              <Icon name="plus" size={14} />
              <span>Añadir bloque</span>
              <span className="mono" style={{fontSize:11, opacity:.6, marginLeft:8}}>⌘K</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function EmailIframe({ html, device }) {
  const iframeRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  // Render the email at its NATIVE design width (620px / 380px) and use
  // CSS scale to fit the right panel — this prevents the email's own
  // @media (max-width:600px) from firing prematurely and collapsing
  // pair/trio columns when the preview panel is narrow.
  const baseWidth = device === 'mobile' ? 380 : 620;

  React.useEffect(() => {
    const f = iframeRef.current;
    if (!f) return;
    const doc = f.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html || '<html><body></body></html>');
    doc.close();
  }, [html]);

  React.useEffect(() => {
    const w = wrapperRef.current;
    if (!w || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const cw = entries[0].contentRect.width;
      const next = cw < baseWidth ? Math.max(0.4, cw / baseWidth) : 1;
      setScale(next);
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [baseWidth]);

  // Outer wrapper measures available width; inner iframe is at native width
  // and scaled down. We compensate height so the visible area still fills
  // the panel even when scaled.
  return (
    <div ref={wrapperRef} style={{
      width: '100%',
      height: '75vh',
      minHeight: 500,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <iframe
        ref={iframeRef}
        title="Email preview"
        style={{
          width: baseWidth + 'px',
          height: (100 / scale) + '%',
          flexShrink: 0,
          border: 'none',
          background: '#fff',
          borderRadius: 'var(--r-sm)',
          boxShadow: 'var(--sh-md)',
          display: 'block',
          transform: 'scale(' + scale + ')',
          transformOrigin: 'top center',
        }}
      />
    </div>
  );
}

function PreviewPanel({ blocks, device, setDevice, tab, setTab, lang, embedded, emailHtml, onExpand }) {
  const html = emailHtml || '';
  return (
    <section className="preview" style={embedded ? {borderLeft:'none', flex:1, minHeight:0} : {}}>
      <div className="preview-header">
        <div className="preview-tabs">
          <button className={'preview-tab' + (tab === 'visual' ? ' active' : '')} onClick={() => setTab('visual')}>Visual</button>
          <button className={'preview-tab' + (tab === 'html' ? ' active' : '')} onClick={() => setTab('html')}>HTML</button>
        </div>
        <div className="device-toggle">
          <button className={'icon-btn' + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')} title="Desktop (620 px)">
            <Icon name="monitor" size={14} />
          </button>
          <button className={'icon-btn' + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')} title="Móvil (380 px)">
            <Icon name="smartphone" size={14} />
          </button>
          {onExpand && (
            <button className="icon-btn" onClick={onExpand} title="Vista ampliada" style={{marginLeft:6}}>
              <Icon name="panel" size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="preview-meta">
        <span>{lang.toUpperCase()}</span>
        <span>·</span>
        <span>{device === 'mobile' ? '380 px' : '620 px'}</span>
        <span>·</span>
        <span>{blocks.length} bloques</span>
        <span>·</span>
        <span style={{cursor:'pointer'}} onClick={() => { if (typeof copyHtmlAsRich === 'function') copyHtmlAsRich(html); else navigator.clipboard?.writeText(html).catch(() => {}); }} title="Copiar email — pégalo en Gmail/Outlook y verás el render, no el código">
          <Icon name="copy" size={11} /> Copiar HTML
        </span>
      </div>
      <div className="preview-body" style={{padding: embedded ? 12 : 16, overflow:'auto'}}>
        {tab === 'visual' ? (
          <EmailIframe html={html} device={device} />
        ) : (
          <div className="preview-frame" style={{padding:16, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', lineHeight:1.55, background:'var(--bg-panel)', overflow:'auto', maxHeight:'75vh'}}>
            <pre style={{whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0}}>{html}</pre>
          </div>
        )}
      </div>
    </section>
  );
}

const CMDK_SCOPES = [
  { id: 'all', label: 'Todos' },
  { id: 'productos', label: 'Productos', groups: ['Productos'] },
  { id: 'textos', label: 'Textos', groups: ['Textos'] },
  { id: 'plantillas', label: 'Plantillas', groups: ['Plantillas'] },
  { id: 'compuestos', label: 'Compuestos', groups: ['Compuestos'] },
  { id: 'composiciones', label: 'Composiciones', groups: ['Composiciones'] },
];

function CommandPalette({ onClose, onPick, appState, currentUser }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const [scope, setScope] = usePersistentState('cmdk-scope', 'all');
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const products = (appState?.products) || PRODUCTS;
  const texts = (appState?.prewrittenTexts) || PREWRITTEN_TEXTS;
  const templates = (appState?.templates) || TEMPLATES;
  const composed = (appState?.composedBlocks) || COMPOSED_BLOCKS || [];
  const standalones = (appState?.standaloneBlocks || STANDALONE_BLOCKS).map(sb => Object.assign({}, sb, {
    type: sb.type || sb.blockType,
  }));

  const ql = q.toLowerCase();
  const matches = (s) => !ql || (s || '').toLowerCase().includes(ql);

  const allUnscoped = [
    ...products
      .filter(p => p.visible !== false && !isHiddenForUser(currentUser, 'products', p.id))
      .map(p => ({ type: 'product', id: p.id, title: p.name, sub: p.price || '', group: 'Productos', icon: '▣', brand: p.brand, badge: p.badge })),
    ...texts
      .filter(t => t.visible !== false && !isHiddenForUser(currentUser, 'prewrittenTexts', t.id))
      .map(t => ({ type: 'text', id: t.id, title: t.name, sub: (t.text || '').slice(0, 50) + '…', group: 'Textos', icon: t.icon || '¶', brand: t.brand })),
    ...templates
      .filter(t => t.visible !== false && !isHiddenForUser(currentUser, 'templates', t.id))
      .map(t => ({ type: 'template', id: t.id, title: t.name, sub: t.desc || (((t.blocks && t.blocks.length) || (t.compositorBlocks && t.compositorBlocks.length) || 0) + ' bloques'), group: 'Plantillas', icon: '▦', brand: t.brand, colorClass: t.colorClass })),
    ...composed
      .filter(c => c.visible !== false && !isHiddenForUser(currentUser, 'composedBlocks', c.id))
      .map(c => ({ type: 'composed', id: c.id, title: c.title, sub: c.desc || c.priceRange || '', group: 'Compuestos', icon: '◧', brand: c.brand, colorClass: c.colorTag })),
    ...standalones
      .filter(b => !isHiddenForUser(currentUser, 'standaloneBlocks', b.id))
      .map(b => ({ type: b.type, id: b.id, title: b.title, sub: b.section || b.desc || '', group: 'Composiciones', icon: b.icon || '□', brand: b.brand })),
  ];

  const counts = {};
  allUnscoped.forEach(i => { counts[i.group] = (counts[i.group] || 0) + 1; });

  const activeScope = CMDK_SCOPES.find(s => s.id === scope) || CMDK_SCOPES[0];
  const inScope = (i) => !activeScope.groups || activeScope.groups.includes(i.group);

  const all = allUnscoped.filter(i => inScope(i) && (matches(i.title) || matches(i.sub)));

  const groups = {};
  all.forEach(i => { (groups[i.group] ||= []).push(i); });

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { setActive(a => Math.min(all.length - 1, a + 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp') { setActive(a => Math.max(0, a - 1)); e.preventDefault(); }
    if (e.key === 'Enter' && all[active]) { onPick(all[active]); onClose(); }
  };

  React.useEffect(() => { setActive(0); }, [scope, q]);

  let flatIdx = 0;
  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="Buscar bloques, productos, plantillas…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKey}
        />
        <div className="cmdk-scopes">
          {CMDK_SCOPES.map(s => {
            const n = s.id === 'all'
              ? allUnscoped.length
              : (s.groups || []).reduce((acc, g) => acc + (counts[g] || 0), 0);
            return (
              <button
                key={s.id}
                className={'cmdk-scope' + (scope === s.id ? ' active' : '')}
                onClick={() => setScope(s.id)}
              >
                {s.label} <span className="cmdk-scope-count">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="cmdk-body scroll">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="cmdk-group">
              <div className="cmdk-group-title">{group}</div>
              {items.map(item => {
                const myIdx = flatIdx++;
                return (
                  <button
                    key={item.id + item.type}
                    className={'cmdk-item' + (myIdx === active ? ' active' : '')}
                    onClick={() => { onPick(item); onClose(); }}
                    onMouseEnter={() => setActive(myIdx)}
                  >
                    <div className="cmdk-item-icon">{item.icon}</div>
                    <div className="cmdk-item-title">
                      {item.colorClass && <span className={'lib-color-tag ' + item.colorClass} />}
                      {item.title}
                    </div>
                    <div className="cmdk-item-sub">{item.sub}</div>
                  </button>
                );
              })}
            </div>
          ))}
          {all.length === 0 && (
            <div style={{padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:13}} className="serif">
              Nada por aquí. Prueba con otro término o cambia de scope.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Modal: capture the current email as a new template. */
function SaveAsTemplateModal({ onClose, onSave, blocksCount }) {
  const [name, setName] = React.useState('');
  const [brand, setBrand] = React.useState('mix');
  const [colorClass, setColorClass] = React.useState('gray');
  const _brands = (typeof window !== 'undefined' && window.BRANDS) || BRANDS || [];
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const submit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), brand, colorClass);
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:440}}>
        <h2>Guardar como plantilla</h2>
        <p style={{marginBottom:12}}>Vas a guardar los <strong>{blocksCount} bloques</strong> actuales como plantilla reutilizable.</p>
        <div className="field">
          <label className="field-label">Nombre</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="ej. Promo MBO Verano"
            autoFocus
          />
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <div className="field">
            <label className="field-label">Marca</label>
            <select className="select" value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="mix">Multi-marca</option>
              {_brands.filter(b => b.id !== 'bomedia').map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Color</label>
            <select className="select" value={colorClass} onChange={e => setColorClass(e.target.value)}>
              <option value="blue">Azul</option>
              <option value="purple">Morado</option>
              <option value="orange">Naranja</option>
              <option value="teal">Teal</option>
              <option value="gray">Gris</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>
            <Icon name="zap" size={13}/> Guardar plantilla
          </button>
        </div>
      </div>
    </div>
  );
}

/* Full-screen preview modal — opens the email HTML in a wide centered viewport
   so the user can see the design at native widths without the panel constraint. */
function EmailPreviewModal({ html, lang, onClose }) {
  const [device, setDevice] = React.useState('desktop');
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    const f = iframeRef.current;
    if (!f) return;
    const doc = f.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html || '<html><body></body></html>');
    doc.close();
  }, [html]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = async () => {
    if (typeof copyHtmlAsRich === 'function') await copyHtmlAsRich(html || '');
    else { try { await navigator.clipboard.writeText(html || ''); } catch (e) {} }
  };
  const handleDownload = () => {
    const blob = new Blob([html || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bomedia-email-' + new Date().toISOString().slice(0, 10) + '.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const handleOpenTab = () => {
    const w = window.open('about:blank', '_blank');
    if (w) { w.document.write(html || ''); w.document.close(); }
  };

  const width = device === 'mobile' ? 380 : 720;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-modal-head">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <strong style={{fontSize:14}}>Vista previa del email</strong>
            <span className="mono" style={{fontSize:11, color:'var(--text-subtle)'}}>{lang.toUpperCase()} · {width}px</span>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div className="device-toggle">
              <button className={'icon-btn' + (device === 'desktop' ? ' active' : '')} onClick={() => setDevice('desktop')} title="Desktop">
                <Icon name="monitor" size={14} />
              </button>
              <button className={'icon-btn' + (device === 'mobile' ? ' active' : '')} onClick={() => setDevice('mobile')} title="Móvil">
                <Icon name="smartphone" size={14} />
              </button>
            </div>
            <button className="btn btn-ghost" onClick={handleCopy} style={{fontSize:12}}>
              <Icon name="copy" size={12} /> Copiar HTML
            </button>
            <button className="btn btn-ghost" onClick={handleDownload} style={{fontSize:12}}>
              <Icon name="download" size={12} /> Descargar
            </button>
            <button className="btn btn-ghost" onClick={handleOpenTab} style={{fontSize:12}}>
              <Icon name="share" size={12} /> Pestaña nueva
            </button>
            <button className="icon-btn" onClick={onClose} title="Cerrar (Esc)">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
        <div className="preview-modal-body">
          <iframe
            ref={iframeRef}
            title="Email preview ampliada"
            style={{
              width: width + 'px',
              height: '100%',
              minHeight: 600,
              border: 'none',
              background: '#fff',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--sh-lg)',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Canvas, PreviewPanel, CommandPalette, EmailIframe, MiniProduct, BrandStripPreview, EmailPreviewModal, SaveAsTemplateModal });
