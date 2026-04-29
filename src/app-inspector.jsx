/* ───────────── INSPECTOR (panel de edición) ───────────── */

/* Always read the live data published by App into window — falling back to
   the module-level defaults. Without this, products/brands edited in the
   Backoffice (or loaded from Supabase with different IDs than the bundled
   defaults) appear as "no seleccionado" because the lookup uses a frozen
   copy. */
const _liveProducts = () => (typeof window !== 'undefined' && window.PRODUCTS) || PRODUCTS || [];
const _liveBrands   = () => (typeof window !== 'undefined' && window.BRANDS) || BRANDS || [];

function Inspector({ block, onUpdate, onClose, onDelete, onDuplicate, lang, setLang, onOpenBackoffice }) {
  if (!block) return null;

  const product = block.type === 'product' && _liveProducts().find(p => p.id === block.productId);
  const text = block.type === 'text' && PREWRITTEN_TEXTS.find(t => t.id === block.textId);

  // Derive a brand color for the top dot across v2-native types too
  const brandPrefixed = block.type && block.type.startsWith('brand_') && block.type !== 'brand_strip'
    ? block.type.replace('brand_', '') : null;
  const firstPairProd = (block.type === 'product_single' || block.type === 'product_pair' || block.type === 'product_trio')
    && _liveProducts().find(p => p.id === block.product1);
  const _composedSource = (typeof window !== 'undefined' && window.COMPOSED_BLOCKS) || (typeof COMPOSED_BLOCKS !== 'undefined' ? COMPOSED_BLOCKS : []);
  const composedRef = block.type === 'composed' && block.composedId
    && _composedSource.find(c => c.id === block.composedId);
  const brandId = product?.brand || text?.brand || block.brand || brandPrefixed
    || firstPairProd?.brand || composedRef?.brand || 'mix';
  const brand = _liveBrands().find(b => b.id === brandId);

  const typeLabel = {
    text: 'Bloque de texto',
    product: 'Bloque de producto',
    product_single: 'Producto',
    product_pair: '2 Productos',
    product_trio: '3 Productos',
    // Unified hero
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
    composed: 'Bloque compuesto',
    brandstrip: 'Strip de marcas',
    header: 'Cabecera',
    footer: 'Pie',
  }[block.type] || block.type;

  const isHero = block.type === 'hero' || block.type === 'pimpam_hero' || block.type === 'product_hero';

  return (
    <section className="inspector">
      <div className="inspector-header">
        <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1}}>
          <span className="inspector-dot" style={{background: brand?.color || 'var(--text-subtle)'}} />
          <div style={{minWidth:0}}>
            <div className="inspector-title">{typeLabel}</div>
            <div className="inspector-sub mono">{block.id}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} title="Cerrar">
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Language tabs for editing translations */}
      <div className="inspector-lang">
        <span className="inspector-lang-label">Editando en</span>
        <div className="lang-pill" style={{marginLeft:'auto'}}>
          {['es','fr','de','en','nl'].map(l => (
            <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="inspector-body scroll">
        {block.type === 'product' && product && (
          <ProductEditor block={block} product={product} onUpdate={onUpdate} lang={lang} />
        )}
        {block.type === 'text' && (
          <TextEditor block={block} text={text} onUpdate={onUpdate} lang={lang} />
        )}
        {block.type === 'header' && (
          <HeaderEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'footer' && (
          <FooterEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'brandstrip' && (
          <BrandstripEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'product_single' && (
          <ProductSingleEditor block={block} onUpdate={onUpdate} lang={lang} />
        )}
        {block.type === 'product_pair' && (
          <ProductPairEditor block={block} onUpdate={onUpdate} lang={lang} />
        )}
        {block.type === 'product_trio' && (
          <ProductTrioEditor block={block} onUpdate={onUpdate} lang={lang} />
        )}
        {isHero && (
          <PimpamHeroEditor block={block} onUpdate={onUpdate} lang={lang} />
        )}
        {block.type === 'pimpam_steps' && (
          <PimpamStepsEditor block={block} onUpdate={onUpdate} lang={lang} />
        )}
        {(block.type === 'brand_strip'
          || block.type === 'brand_artisjet' || block.type === 'brand_mbo'
          || block.type === 'brand_pimpam' || block.type === 'brand_flux') && (
          <BrandStripEditor2 block={block} onUpdate={onUpdate} />
        )}
        {(block.type === 'freebird' || block.type === 'video') && (
          <FreebirdEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'composed' && (
          <ComposedEditor block={block} onUpdate={onUpdate} lang={lang} onOpenBackoffice={onOpenBackoffice} />
        )}
      </div>

      <div className="inspector-footer">
        <button className="btn btn-ghost" onClick={() => onDuplicate(block.id)}>
          <Icon name="copy" size={13} /> Duplicar
        </button>
        <button className="btn btn-ghost danger" onClick={() => { onDelete(block.id); onClose(); }}>
          <Icon name="trash" size={13} /> Eliminar
        </button>
      </div>
    </section>
  );
}

/* ─── Field primitives ─── */

function Field({ label, hint, children, action }) {
  return (
    <div className="field">
      <div className="field-label-row">
        <label className="field-label">{label}</label>
        {action}
      </div>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button className={'toggle' + (checked ? ' on' : '')} onClick={() => onChange(!checked)}>
      <span className="toggle-track"><span className="toggle-thumb"/></span>
      <span className="toggle-label">{label}</span>
    </button>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="insp-section">
      <button className="insp-section-header" onClick={() => setOpen(o => !o)}>
        <span style={{transform: open ? 'rotate(90deg)' : 'none', transition:'transform .15s', display:'inline-flex'}}>
          <Icon name="chevron" size={12} />
        </span>
        {title}
      </button>
      {open && <div className="insp-section-body">{children}</div>}
    </div>
  );
}

/* ─── Product Editor ─── */

function ProductEditor({ block, product, onUpdate, lang }) {
  const brand = _liveBrands().find(b => b.id === product.brand);
  const overrides = block.overrides?.[lang] || {};
  const showPrice = block.showPrice !== false;
  const showSpecs = block.showSpecs !== false;
  const showCta = block.showCta !== false;
  const [onlyOverrides, setOnlyOverrides] = React.useState(false);

  const setOverride = (key, val) => {
    onUpdate(block.id, {
      ...block,
      overrides: {
        ...block.overrides,
        [lang]: { ...overrides, [key]: val }
      }
    });
  };

  const set = (key, val) => onUpdate(block.id, { ...block, [key]: val });

  // Count modified fields (current lang) to drive the "only overrides" badge
  const [aiDescOpen, setAiDescOpen] = React.useState(false);

  const overrideKeys = ['name','desc','price','area','feat1','feat2','img'];
  const overrideCount = overrideKeys.filter(k => overrides[k] != null).length
    + (block.showCta != null ? 1 : 0)
    + (block.showPrice === false ? 1 : 0)
    + (block.showSpecs === false ? 1 : 0)
    + (block.ctaText ? 1 : 0)
    + (block.ctaUrl ? 1 : 0);

  // Decide which sections to render in "only overrides" mode
  const hasTextOverride = overrides.name != null || overrides.desc != null || overrides.price != null;
  const hasSpecsOverride = overrides.area != null || overrides.feat1 != null || overrides.feat2 != null;
  const hasImageOverride = overrides.img != null;
  const hasCtaOverride = block.showCta != null || !!block.ctaText || !!block.ctaUrl;
  const hasVisibilityOverride = block.showPrice === false || block.showSpecs === false;

  const showSection = (hasOverride) => !onlyOverrides || hasOverride;

  return (
    <>
      <div className="insp-overrides-bar">
        <Toggle checked={onlyOverrides} onChange={setOnlyOverrides} label="Solo modificados" />
        <span className="insp-overrides-count">{overrideCount} cambio{overrideCount === 1 ? '' : 's'}</span>
      </div>

      <Section title="Producto">
        <Field label="Seleccionar producto">
          <select
            value={product.id}
            onChange={e => onUpdate(block.id, { ...block, productId: e.target.value, overrides: {} })}
            className="select"
          >
            {_liveBrands().filter(b => b.id !== 'bomedia').map(b => (
              <optgroup key={b.id} label={b.label}>
                {_liveProducts().filter(p => p.brand === b.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.price}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <div className="prod-preview-mini">
          <img src={product.img} alt="" />
          <div>
            <div className="prod-preview-brand" style={{color: brand.color}}>{brand.label}</div>
            <div className="prod-preview-name">{product.name}</div>
          </div>
        </div>
      </Section>

      {showSection(hasTextOverride) && (
        <Section title="Texto (sobrescribir)" defaultOpen={!onlyOverrides || hasTextOverride}>
          <Field label="Nombre" hint={'Por defecto: ' + product.name} action={
            overrides.name != null && <button className="field-reset" onClick={() => setOverride('name', null)}>Restaurar</button>
          }>
            <input
              className="input"
              value={overrides.name ?? product.name}
              onChange={e => setOverride('name', e.target.value)}
            />
          </Field>
          <Field label="Descripción" action={
            <button className="field-reset ai-btn" title="Reescribir con IA" onClick={() => setAiDescOpen(true)}>
              <Icon name="sparkles" size={11} /> IA
            </button>
          }>
            <textarea
              className="textarea"
              rows={3}
              value={overrides.desc ?? product.desc}
              onChange={e => setOverride('desc', e.target.value)}
            />
          </Field>
          {aiDescOpen && (
            <AiTextPopover
              lang={lang}
              currentText={overrides.desc ?? product.desc ?? ''}
              onApply={(text) => setOverride('desc', text)}
              onClose={() => setAiDescOpen(false)}
            />
          )}
          <Field label="Precio">
            <input
              className="input mono"
              value={overrides.price ?? product.price}
              onChange={e => setOverride('price', e.target.value)}
            />
          </Field>
        </Section>
      )}

      {showSection(hasSpecsOverride) && (
        <Section title="Especificaciones" defaultOpen={hasSpecsOverride}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <Field label="Área">
              <input className="input" value={overrides.area ?? product.area} onChange={e => setOverride('area', e.target.value)} />
            </Field>
            <Field label="Feature 1">
              <input className="input" value={overrides.feat1 ?? product.feat1} onChange={e => setOverride('feat1', e.target.value)} />
            </Field>
          </div>
          <Field label="Feature 2">
            <input className="input" value={overrides.feat2 ?? product.feat2} onChange={e => setOverride('feat2', e.target.value)} />
          </Field>
        </Section>
      )}

      {showSection(hasImageOverride) && (
        <Section title="Imagen" defaultOpen={hasImageOverride}>
          <Field label="URL de imagen">
            <input className="input mono" style={{fontSize:11}} value={overrides.img ?? product.img} onChange={e => setOverride('img', e.target.value)} />
          </Field>
          <div style={{display:'flex', gap:6, marginTop:6}}>
            <button className="btn btn-outline" style={{fontSize:12, flex:1}}>
              <Icon name="download" size={12} /> Subir imagen
            </button>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={() => setOverride('img', null)}>
              Original
            </button>
          </div>
        </Section>
      )}

      {showSection(hasCtaOverride) && (
        <Section title="CTA" defaultOpen={hasCtaOverride}>
          <Toggle checked={showCta} onChange={v => set('showCta', v)} label="Mostrar botón de acción" />
          {showCta && <>
            <Field label="Texto del botón">
              <input className="input" value={block.ctaText ?? 'Más información'} onChange={e => set('ctaText', e.target.value)} />
            </Field>
            <Field label="Enlace">
              <input className="input mono" style={{fontSize:11}} value={block.ctaUrl ?? ''} placeholder="https://…" onChange={e => set('ctaUrl', e.target.value)} />
            </Field>
          </>}
        </Section>
      )}

      {showSection(hasVisibilityOverride) && (
        <Section title="Visibilidad" defaultOpen={hasVisibilityOverride}>
          <Toggle checked={showPrice} onChange={v => set('showPrice', v)} label="Mostrar precio" />
          <Toggle checked={showSpecs} onChange={v => set('showSpecs', v)} label="Mostrar especificaciones" />
        </Section>
      )}
    </>
  );
}

/* AI assistant popover used inside text editors. Calls callOpenAI() and
   passes the result to onApply. */
function AiTextPopover({ lang, currentText, onApply, onClose, anchor }) {
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const [error, setError] = React.useState('');
  const hasKey = typeof getOpenaiKey === 'function' && !!getOpenaiKey();

  const run = (mode) => {
    if (typeof callOpenAI !== 'function') {
      setError('Helper OpenAI no disponible');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    callOpenAI({ notes, lang, mode, existing: currentText })
      .then(r => setResult(r))
      .catch(e => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ai-popover-overlay" onClick={onClose}>
      <div className="ai-popover" onClick={e => e.stopPropagation()}>
        <div className="ai-popover-head">
          <Icon name="sparkles" size={14} />
          <strong style={{fontSize:13}}>Asistente IA · {lang.toUpperCase()}</strong>
          <button className="icon-btn" onClick={onClose} style={{marginLeft:'auto'}} title="Cerrar (Esc)">
            <Icon name="x" size={14}/>
          </button>
        </div>
        {!hasKey && (
          <div style={{padding:'8px 12px', fontSize:11.5, background:'color-mix(in oklch, var(--danger) 12%, var(--bg-panel))', color:'var(--danger)', lineHeight:1.5}}>
            Falta tu API key de OpenAI. Configúrala en <strong>Backoffice → Asistente IA</strong>.
          </div>
        )}
        <div style={{padding:12, display:'flex', flexDirection:'column', gap:10}}>
          <div className="field" style={{margin:0}}>
            <label className="field-label">Indícale qué escribir</label>
            <textarea
              className="textarea"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ej. Presenta la MBO 4060 destacando precio y rapidez. Cierra invitando a una demo."
              autoFocus
            />
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={() => run('generate')} disabled={loading || !hasKey || (!notes.trim() && !currentText)}>
              <Icon name="sparkles" size={11}/> {loading ? 'Generando…' : 'Generar'}
            </button>
            {currentText && (
              <button className="btn btn-outline" onClick={() => run('rewrite')} disabled={loading || !hasKey}>
                <Icon name="redo" size={11}/> Reescribir el texto actual
              </button>
            )}
          </div>
          {error && (
            <div style={{fontSize:11.5, color:'var(--danger)', padding:'6px 10px', background:'color-mix(in oklch, var(--danger) 8%, var(--bg-panel))', borderRadius:4}}>
              {error}
            </div>
          )}
          {result && (
            <div className="ai-result">
              <div style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:6}}>Resultado</div>
              <div style={{whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.55, padding:'8px 10px', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', maxHeight:240, overflow:'auto'}}>{result}</div>
              <div style={{display:'flex', gap:6, marginTop:8}}>
                <button className="btn btn-primary" style={{fontSize:12}} onClick={() => { onApply(result); onClose(); }}>
                  <Icon name="zap" size={11}/> Aplicar al bloque
                </button>
                <button className="btn btn-ghost" style={{fontSize:12}} onClick={() => navigator.clipboard?.writeText(result).catch(() => {})}>
                  <Icon name="copy" size={11}/> Copiar
                </button>
                <button className="btn btn-ghost" style={{fontSize:12, marginLeft:'auto'}} onClick={() => run(currentText ? 'rewrite' : 'generate')}>
                  Regenerar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Text Editor ─── */

function TextEditor({ block, text, onUpdate, lang }) {
  const overrides = block.overridesByLang?.[lang] ?? block.overrideText;
  // Resolve prewritten text in the current language (text.i18n[lang].text)
  const localizedSourceText = (text && typeof window.getLocalizedText === 'function')
    ? window.getLocalizedText(text, 'text', lang)
    : (text?.text || '');
  const content = overrides ?? localizedSourceText ?? '';
  // Rich HTML stored per-lang; legacy single-string _richHtml is honoured
  // as the ES variant.
  const richByLang = block._richHtmlByLang || {};
  const legacyRich = lang === 'es' && typeof block._richHtml === 'string' ? block._richHtml : null;
  const storedRich = richByLang[lang] ?? legacyRich;
  const richHtml = storedRich != null
    ? storedRich
    : (content
      ? '<p>' + String(content).split('\n').filter(Boolean).join('</p><p>') + '</p>'
      : '');
  const align = block.align || 'left';
  const [aiOpen, setAiOpen] = React.useState(false);

  const set = (key, val) => onUpdate(block.id, { ...block, [key]: val });
  const setRich = (html) => {
    const stripped = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const nextRichByLang = { ...(block._richHtmlByLang || {}), [lang]: html };
    const next = {
      ...block,
      _richHtmlByLang: nextRichByLang,
      overridesByLang: { ...block.overridesByLang, [lang]: stripped },
    };
    if ('_richHtml' in next) delete next._richHtml;
    onUpdate(block.id, next);
  };

  const applyAi = (generated) => {
    const html = '<p>' + generated.split(/\n\n+/).map(p => p.trim()).filter(Boolean).join('</p><p>') + '</p>';
    setRich(html);
  };

  return (
    <>
      <Section title="Contenido">
        <Field
          label={text?.name || 'Texto libre'}
          hint="Soporta H1/H2/H3, listas, alineación, enlaces."
          action={
            <button className="field-reset ai-btn" onClick={() => setAiOpen(true)} title="Generar/reescribir con IA">
              <Icon name="sparkles" size={11} /> IA
            </button>
          }
        >
          {typeof RichTextEditor !== 'undefined'
            ? <RichTextEditor value={richHtml || ''} onChange={setRich} placeholder="Escribe el texto…" fontSize={block.fontSize || 14} />
            : <div style={{padding:10, fontSize:12, color:'var(--text-muted)'}}>RichTextEditor no cargado.</div>}
        </Field>

        {aiOpen && (
          <AiTextPopover
            lang={lang}
            currentText={(richHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            onApply={applyAi}
            onClose={() => setAiOpen(false)}
          />
        )}
      </Section>

      <Section title="Apariencia">
        <Field label="Alineación">
          <div className="seg">
            {['left','center','right'].map((v, i) => (
              <button key={v} className={'seg-btn' + (align === v ? ' active' : '')} onClick={() => set('align', v)}>
                {['Izquierda','Centro','Derecha'][i]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tamaño de fuente (px)">
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input
              type="number"
              className="input"
              min={9}
              max={36}
              step={1}
              value={block.fontSize ?? 14}
              onChange={e => set('fontSize', parseInt(e.target.value, 10) || 14)}
              style={{width:80}}
            />
            <input
              type="range"
              min={9}
              max={36}
              step={1}
              value={block.fontSize ?? 14}
              onChange={e => set('fontSize', parseInt(e.target.value, 10))}
              style={{flex:1}}
            />
            <button className="btn btn-ghost" style={{fontSize:11}} onClick={() => {
              const next = { ...block };
              delete next.fontSize;
              onUpdate(block.id, next);
            }} title="Volver al tamaño por defecto (14px)">
              Reset
            </button>
          </div>
        </Field>
      </Section>

      <Section title="IA — tono rápido" defaultOpen={false}>
        {(() => {
          const plain = (richHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          const hasText = !!plain;
          return (<>
            <div className="ai-actions">
              {[
                { label:'Más formal', instr:'Hazlo más formal, manteniendo la idea pero subiendo el registro.' },
                { label:'Más corto',  instr:'Acorta a la mitad sin perder la información clave.' },
                { label:'Más directo',instr:'Hazlo más directo y comercial, en frases cortas.' },
                { label:'Más amable', instr:'Hazlo más cercano y empático, sin perder profesionalidad.' },
              ].map(a => (
                <button
                  key={a.label}
                  className="ai-action"
                  disabled={!hasText}
                  onClick={() => {
                    if (typeof callOpenAI !== 'function') { alert('Helper OpenAI no cargado'); return; }
                    callOpenAI({ notes: a.instr, lang, mode: 'rewrite', existing: plain })
                      .then(r => setRich('<p>' + r.split(/\n\n+/).filter(Boolean).join('</p><p>') + '</p>'))
                      .catch(e => alert('Error: ' + e.message));
                  }}
                >
                  <Icon name="sparkles" size={11} /> {a.label}
                </button>
              ))}
            </div>
            {!hasText && (
              <div style={{fontSize:11, color:'var(--text-subtle)', fontStyle:'italic', marginTop:6}}>Escribe primero algo de texto para reescribirlo con un tono diferente.</div>
            )}
          </>);
        })()}
      </Section>
    </>
  );
}

/* ─── Hero Editor ─── */

function HeroEditor({ block, onUpdate, lang }) {
  const d = block.data?.[lang] || {};
  const def = { title: 'Fundas personalizadas en 90 segundos', sub: 'Máquinas PimPam Vending en puntos retail', cta: 'Pedir información' };
  const set = (key, val) => onUpdate(block.id, {
    ...block,
    data: { ...block.data, [lang]: { ...d, [key]: val } }
  });
  const val = (k) => d[k] ?? def[k];

  return (
    <>
      <Section title="Contenido">
        <Field label="Título">
          <input className="input" value={val('title')} onChange={e => set('title', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <textarea className="textarea" rows={2} value={val('sub')} onChange={e => set('sub', e.target.value)} />
        </Field>
        <Field label="Texto del CTA">
          <input className="input" value={val('cta')} onChange={e => set('cta', e.target.value)} />
        </Field>
        <Field label="Enlace del CTA">
          <input className="input mono" style={{fontSize:11}} value={block.ctaUrl || ''} placeholder="https://…" onChange={e => onUpdate(block.id, {...block, ctaUrl: e.target.value})} />
        </Field>
      </Section>

      <Section title="Estilo" defaultOpen={false}>
        <Field label="Color de fondo">
          <div className="swatch-row">
            {['pimpam','artisjet','mbo','flux'].map(bid => {
              const b = _liveBrands().find(x => x.id === bid);
              return (
                <button key={bid}
                  className={'swatch' + (block.bg === bid ? ' active' : '')}
                  style={{background: b.color}}
                  onClick={() => onUpdate(block.id, {...block, bg: bid})}
                  title={b.label}
                />
              );
            })}
            <button className={'swatch' + ((!block.bg || block.bg === 'neutral') ? ' active' : '')} style={{background:'var(--bg-sunken)', border:'1px solid var(--border-strong)'}} onClick={() => onUpdate(block.id, {...block, bg: 'neutral'})} title="Neutro"/>
          </div>
        </Field>
      </Section>
    </>
  );
}

/* ─── Header / Footer / Brandstrip ─── */

function HeaderEditor({ block, onUpdate }) {
  return (
    <Section title="Cabecera">
      <Field label="Texto de marca">
        <input className="input" value={block.brand ?? 'bomedia'} onChange={e => onUpdate(block.id, {...block, brand: e.target.value})} />
      </Field>
      <Field label="Subtítulo">
        <input className="input" value={block.subtitle ?? 'Distribuidor oficial'} onChange={e => onUpdate(block.id, {...block, subtitle: e.target.value})} />
      </Field>
    </Section>
  );
}

function FooterEditor({ block, onUpdate }) {
  return (
    <Section title="Pie">
      <Field label="Legal">
        <textarea className="textarea" rows={2} value={block.legal ?? 'Bomedia S.L. · Aviso legal · Política de privacidad'} onChange={e => onUpdate(block.id, {...block, legal: e.target.value})} />
      </Field>
      <Field label="Email de contacto">
        <input className="input mono" value={block.contact ?? 'info@bomedia.es'} onChange={e => onUpdate(block.id, {...block, contact: e.target.value})} />
      </Field>
      <Toggle checked={block.showUnsubscribe !== false} onChange={v => onUpdate(block.id, {...block, showUnsubscribe: v})} label="Mostrar 'Darse de baja'" />
    </Section>
  );
}

function BrandstripEditor({ block, onUpdate }) {
  const enabled = block.brands || ['artisjet','mbo','pimpam','flux'];
  const toggle = (id) => {
    const next = enabled.includes(id) ? enabled.filter(x => x !== id) : [...enabled, id];
    onUpdate(block.id, {...block, brands: next});
  };
  return (
    <Section title="Marcas a mostrar">
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {_liveBrands().filter(b => b.id !== 'bomedia').map(b => (
          <Toggle key={b.id} checked={enabled.includes(b.id)} onChange={() => toggle(b.id)}
                  label={<span><span style={{display:'inline-block', width:8, height:8, borderRadius:2, background:b.color, marginRight:8, verticalAlign:'middle'}}/>{b.label}</span>} />
        ))}
      </div>
    </Section>
  );
}

/* ─── Shared product selector ─── */

function ProductSelect({ value, onChange, label }) {
  return (
    <Field label={label || 'Producto'}>
      <select className="select" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="" disabled>— Seleccionar —</option>
        {_liveBrands().filter(b => b.id !== 'bomedia').map(b => (
          <optgroup key={b.id} label={b.label}>
            {_liveProducts().filter(p => p.brand === b.id).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.price}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}

function ProductMini({ productId }) {
  const p = _liveProducts().find(x => x.id === productId);
  if (!p) return <div style={{fontSize:11, color:'var(--text-subtle)', padding:8, fontStyle:'italic'}}>No seleccionado</div>;
  const brand = _liveBrands().find(b => b.id === p.brand);
  return (
    <div style={{display:'flex', gap:8, alignItems:'center', padding:'6px 0'}}>
      <img src={p.img} alt="" style={{width:36, height:36, objectFit:'contain', borderRadius:4, background:'var(--bg-sunken)', padding:2}} />
      <div style={{minWidth:0}}>
        <div style={{fontSize:11, fontWeight:600, color: brand?.color}}>{brand?.label}</div>
        <div style={{fontSize:12, fontWeight:500}}>{p.name}</div>
      </div>
    </div>
  );
}

/* ─── Product Single / Pair / Trio Editors ─── */

function ProductSingleEditor({ block, onUpdate, lang }) {
  return (
    <Section title="Producto">
      <ProductSelect value={block.product1} onChange={v => onUpdate(block.id, {...block, product1: v})} label="Producto" />
      <ProductMini productId={block.product1} />
    </Section>
  );
}

function ProductPairEditor({ block, onUpdate, lang }) {
  return (
    <>
      <Section title="Producto 1">
        <ProductSelect value={block.product1} onChange={v => onUpdate(block.id, {...block, product1: v})} label="Producto izquierdo" />
        <ProductMini productId={block.product1} />
      </Section>
      <Section title="Producto 2">
        <ProductSelect value={block.product2} onChange={v => onUpdate(block.id, {...block, product2: v})} label="Producto derecho" />
        <ProductMini productId={block.product2} />
      </Section>
    </>
  );
}

function ProductTrioEditor({ block, onUpdate, lang }) {
  return (
    <>
      <Section title="Producto 1">
        <ProductSelect value={block.product1} onChange={v => onUpdate(block.id, {...block, product1: v})} />
        <ProductMini productId={block.product1} />
      </Section>
      <Section title="Producto 2">
        <ProductSelect value={block.product2} onChange={v => onUpdate(block.id, {...block, product2: v})} />
        <ProductMini productId={block.product2} />
      </Section>
      <Section title="Producto 3">
        <ProductSelect value={block.product3} onChange={v => onUpdate(block.id, {...block, product3: v})} />
        <ProductMini productId={block.product3} />
      </Section>
    </>
  );
}

/* ─── PimPam Hero Editor ─── */

function PimpamHeroEditor({ block, onUpdate, lang }) {
  const sbConf = (() => {
    if (block._sourceId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block._sourceId);
      return (sb && sb.config) || {};
    }
    if (block.standaloneId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block.standaloneId);
      return (sb && sb.config) || {};
    }
    return {};
  })();
  const val = (key) => block[key] || sbConf[key] || '';
  const valArr = (key) => (block[key] && block[key].length) ? block[key] : (sbConf[key] || []);
  const set = (key, v) => onUpdate(block.id, {...block, [key]: v});

  const bullets = valArr('heroBullets');
  const ctaButtons = valArr('heroCtaButtons');

  return (
    <>
      <Section title="Hero — contenido">
        <Field label="Título">
          <input className="input" value={val('heroTitle')} onChange={e => set('heroTitle', e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <textarea className="textarea" rows={3} value={val('heroSubtitle')} onChange={e => set('heroSubtitle', e.target.value)} />
        </Field>
        <Field label="Imagen (URL)">
          <input className="input mono" style={{fontSize:11}} value={val('heroImage')} onChange={e => set('heroImage', e.target.value)} />
        </Field>
        {val('heroImage') && (
          <div style={{marginTop:6, borderRadius:'var(--r-sm)', overflow:'hidden', maxHeight:120}}>
            <img src={val('heroImage')} alt="" style={{width:'100%', objectFit:'cover'}} />
          </div>
        )}
        <Field label="Enlace de imagen">
          <input className="input mono" style={{fontSize:11}} placeholder="https://…" value={val('heroImageLink')} onChange={e => set('heroImageLink', e.target.value)} />
        </Field>
      </Section>

      <Section title="Bullets">
        <div style={{display:'flex', flexDirection:'column', gap:4}}>
          {bullets.map((b, i) => (
            <div key={i} style={{display:'flex', gap:4, alignItems:'center'}}>
              <span style={{fontSize:11, color:'var(--text-subtle)', width:16, textAlign:'center'}}>✓</span>
              <input className="input" style={{flex:1, fontSize:12}} value={b}
                onChange={e => {
                  const next = [...bullets]; next[i] = e.target.value;
                  set('heroBullets', next);
                }} />
              <button className="icon-btn" style={{width:20, height:20}} onClick={() => {
                set('heroBullets', bullets.filter((_, j) => j !== i));
              }}><Icon name="x" size={10} /></button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{fontSize:11, justifyContent:'center'}} onClick={() => set('heroBullets', [...bullets, ''])}>
            <Icon name="plus" size={10} /> Añadir bullet
          </button>
        </div>
      </Section>

      <Section title="CTAs (botones)">
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {ctaButtons.map((c, i) => (
            <div key={i} style={{padding:8, border:'1px solid var(--border)', borderRadius:'var(--r-sm)', background:'var(--bg-sunken)'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
                <Field label="Texto">
                  <input className="input" style={{fontSize:12}} value={c.text || ''} onChange={e => {
                    const next = [...ctaButtons]; next[i] = {...next[i], text: e.target.value};
                    set('heroCtaButtons', next);
                  }} />
                </Field>
                <Field label="URL">
                  <input className="input mono" style={{fontSize:11}} value={c.url || ''} onChange={e => {
                    const next = [...ctaButtons]; next[i] = {...next[i], url: e.target.value};
                    set('heroCtaButtons', next);
                  }} />
                </Field>
              </div>
              <div style={{display:'flex', gap:6, marginTop:6, alignItems:'center'}}>
                <Field label="Fondo">
                  <input type="color" value={c.bg || '#ea580c'} style={{width:28, height:22, border:'none', padding:0, cursor:'pointer'}}
                    onChange={e => { const next = [...ctaButtons]; next[i] = {...next[i], bg: e.target.value}; set('heroCtaButtons', next); }} />
                </Field>
                <Field label="Texto">
                  <input type="color" value={c.color || '#ffffff'} style={{width:28, height:22, border:'none', padding:0, cursor:'pointer'}}
                    onChange={e => { const next = [...ctaButtons]; next[i] = {...next[i], color: e.target.value}; set('heroCtaButtons', next); }} />
                </Field>
                <button className="icon-btn" style={{marginLeft:'auto', width:20, height:20}} onClick={() => {
                  set('heroCtaButtons', ctaButtons.filter((_, j) => j !== i));
                }}><Icon name="trash" size={10} /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost" style={{fontSize:11, justifyContent:'center'}} onClick={() => set('heroCtaButtons', [...ctaButtons, {text:'', url:'', bg:'#ea580c', color:'#ffffff'}])}>
            <Icon name="plus" size={10} /> Añadir CTA
          </button>
        </div>
      </Section>

      <Section title="Estilo" defaultOpen={false}>
        <Field label="Color de fondo">
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="color" value={val('heroBgColor') || '#ffffff'} style={{width:32, height:24, border:'1px solid var(--border)', borderRadius:4, padding:0, cursor:'pointer'}}
              onChange={e => set('heroBgColor', e.target.value)} />
            <input className="input mono" style={{fontSize:11, flex:1}} value={val('heroBgColor') || '#ffffff'} onChange={e => set('heroBgColor', e.target.value)} />
          </div>
        </Field>
      </Section>
    </>
  );
}

/* ─── PimPam Steps Editor ─── */

function PimpamStepsEditor({ block, onUpdate, lang }) {
  const sbConf = (() => {
    if (block._sourceId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block._sourceId);
      return (sb && sb.config) || {};
    }
    if (block.standaloneId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block.standaloneId);
      return (sb && sb.config) || {};
    }
    return {};
  })();
  const steps = (block.steps && block.steps.length) ? block.steps : (sbConf.steps || [
    {n:"1️⃣",t:"Elige diseño",s:"Pantalla táctil"},
    {n:"2️⃣",t:"Personaliza",s:"Texto, colores…"},
    {n:"3️⃣",t:"Paga",s:"Tarjeta / QR"},
    {n:"4️⃣",t:"¡Listo!",s:"Funda en 30s"},
  ]);
  const set = (key, v) => onUpdate(block.id, {...block, [key]: v});

  return (
    <>
      <Section title="Pasos">
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {steps.map((s, i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'40px 1fr 1fr', gap:6, alignItems:'center', padding:8, background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)'}}>
              <input className="input" style={{fontSize:16, textAlign:'center', padding:4}} value={s.n} onChange={e => {
                const next = [...steps]; next[i] = {...next[i], n: e.target.value}; set('steps', next);
              }} />
              <div>
                <input className="input" style={{fontSize:12, marginBottom:3}} placeholder="Título" value={s.t} onChange={e => {
                  const next = [...steps]; next[i] = {...next[i], t: e.target.value}; set('steps', next);
                }} />
                <input className="input" style={{fontSize:11}} placeholder="Subtítulo" value={s.s} onChange={e => {
                  const next = [...steps]; next[i] = {...next[i], s: e.target.value}; set('steps', next);
                }} />
              </div>
              <button className="icon-btn" style={{justifySelf:'end', width:20, height:20}} onClick={() => {
                set('steps', steps.filter((_, j) => j !== i));
              }}><Icon name="x" size={10} /></button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{fontSize:11, justifyContent:'center'}} onClick={() => set('steps', [...steps, {n:'⭐',t:'Nuevo paso',s:'Descripción'}])}>
            <Icon name="plus" size={10} /> Añadir paso
          </button>
        </div>
      </Section>
      <Section title="Colores" defaultOpen={false}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <Field label="Fondo">
            <input type="color" value={block.stepsBgColor || sbConf.stepsBgColor || '#fff7ed'} style={{width:'100%', height:28, border:'1px solid var(--border)', borderRadius:4, cursor:'pointer'}}
              onChange={e => set('stepsBgColor', e.target.value)} />
          </Field>
          <Field label="Borde">
            <input type="color" value={block.stepsBorderColor || sbConf.stepsBorderColor || '#fed7aa'} style={{width:'100%', height:28, border:'1px solid var(--border)', borderRadius:4, cursor:'pointer'}}
              onChange={e => set('stepsBorderColor', e.target.value)} />
          </Field>
        </div>
      </Section>
    </>
  );
}

/* ─── Brand Strip Editor (single brand) ─── */

function BrandStripEditor2({ block, onUpdate }) {
  const currentBrand = block.brand || (block.type.startsWith('brand_') && block.type !== 'brand_strip' ? block.type.replace('brand_','') : 'artisjet');
  return (
    <Section title="Marca">
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {_liveBrands().filter(b => b.id !== 'bomedia').map(b => (
          <button key={b.id} className={'toggle' + (currentBrand === b.id ? ' on' : '')}
            onClick={() => onUpdate(block.id, {...block, brand: b.id})}
            style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', background: currentBrand === b.id ? 'var(--accent-soft)' : 'var(--bg-panel)', cursor:'pointer'}}>
            <span style={{width:10, height:10, borderRadius:2, background:b.color, flexShrink:0}} />
            {b.logo ? <img src={b.logo} alt="" style={{maxHeight:16, maxWidth:80}} /> : <strong style={{color:b.color, fontSize:12}}>{b.label}</strong>}
            {currentBrand === b.id && <span style={{marginLeft:'auto', fontSize:10, color:'var(--accent)'}}>✓</span>}
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ─── Freebird/Video Editor ─── */

function FreebirdEditor({ block, onUpdate }) {
  const sbConf = (() => {
    if (block._sourceId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block._sourceId);
      return (sb && sb.config) || {};
    }
    if (block.standaloneId) {
      const sb = (typeof STANDALONE_BLOCKS !== 'undefined' ? STANDALONE_BLOCKS : []).find(s => s.id === block.standaloneId);
      return (sb && sb.config) || {};
    }
    return {};
  })();
  const ytUrl = block.youtubeUrl || sbConf.youtubeUrl || 'https://www.youtube.com/watch?v=gp-x_jRBRcE';
  const thumbOvr = block.thumbnailOverride || sbConf.thumbnailOverride || '';
  const m = ytUrl.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  const autoThumb = m ? 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg' : '';
  const set = (key, v) => onUpdate(block.id, {...block, [key]: v});

  return (
    <>
      <Section title="Vídeo">
        <Field label="URL de YouTube">
          <input className="input mono" style={{fontSize:11}} value={ytUrl} onChange={e => set('youtubeUrl', e.target.value)} />
        </Field>
        <Field label="Miniatura personalizada (URL)">
          <input className="input mono" style={{fontSize:11}} placeholder="Dejar vacío para auto-generar" value={thumbOvr} onChange={e => set('thumbnailOverride', e.target.value)} />
        </Field>
        {(thumbOvr || autoThumb) && (
          <div style={{marginTop:8, borderRadius:'var(--r-sm)', overflow:'hidden', background:'#0f172a'}}>
            <img src={thumbOvr || autoThumb} alt="" style={{width:'100%', opacity:0.85}} />
            <div style={{textAlign:'center', padding:'6px 10px', color:'#93c5fd', fontSize:12, fontWeight:700}}>▶ Ver vídeo</div>
          </div>
        )}
      </Section>
    </>
  );
}

/* ─── Composed Block Editor (read-only) ─── */

function ComposedEditor({ block, onUpdate, lang, onOpenBackoffice }) {
  const cbSource = (typeof window !== 'undefined' && window.COMPOSED_BLOCKS) || (typeof COMPOSED_BLOCKS !== 'undefined' ? COMPOSED_BLOCKS : []);
  const cb = block.composedId
    ? cbSource.find(c => c.id === block.composedId)
    : null;
  if (!cb) return <div style={{padding:16, fontSize:12, color:'var(--text-subtle)'}}>Bloque compuesto no encontrado ({block.composedId})</div>;

  const prods = (cb.products || []).map(pid => _liveProducts().find(p => p.id === pid)).filter(Boolean);
  const intro = (cb.i18n && cb.i18n[lang] && cb.i18n[lang].introText) || cb.introText || '';

  return (
    <>
      <Section title="Bloque compuesto">
        <div style={{padding:10, background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', border:'1px dashed var(--border-strong)'}}>
          <div style={{fontSize:14, fontWeight:700}}>{cb.title}</div>
          {cb.desc && <div style={{fontSize:11, color:'var(--text-muted)', marginTop:3}}>{cb.desc}</div>}
        </div>
      </Section>

      {intro && (
        <Section title="Texto intro" defaultOpen={false}>
          <div style={{fontSize:12, color:'var(--text)', lineHeight:1.6, padding:'8px 0', whiteSpace:'pre-wrap'}}>{intro.length > 200 ? intro.slice(0,200) + '…' : intro}</div>
        </Section>
      )}

      {prods.length > 0 && (
        <Section title={'Productos (' + prods.length + ')'}>
          <div style={{display:'flex', flexDirection:'column', gap:4}}>
            {prods.map(p => <ProductMini key={p.id} productId={p.id} />)}
          </div>
        </Section>
      )}

      {cb.brandStrip && cb.brandStrip !== 'none' && (
        <Section title="Strip de marca">
          <div style={{fontSize:12, color:'var(--text-muted)'}}>→ {cb.brandStrip}</div>
        </Section>
      )}

      {(cb.includeHero || cb.includeSteps) && (
        <Section title="Extras">
          {cb.includeHero && <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:4}}>+ Hero PimPam</div>}
          {cb.includeSteps && <div style={{fontSize:12, color:'var(--text-muted)'}}>+ 4 pasos PimPam</div>}
        </Section>
      )}

      <div className="insp-bo-cta">
        <div>
          Los bloques compuestos se editan desde el <strong>Backoffice → Bloques</strong>.
        </div>
        {onOpenBackoffice && (
          <button className="btn btn-primary" onClick={onOpenBackoffice}>
            <Icon name="database" size={12} /> Abrir en Backoffice
          </button>
        )}
      </div>
    </>
  );
}

Object.assign(window, { Inspector, AiTextPopover });