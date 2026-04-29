/* ───────────── BACKOFFICE VIEW ───────────── */

function Backoffice({ brandFilter, setBrandFilter, appState, setAppState, onLoadTemplateInCompositor, currentUser, isItemHidden, setItemHiddenForCurrentUser, autoHideForOthers }) {
  const isAdmin = currentUser?.role === 'admin';
  const [tab, setTab] = React.useState('products');
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState(null); // { kind, item }

  // Read live data from appState (falls back to globals so the BO still works if not wired)
  const products = (appState && appState.products) || PRODUCTS;
  const brands = (appState && appState.brands) || BRANDS;
  const texts = (appState && appState.prewrittenTexts) || PREWRITTEN_TEXTS;
  const templates = (appState && appState.templates) || TEMPLATES;
  const blocks = (appState && appState.standaloneBlocks) || STANDALONE_BLOCKS;

  // Persist edits from the drawer back into appState.
  const onSave = (kind, data) => {
    if (!setAppState) return;
    const collection = {
      product: 'products',
      brand: 'brands',
      text: 'prewrittenTexts',
      template: 'templates',
      standalone: 'standaloneBlocks',
      user: 'users',
    }[kind];
    if (!collection) { setEditing(null); return; }
    let isNew = false;
    setAppState(prev => {
      const list = prev[collection] || [];
      const i = list.findIndex(x => x.id === data.id);
      isNew = i < 0;
      const next = i >= 0
        ? list.map((x, idx) => idx === i ? Object.assign({}, x, data) : x)
        : [...list, data];
      return Object.assign({}, prev, { [collection]: next });
    });
    // For non-user collections: if the current commercial user just created
    // the item, auto-hide it from other users so each operator owns their
    // additions until they explicitly share them.
    if (isNew && collection !== 'users' && typeof autoHideForOthers === 'function') {
      setTimeout(() => autoHideForOthers(collection, data.id), 0);
    }
    setEditing(null);
  };

  const users = (appState && appState.users) || [];

  const baseNavItems = [
    { id: 'products', label: 'Productos', icon: 'box', count: products.length },
    { id: 'brands', label: 'Marcas', icon: 'palette', count: brands.length },
    { id: 'texts', label: 'Textos', icon: 'text', count: texts.length },
    { id: 'templates', label: 'Plantillas', icon: 'template', count: templates.length },
    { id: 'blocks', label: 'Bloques', icon: 'layers', count: blocks.length },
  ];
  const adminNavItems = [
    { id: 'users', label: 'Usuarios', icon: 'lock', count: users.length },
    { id: 'ai', label: 'Asistente IA', icon: 'sparkles' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];
  // Commercial users get a "Mi tono IA" tab so they can tune their own
  // assistant without admin intervention.
  const commercialNavItems = [
    { id: 'mytone', label: 'Mi tono IA', icon: 'sparkles' },
  ];
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : [...baseNavItems, ...commercialNavItems];

  // Bounce non-admin users away from admin-only tabs (defensive — they
  // shouldn't be able to reach them via UI, but state may be stale)
  React.useEffect(() => {
    if (!isAdmin && (tab === 'users' || tab === 'ai' || tab === 'settings')) {
      setTab('products');
    }
  }, [isAdmin, tab]);

  const titleMap = {
    products: { title: 'Productos', sub: 'Catálogo multi-marca. 5 idiomas por producto.' },
    brands: { title: 'Marcas', sub: 'Logos, URLs y colores por idioma.' },
    texts: { title: 'Textos pre-escritos', sub: 'Plantillas de texto reutilizables.' },
    templates: { title: 'Plantillas', sub: 'Emails pre-montados listos para editar.' },
    blocks: { title: 'Bloques compuestos', sub: 'Cabeceras, footers, heroes y strips.' },
    users: { title: 'Usuarios', sub: 'Gestiona accesos y roles. Solo admin.' },
    ai: { title: 'Asistente de redacción', sub: 'API key y tono por idioma. Solo admin.' },
    settings: { title: 'Ajustes', sub: 'Sincronización, acceso y preferencias. Solo admin.' },
    mytone: { title: 'Mi tono IA', sub: 'Tu prompt personal por idioma. Solo lo ves tú y se aplica cuando pides ayuda al asistente.' },
  };
  const current = titleMap[tab] || titleMap.products;

  const filteredProducts = products.filter(p =>
    (brandFilter === 'all' || p.brand === brandFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bo-shell">
      <nav className="bo-nav">
        <div className="bo-nav-title">Gestión</div>
        {navItems.map(n => (
          <button
            key={n.id}
            className={'bo-nav-item' + (tab === n.id ? ' active' : '')}
            onClick={() => setTab(n.id)}
          >
            <Icon name={n.icon} size={15} />
            <span>{n.label}</span>
            {n.count != null && <span className="count mono">{n.count}</span>}
          </button>
        ))}
      </nav>

      <main className="bo-main scroll">
        <div className="bo-main-header">
          <div>
            <h1 className="bo-title">{current.title}</h1>
            <div className="bo-subtitle">{current.sub}</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn-outline"><Icon name="download" size={14}/> Exportar</button>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> Nuevo</button>
          </div>
        </div>

        {tab === 'products' && (
          <>
            <div className="bo-toolbar">
              <div className="bo-search">
                <Icon name="search" size={14} />
                <input placeholder="Buscar productos…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
                  <div className="brand-chips" style={{padding:0, margin:0}}>
                <button className={'brand-chip' + (brandFilter === 'all' ? ' active' : '')} onClick={() => setBrandFilter('all')}>Todas</button>
                {brands.filter(b => b.id !== 'bomedia').map(b => (
                  <button key={b.id} className={'brand-chip' + (brandFilter === b.id ? ' active' : '')} onClick={() => setBrandFilter(b.id)} style={brandFilter === b.id ? {} : { color: b.color }}>
                    <span className="brand-chip-dot" style={{ background: b.color }} />
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-grid">
              {filteredProducts.map(p => {
                const brand = brands.find(b => b.id === p.brand) || { label: p.brand, color: '#999' };
                const hidden = isItemHidden && isItemHidden('products', p.id);
                return (
                  <div key={p.id} className={'product-card' + (hidden ? ' hidden-for-user' : '')} onClick={() => setEditing({ kind: 'product', item: p })}>
                    <button
                      className="card-visibility-btn"
                      title={hidden ? 'Mostrarme este producto en el composer' : 'Ocultarme este producto en el composer'}
                      onClick={e => { e.stopPropagation(); setItemHiddenForCurrentUser && setItemHiddenForCurrentUser('products', p.id, !hidden); }}
                    >
                      <Icon name={hidden ? 'eyeOff' : 'eye'} size={14} />
                    </button>
                    <div className="product-card-img">
                      <img src={p.img} alt={p.name} />
                      <span className="product-card-badge" style={{background: 'color-mix(in oklch, ' + brand.color + ' 15%, transparent)', color: brand.color}}>
                        {p.badge}
                      </span>
                    </div>
                    <div className="product-card-body">
                      <div className={'product-card-brand ' + p.brand}>{brand.label}</div>
                      <div className="product-card-name">{p.name}</div>
                      <div className="product-card-desc">{p.desc}</div>
                      <div className="product-card-footer">
                        <span>{p.area}</span>
                        <span className="price">{p.price}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'brands' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14}}>
            {brands.map(b => (
              <div key={b.id} className="product-card" style={{padding:20}} onClick={() => setEditing({ kind: 'brand', item: b })}>
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                  <div style={{width:40, height:40, borderRadius:'var(--r-sm)', background:'color-mix(in oklch, ' + b.color + ' 15%, transparent)', display:'grid', placeItems:'center', color:b.color, fontWeight:700}}>
                    {(b.logoText || b.label || '?')[0]}
                  </div>
                  <div>
                    <div style={{fontSize:15, fontWeight:600, letterSpacing:'-0.01em'}}>{b.label}</div>
                    <div style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>{b.id}</div>
                  </div>
                </div>
                <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:10}}>5 idiomas configurados · {products.filter(p => p.brand === b.id).length} productos</div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {['ES','FR','DE','EN','NL'].map(l => (
                    <span key={l} style={{fontSize:10, fontFamily:'var(--font-mono)', padding:'2px 7px', background:'var(--bg-sunken)', borderRadius:4, color:'var(--text-muted)'}}>{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'texts' && (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {texts.map(t => {
              const brand = brands.find(b => b.id === t.brand) || brands[brands.length - 1] || { label: t.brand, color: '#999' };
              const hidden = isItemHidden && isItemHidden('prewrittenTexts', t.id);
              return (
                <div key={t.id} className={'product-card' + (hidden ? ' hidden-for-user' : '')} style={{padding:16, display:'grid', gridTemplateColumns:'auto 36px 1fr auto', gap:14, alignItems:'center', cursor:'pointer'}} onClick={() => setEditing({ kind: 'text', item: t })}>
                  <button className="card-visibility-btn inline" title={hidden ? 'Mostrarme' : 'Ocultarme'}
                    onClick={e => { e.stopPropagation(); setItemHiddenForCurrentUser && setItemHiddenForCurrentUser('prewrittenTexts', t.id, !hidden); }}>
                    <Icon name={hidden ? 'eyeOff' : 'eye'} size={13} />
                  </button>
                  <div className={'lib-icon ' + t.brand} style={{width:36, height:36}}>{t.icon}</div>
                  <div>
                    <div style={{fontSize:14, fontWeight:500, marginBottom:3}}>{t.name}</div>
                    <div style={{fontSize:12, color:'var(--text-muted)', lineHeight:1.5}}>{t.text}</div>
                  </div>
                  <div style={{display:'flex', gap:4}}>
                    <span style={{fontSize:10, fontFamily:'var(--font-mono)', padding:'3px 8px', background:'color-mix(in oklch, ' + brand.color + ' 12%, transparent)', color:brand.color, borderRadius:4, fontWeight:500}}>{brand.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'templates' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14}}>
            {templates.map(t => {
              const brand = brands.find(b => b.id === t.brand) || brands[brands.length - 1] || { label: t.brand, color: '#999' };
              const colorClassMap = { blue:'oklch(60% 0.18 255)', purple:'oklch(60% 0.18 295)', orange:'oklch(65% 0.17 45)', teal:'oklch(60% 0.12 180)', gray:'oklch(70% 0.02 250)' };
              const tplColor = colorClassMap[t.colorClass || 'gray'];
              const hidden = isItemHidden && isItemHidden('templates', t.id);
              return (
                <div key={t.id} className={'product-card' + (hidden ? ' hidden-for-user' : '')} style={{padding:18, cursor:'pointer', position:'relative', overflow:'hidden'}} onClick={() => setEditing({ kind: 'template', item: t })}>
                  <button className="card-visibility-btn" title={hidden ? 'Mostrarme' : 'Ocultarme'}
                    onClick={e => { e.stopPropagation(); setItemHiddenForCurrentUser && setItemHiddenForCurrentUser('templates', t.id, !hidden); }}>
                    <Icon name={hidden ? 'eyeOff' : 'eye'} size={14} />
                  </button>
                  <div style={{position:'absolute', left:0, top:0, bottom:0, width:4, background:tplColor}}/>
                  <div style={{display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:10}}>
                    <div style={{width:40, height:40, borderRadius:'var(--r-sm)', background:'color-mix(in oklch, ' + brand.color + ' 15%, transparent)', display:'grid', placeItems:'center', color:brand.color}}>
                      <Icon name="template" size={18}/>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4}}>
                      <span className="mono" style={{fontSize:10, color:'var(--text-muted)'}}>{((t.blocks && t.blocks.length) || (t.compositorBlocks && t.compositorBlocks.length) || 0)} bloques</span>
                      {t.colorClass && (
                        <span style={{fontSize:9, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:1, color:tplColor, fontWeight:700}}>● {t.colorClass}</span>
                      )}
                    </div>
                  </div>
                  <div style={{fontSize:16, fontWeight:600, marginBottom:4, letterSpacing:'-0.01em'}}>{t.name}</div>
                  <div style={{fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:12}}>{t.desc}</div>
                  <div style={{display:'flex', gap:6, paddingTop:12, borderTop:'1px solid var(--border)'}}>
                    <button
                      className="btn btn-outline"
                      style={{fontSize:12, padding:'5px 10px'}}
                      onClick={e => { e.stopPropagation(); onLoadTemplateInCompositor && onLoadTemplateInCompositor(t.id); }}
                      title="Abrir esta plantilla en el Compositor para editar su contenido"
                    >
                      <Icon name="layers" size={11}/> Editar contenido
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{fontSize:12, padding:'5px 10px'}}
                      onClick={e => { e.stopPropagation(); setEditing({ kind: 'template', item: t }); }}
                    >
                      Estructura
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'blocks' && (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {blocks.map(b => {
              const brand = brands.find(x => x.id === b.brand) || brands[brands.length - 1] || { label: b.brand, color: '#999' };
              const hidden = isItemHidden && isItemHidden('standaloneBlocks', b.id);
              return (
                <div key={b.id} className={'product-card' + (hidden ? ' hidden-for-user' : '')} style={{padding:16, display:'grid', gridTemplateColumns:'auto 40px 1fr auto auto', gap:14, alignItems:'center', cursor:'pointer'}} onClick={() => setEditing({ kind: 'standalone', item: b })}>
                  <button className="card-visibility-btn inline" title={hidden ? 'Mostrarme' : 'Ocultarme'}
                    onClick={e => { e.stopPropagation(); setItemHiddenForCurrentUser && setItemHiddenForCurrentUser('standaloneBlocks', b.id, !hidden); }}>
                    <Icon name={hidden ? 'eyeOff' : 'eye'} size={13} />
                  </button>
                  <div className={'lib-icon ' + b.brand} style={{width:40, height:40, fontSize:16}}>{b.icon}</div>
                  <div>
                    <div style={{fontSize:14, fontWeight:500}}>{b.title}</div>
                    <div style={{fontSize:11, color:'var(--text-muted)'}} className="serif">{b.section}</div>
                  </div>
                  <span style={{fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)'}}>{b.type || b.blockType}</span>
                  <button className="btn btn-ghost" style={{fontSize:12}} onClick={e => { e.stopPropagation(); setEditing({ kind: 'standalone', item: b }); }}>Editar</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'users' && isAdmin && (
          <UsersPanel users={users} setAppState={setAppState} currentUser={currentUser} setEditing={setEditing} />
        )}

        {tab === 'mytone' && currentUser && !isAdmin && (
          <MyToneIaPanel currentUser={currentUser} setAppState={setAppState} />
        )}

        {tab === 'ai' && <AISettingsPanel appState={appState} setAppState={setAppState} />}

        {tab === 'settings' && (
          <div style={{maxWidth:620, display:'flex', flexDirection:'column', gap:14}}>
            <div className="product-card" style={{padding:20}}>
              <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>Sincronización</div>
              <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:10}}>Estado: <span style={{color:'var(--success)'}}>●</span> conectado · Supabase · último sync hace 2 min</div>
              <div style={{display:'flex', gap:6}}>
                <button className="btn btn-outline" style={{fontSize:12}}>Forzar sync</button>
                <button className="btn btn-ghost" style={{fontSize:12}}>Exportar JSON</button>
              </div>
            </div>
            <div className="product-card" style={{padding:20}}>
              <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>Acceso backoffice</div>
              <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:10}}>Protegido con contraseña. Sesión activa 24h.</div>
              <button className="btn btn-outline" style={{fontSize:12}}>Cambiar contraseña</button>
            </div>
          </div>
        )}
      </main>

      {editing && <BackofficeDrawer editing={editing} onClose={() => setEditing(null)} onSave={onSave} />}
    </div>
  );
}

function BackofficeDrawer({ editing, onClose, onSave }) {
  const { kind, item } = editing;
  const [lang, setLang] = React.useState('es');
  const [data, setData] = React.useState(item);

  const titleByKind = {
    product: 'Editar producto',
    brand: 'Editar marca',
    text: 'Editar texto',
    template: 'Editar plantilla',
    standalone: 'Editar bloque',
    user: 'Editar usuario',
  };

  return (
    <>
      <div className="bo-drawer-overlay" onClick={onClose} />
      <div className="bo-drawer" onClick={e => e.stopPropagation()}>
        <div className="bo-drawer-header">
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:4}}>{titleByKind[kind]}</div>
            <div className="bo-drawer-title">{data.name || data.label || data.title}</div>
          </div>
          {['product','text'].includes(kind) && (
            <div className="lang-pill">
              {['es','fr','de','en','nl'].map(l => (
                <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
          )}
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>

        <div className="bo-drawer-body">
          {kind === 'product' && (
            <ProductBOEdit data={data} setData={setData} lang={lang} />
          )}
          {kind === 'brand' && (
            <BrandBOEdit data={data} setData={setData} />
          )}
          {kind === 'text' && (
            <TextBOEdit data={data} setData={setData} lang={lang} />
          )}
          {kind === 'template' && (
            <TemplateBOEdit data={data} setData={setData} />
          )}
          {kind === 'standalone' && (
            <StandaloneBOEdit data={data} setData={setData} />
          )}
          {kind === 'user' && (
            <UserBOEdit data={data} setData={setData} />
          )}
        </div>

        <div className="bo-drawer-footer">
          <button className="btn btn-ghost danger" style={{color:'var(--danger)', marginRight:'auto'}}>
            <Icon name="trash" size={13}/> Eliminar
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSave ? onSave(kind, data) : onClose()}>
            <Icon name="zap" size={13}/> Guardar cambios
          </button>
        </div>
      </div>
    </>
  );
}

function ProductBOEdit({ data, setData, lang }) {
  // Spanish (base) writes to top-level fields. Other languages write to
  // data.i18n[lang].{desc,feat1,feat2,price,link,badge} — that's the schema
  // the email-gen + getLocalizedProduct expect. Name + image + brand + area
  // + badge colours are NOT translated (the model is always the same across
  // languages).
  const TRANSLATABLE = ['desc','feat1','feat2','price','link','badge'];
  const isBase = lang === 'es';
  const i18nAll = data.i18n || {};
  const tr = i18nAll[lang] || {};

  const setBase = (k, v) => setData({...data, [k]: v});

  const trVal = (k) => (isBase ? (data[k] ?? '') : (tr[k] ?? ''));
  const setTr = (k, v) => {
    if (isBase) { setData({...data, [k]: v}); return; }
    const next = {...tr};
    if (v === '' || v == null) delete next[k]; else next[k] = v;
    const nextI18n = {...i18nAll, [lang]: next};
    if (Object.keys(next).length === 0) delete nextI18n[lang];
    setData({...data, i18n: nextI18n});
  };

  const placeholder = (k) => isBase ? '' : (data[k] || '');

  // Translation status — a language counts as "translated" if its i18n entry
  // has *any* value. ES is always considered translated (it is the base).
  const isTranslated = (l) => {
    if (l === 'es') return true;
    const t = i18nAll[l];
    return !!(t && TRANSLATABLE.some(k => t[k]));
  };

  return (
    <>
      <div className="field">
        <div className="field-label-row">
          <label className="field-label">Imagen</label>
          <span style={{fontSize:10, color:'var(--text-subtle)'}}>común a todos los idiomas</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:14, alignItems:'start'}}>
          <div style={{aspectRatio:'1', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', padding:8, display:'grid', placeItems:'center', border:'1px solid var(--border)'}}>
            <img src={data.img} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}}/>
          </div>
          <div>
            <input className="input mono" style={{fontSize:11, marginBottom:6}} value={data.img || ''} onChange={e => setBase('img', e.target.value)} />
            <button className="btn btn-outline" style={{fontSize:12}}><Icon name="download" size={12}/> Subir nueva</button>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14}}>
        <div className="field">
          <label className="field-label">Nombre <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
          <input className="input" value={data.name || ''} onChange={e => setBase('name', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Badge ({lang.toUpperCase()})</label>
          <input className="input" value={trVal('badge')} placeholder={placeholder('badge')} onChange={e => setTr('badge', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <div className="field-label-row">
          <label className="field-label">Descripción ({lang.toUpperCase()})</label>
          {!isBase && (
            <button className="field-reset" onClick={() => setTr('desc', '')} title="Borrar override de este idioma (vuelve a usar el español)">
              Restaurar
            </button>
          )}
        </div>
        <textarea className="textarea" rows={3} value={trVal('desc')} placeholder={placeholder('desc')} onChange={e => setTr('desc', e.target.value)} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Precio ({lang.toUpperCase()})</label>
          <input className="input mono" value={trVal('price')} placeholder={placeholder('price')} onChange={e => setTr('price', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Área <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
          <input className="input" value={data.area || ''} onChange={e => setBase('area', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Marca <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
          <select className="select" value={data.brand || ''} onChange={e => setBase('brand', e.target.value)}>
            {BRANDS.filter(b => b.id !== 'bomedia').map(b => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Feature 1 ({lang.toUpperCase()})</label>
          <input className="input" value={trVal('feat1')} placeholder={placeholder('feat1')} onChange={e => setTr('feat1', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Feature 2 ({lang.toUpperCase()})</label>
          <input className="input" value={trVal('feat2')} placeholder={placeholder('feat2')} onChange={e => setTr('feat2', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Enlace ({lang.toUpperCase()})</label>
        <input className="input mono" style={{fontSize:11}} value={trVal('link')} placeholder={placeholder('link')} onChange={e => setTr('link', e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Idiomas traducidos</label>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {['es','fr','de','en','nl'].map(l => {
            const ok = isTranslated(l);
            const isActive = l === lang;
            return (
              <span key={l} style={{
                fontSize:11, fontFamily:'var(--font-mono)', padding:'3px 8px', borderRadius:4, fontWeight:500,
                background: ok ? (isActive ? 'var(--success)' : 'color-mix(in oklch, var(--success) 35%, var(--bg-sunken))') : 'var(--bg-sunken)',
                color: ok && isActive ? 'white' : (ok ? 'var(--text)' : 'var(--text-subtle)'),
                border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
              }}>
                {l.toUpperCase()} {ok && '✓'}
              </span>
            );
          })}
        </div>
        <div style={{fontSize:10, color:'var(--text-subtle)', marginTop:6, lineHeight:1.4}}>
          Si dejas un campo vacío en un idioma, el email usará automáticamente el español como fallback.
        </div>
      </div>
    </>
  );
}

function BrandBOEdit({ data, setData }) {
  const set = (k, v) => setData({...data, [k]: v});
  const setLangField = (field, lang, value) => {
    const next = Object.assign({}, data[field] || {}, { [lang]: value });
    set(field, next);
  };
  const liveProducts = (typeof window !== 'undefined' && window.PRODUCTS) || PRODUCTS || [];
  const labelInitial = (data.logoText || data.label || data.id || '?').slice(0, 1);
  const safeColor = data.color || '#94a3b8';

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'80px 1fr', gap:14, alignItems:'center', marginBottom:16}}>
        <div style={{width:80, height:80, borderRadius:'var(--r-md)', background:'color-mix(in oklch, ' + safeColor + ' 15%, transparent)', display:'grid', placeItems:'center', color:safeColor, fontWeight:700, fontSize:28, overflow:'hidden'}}>
          {data.logo ? (
            <img src={data.logo} alt="" style={{maxWidth:'90%', maxHeight:'90%', objectFit:'contain'}} />
          ) : (
            <span>{labelInitial}</span>
          )}
        </div>
        <div>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="input" value={data.label || ''} onChange={e => set('label', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Texto del logo (fallback)</label>
          <input className="input" value={data.logoText || ''} onChange={e => set('logoText', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Color de marca</label>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="color" value={safeColor} onChange={e => set('color', e.target.value)} style={{width:32, height:30, border:'1px solid var(--border)', borderRadius:4, padding:0, cursor:'pointer'}} />
            <input className="input mono" style={{fontSize:11}} value={data.color || ''} onChange={e => set('color', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">URL del logo</label>
        <input className="input mono" style={{fontSize:11}} value={data.logo || ''} placeholder="https://…/logo.png" onChange={e => set('logo', e.target.value)} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Altura del logo (px)</label>
          <input className="input" value={data.logoHeight || ''} placeholder="22" onChange={e => set('logoHeight', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Color del divider</label>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="color" value={data.divider || '#e2e8f0'} onChange={e => set('divider', e.target.value)} style={{width:32, height:30, border:'1px solid var(--border)', borderRadius:4, padding:0, cursor:'pointer'}} />
            <input className="input mono" style={{fontSize:11}} value={data.divider || ''} onChange={e => set('divider', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">URLs por idioma</label>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {['es','fr','de','en','nl'].map(l => {
            const urlObj = (data.url && typeof data.url === 'object') ? data.url : {};
            return (
              <div key={l} style={{display:'grid', gridTemplateColumns:'36px 1fr', gap:8, alignItems:'center'}}>
                <span className="mono" style={{fontSize:11, color:'var(--text-muted)'}}>{l.toUpperCase()}</span>
                <input
                  className="input mono"
                  style={{fontSize:11}}
                  placeholder={'https://' + (data.id || '') + '.com'}
                  value={urlObj[l] || ''}
                  onChange={e => setLangField('url', l, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Texto del enlace por idioma</label>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {['es','fr','de','en','nl'].map(l => {
            const labelObj = (data.urlLabel && typeof data.urlLabel === 'object') ? data.urlLabel : {};
            return (
              <div key={l} style={{display:'grid', gridTemplateColumns:'36px 1fr', gap:8, alignItems:'center'}}>
                <span className="mono" style={{fontSize:11, color:'var(--text-muted)'}}>{l.toUpperCase()}</span>
                <input
                  className="input"
                  style={{fontSize:12}}
                  placeholder="ej. boprint.net →"
                  value={labelObj[l] || ''}
                  onChange={e => setLangField('urlLabel', l, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Uso</label>
        <div style={{fontSize:12, color:'var(--text-muted)', padding:'10px 12px', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)'}}>
          {liveProducts.filter(p => p.brand === data.id).length} productos asignados a esta marca
        </div>
      </div>
    </>
  );
}

function TextBOEdit({ data, setData, lang }) {
  // Spanish (base) writes to `data.text`; other languages write to
  // `data.i18n[lang].text`. Name + icon + brand are common across languages.
  const isBase = lang === 'es';
  const i18nAll = data.i18n || {};
  const tr = i18nAll[lang] || {};

  const setBase = (k, v) => setData({...data, [k]: v});
  const text = isBase ? (data.text || '') : (tr.text || '');
  const setText = (v) => {
    if (isBase) { setData({...data, text: v}); return; }
    const next = {...tr};
    if (v === '') delete next.text; else next.text = v;
    const nextI18n = {...i18nAll, [lang]: next};
    if (Object.keys(next).length === 0) delete nextI18n[lang];
    setData({...data, i18n: nextI18n});
  };

  const isTranslated = (l) => l === 'es' ? true : !!(i18nAll[l] && i18nAll[l].text);

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Nombre interno <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
          <input className="input" value={data.name || ''} onChange={e => setBase('name', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Icono <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
          <input className="input" value={data.icon || ''} onChange={e => setBase('icon', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Categoría / marca <span style={{fontSize:10, color:'var(--text-subtle)', fontWeight:400}}>(común)</span></label>
        <select className="select" value={data.brand || 'mix'} onChange={e => setBase('brand', e.target.value)}>
          <option value="mix">Multi-marca</option>
          {BRANDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>

      <div className="field">
        <div className="field-label-row">
          <label className="field-label">Texto ({lang.toUpperCase()})</label>
          {!isBase && (
            <button className="field-reset" onClick={() => setText('')} title="Borrar override de este idioma">Restaurar</button>
          )}
        </div>
        <textarea className="textarea" rows={6} value={text} placeholder={isBase ? '' : (data.text || '')} onChange={e => setText(e.target.value)} />
        <div className="char-count mono">{text.length} caracteres</div>
      </div>

      <div className="field">
        <label className="field-label">Variables detectadas</label>
        <div className="var-chips">
          {(text.match(/\{\{\w+\}\}/g) || []).map((v,i) => (
            <span key={i} className="var-chip mono">{v}</span>
          ))}
          {(text.match(/\{\{\w+\}\}/g) || []).length === 0 && (
            <span style={{fontSize:11, color:'var(--text-subtle)', fontStyle:'italic'}}>Ninguna — usa {"{{nombre}}"} o similar</span>
          )}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Idiomas traducidos</label>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {['es','fr','de','en','nl'].map(l => {
            const ok = isTranslated(l);
            const isActive = l === lang;
            return (
              <span key={l} style={{
                fontSize:11, fontFamily:'var(--font-mono)', padding:'3px 8px', borderRadius:4, fontWeight:500,
                background: ok ? (isActive ? 'var(--success)' : 'color-mix(in oklch, var(--success) 35%, var(--bg-sunken))') : 'var(--bg-sunken)',
                color: ok && isActive ? 'white' : (ok ? 'var(--text)' : 'var(--text-subtle)'),
                border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
              }}>
                {l.toUpperCase()} {ok && '✓'}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* Generate a short, human-readable label for a compositorBlocks entry. */
function describeTplBlock(block) {
  if (!block) return 'Bloque vacío';
  switch (block.type) {
    case 'text': {
      const txt = (block.text || '').trim();
      if (!txt) return 'Texto (vacío)';
      return 'Texto · ' + txt.slice(0, 50) + (txt.length > 50 ? '…' : '');
    }
    case 'brand_strip': return 'Brand strip · ' + (block.brand || '?');
    case 'product_single': return 'Producto · ' + (block.product1 || '?');
    case 'product_pair': return '2 productos · ' + (block.product1 || '?') + ' + ' + (block.product2 || '?');
    case 'product_trio': return '3 productos · ' + [block.product1, block.product2, block.product3].filter(Boolean).join(' + ');
    case 'pimpam_hero': return 'Hero · ' + (block.heroTitle || 'sin título');
    case 'pimpam_steps': return 'Pasos PimPam';
    case 'video':
    case 'freebird': return 'Vídeo';
    case 'block': return 'Bloque · ' + (block.id || '?');
    default: return block.type || 'desconocido';
  }
}

function TemplateBOEdit({ data, setData }) {
  const set = (k, v) => setData({...data, [k]: v});
  const compBlocks = Array.isArray(data.compositorBlocks) ? data.compositorBlocks : [];
  const legacyRefs = Array.isArray(data.blocks) ? data.blocks : [];

  const moveBlock = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= compBlocks.length) return;
    const next = [...compBlocks];
    [next[i], next[j]] = [next[j], next[i]];
    set('compositorBlocks', next);
  };
  const deleteBlock = (i) => {
    const next = compBlocks.filter((_, idx) => idx !== i);
    set('compositorBlocks', next);
  };
  const addBlock = (type) => {
    const stub = (() => {
      switch (type) {
        case 'text': return { type:'text', text:'' };
        case 'brand_strip': return { type:'brand_strip', brand: data.brand || 'artisjet' };
        case 'product_single': return { type:'product_single', product1: '' };
        case 'product_pair': return { type:'product_pair', product1: '', product2: '' };
        case 'product_trio': return { type:'product_trio', product1: '', product2: '', product3: '' };
        case 'pimpam_hero': return { type:'pimpam_hero', heroTitle: '' };
        case 'pimpam_steps': return { type:'pimpam_steps' };
        case 'video': return { type:'video', youtubeUrl: '' };
        default: return { type };
      }
    })();
    set('compositorBlocks', [...compBlocks, stub]);
  };

  const [adding, setAdding] = React.useState(false);

  return (
    <>
      <div className="field">
        <label className="field-label">Nombre de la plantilla</label>
        <input className="input" value={data.name || ''} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Descripción</label>
        <textarea className="textarea" rows={2} value={data.desc || ''} onChange={e => set('desc', e.target.value)} />
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Marca principal</label>
          <select className="select" value={data.brand || 'mix'} onChange={e => set('brand', e.target.value)}>
            <option value="mix">Multi-marca</option>
            {BRANDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Color</label>
          <select className="select" value={data.colorClass || 'gray'} onChange={e => set('colorClass', e.target.value)}>
            <option value="blue">Azul</option>
            <option value="purple">Morado</option>
            <option value="orange">Naranja</option>
            <option value="teal">Teal</option>
            <option value="gray">Gris</option>
          </select>
        </div>
      </div>

      <div className="field">
        <div className="field-label-row">
          <label className="field-label">Bloques incluidos · {compBlocks.length}</label>
          <span style={{fontSize:10, color:'var(--text-subtle)'}}>Edita el contenido de cada bloque desde el Compositor</span>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:4, padding:'8px', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)'}}>
          {compBlocks.length === 0 && legacyRefs.length === 0 && (
            <div style={{padding:'10px 12px', fontSize:12, color:'var(--text-subtle)', textAlign:'center', fontStyle:'italic'}}>
              Sin bloques. Añade el primero abajo.
            </div>
          )}
          {compBlocks.map((b, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--bg-panel)', borderRadius:4, fontSize:12, border:'1px solid var(--border)'}}>
              <Icon name="drag" size={12}/>
              <span className="mono" style={{color:'var(--text-muted)', fontSize:10, minWidth:18}}>{String(i+1).padStart(2,'0')}</span>
              <span style={{flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{describeTplBlock(b)}</span>
              <button className="icon-btn" style={{width:22, height:22}} disabled={i===0} onClick={() => moveBlock(i, -1)} title="Subir"><Icon name="arrowUp" size={11}/></button>
              <button className="icon-btn" style={{width:22, height:22}} disabled={i===compBlocks.length-1} onClick={() => moveBlock(i, 1)} title="Bajar"><Icon name="arrowDown" size={11}/></button>
              <button className="icon-btn" style={{width:22, height:22, color:'var(--danger)'}} onClick={() => deleteBlock(i)} title="Eliminar"><Icon name="trash" size={11}/></button>
            </div>
          ))}
          {/* Legacy ref-based templates (older Supabase data) — show read-only */}
          {legacyRefs.length > 0 && compBlocks.length === 0 && legacyRefs.map((ref, i) => (
            <div key={'legacy-'+i} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--bg-panel)', borderRadius:4, fontSize:12, border:'1px dashed var(--border)', opacity:0.7}}>
              <span className="mono" style={{color:'var(--text-muted)', fontSize:10, minWidth:18}}>{String(i+1).padStart(2,'0')}</span>
              <span style={{flex:1, fontFamily:'var(--font-mono)', fontSize:11}}>ref · {ref}</span>
            </div>
          ))}

          {!adding ? (
            <button className="btn btn-ghost" style={{fontSize:12, justifyContent:'center', marginTop:4}} onClick={() => setAdding(true)}>
              <Icon name="plus" size={12}/> Añadir bloque
            </button>
          ) : (
            <div style={{display:'flex', flexWrap:'wrap', gap:4, padding:6, background:'var(--bg-panel)', borderRadius:4, marginTop:4, border:'1px solid var(--border)'}}>
              {[
                {id:'text', label:'Texto'},
                {id:'brand_strip', label:'Brand strip'},
                {id:'product_single', label:'1 producto'},
                {id:'product_pair', label:'2 productos'},
                {id:'product_trio', label:'3 productos'},
                {id:'pimpam_hero', label:'Hero'},
                {id:'pimpam_steps', label:'Pasos'},
                {id:'video', label:'Vídeo'},
              ].map(t => (
                <button key={t.id} className="btn btn-outline" style={{fontSize:11, padding:'4px 8px'}} onClick={() => { addBlock(t.id); setAdding(false); }}>
                  {t.label}
                </button>
              ))}
              <button className="btn btn-ghost" style={{fontSize:11, padding:'4px 8px'}} onClick={() => setAdding(false)}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StandaloneBOEdit({ data, setData }) {
  const set = (k, v) => setData({...data, [k]: v});
  return (
    <>
      <div className="field">
        <label className="field-label">Título</label>
        <input className="input" value={data.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Sección</label>
          <select className="select" value={data.section} onChange={e => set('section', e.target.value)}>
            {['heroes','marcas','cabeceras','otros'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Tipo</label>
          <input className="input mono" style={{fontSize:11}} value={data.type} onChange={e => set('type', e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">Marca asociada</label>
        <select className="select" value={data.brand} onChange={e => set('brand', e.target.value)}>
          <option value="mix">Multi-marca</option>
          {BRANDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="field-label">Contenido HTML (plantilla)</label>
        <textarea className="textarea mono" style={{fontSize:11}} rows={8} placeholder={'<div class="hero">...</div>'} />
      </div>
    </>
  );
}

/* Users panel — admin-only. Lists all users, lets admin create new ones,
   change passwords, switch role, or delete (except themselves). */
function UsersPanel({ users, setAppState, currentUser, setEditing }) {
  const createUser = () => {
    const id = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const newUser = {
      id,
      name: 'Nuevo usuario',
      role: 'commercial',
      passwordHash: '', // empty until admin sets one in the drawer
      hiddenItems: {},
      aiStyles: {},
    };
    setEditing({ kind: 'user', item: newUser });
  };
  const remove = (u) => {
    if (u.id === currentUser?.id) { alert('No puedes eliminar el usuario con el que estás conectado.'); return; }
    if (!window.confirm('¿Eliminar usuario "' + u.name + '"? Esta acción no se puede deshacer.')) return;
    setAppState(prev => ({ ...prev, users: (prev.users || []).filter(x => x.id !== u.id) }));
  };
  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <div style={{fontSize:12, color:'var(--text-muted)'}}>{users.length} usuario{users.length === 1 ? '' : 's'}</div>
        <button className="btn btn-primary" style={{fontSize:12}} onClick={createUser}>
          <Icon name="plus" size={12}/> Nuevo usuario
        </button>
      </div>
      {users.map(u => {
        const isMe = u.id === currentUser?.id;
        const hasPw = !!u.passwordHash;
        return (
          <div key={u.id} className="product-card" style={{padding:16, display:'grid', gridTemplateColumns:'40px 1fr auto auto', gap:14, alignItems:'center', cursor:'pointer'}} onClick={() => setEditing({ kind: 'user', item: u })}>
            <div className={'lib-icon ' + (u.role === 'admin' ? 'mbo' : 'artisjet')} style={{width:40, height:40, fontSize:16, fontWeight:700}}>
              {u.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:8}}>
                {u.name}
                {isMe && <span style={{fontSize:10, fontFamily:'var(--font-mono)', padding:'1px 6px', background:'var(--accent-soft)', color:'var(--accent-ink)', borderRadius:4}}>tú</span>}
              </div>
              <div style={{fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>{u.id}</div>
            </div>
            <span style={{fontSize:10, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:1, padding:'3px 8px', borderRadius:4, fontWeight:700,
              background: u.role === 'admin' ? 'color-mix(in oklch, var(--mbo) 15%, transparent)' : 'color-mix(in oklch, var(--artisjet) 12%, transparent)',
              color: u.role === 'admin' ? 'var(--mbo)' : 'var(--artisjet)',
            }}>{u.role}</span>
            <div style={{display:'flex', gap:4, alignItems:'center'}}>
              {!hasPw && <span style={{fontSize:10, color:'var(--danger)', fontFamily:'var(--font-mono)'}}>sin pw</span>}
              <button className="btn btn-ghost" style={{fontSize:12}} onClick={e => { e.stopPropagation(); setEditing({ kind: 'user', item: u }); }}>Editar</button>
              <button className="btn btn-ghost" style={{fontSize:12, color: isMe ? 'var(--text-subtle)' : 'var(--danger)'}} disabled={isMe} onClick={e => { e.stopPropagation(); remove(u); }}>
                <Icon name="trash" size={12}/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* User editor — admin sets name, role, password, AI tone per language. */
function UserBOEdit({ data, setData }) {
  const set = (k, v) => setData({ ...data, [k]: v });
  const [pwInput, setPwInput] = React.useState('');
  const [pwHashing, setPwHashing] = React.useState(false);
  const aiStyles = (data.aiStyles && typeof data.aiStyles === 'object') ? data.aiStyles : {};
  const langLabels = { es:'Español', fr:'Français', de:'Deutsch', en:'English', nl:'Nederlands' };

  const setAi = (lang, v) => {
    const next = { ...aiStyles, [lang]: v };
    set('aiStyles', next);
  };
  const applyPassword = () => {
    if (!pwInput) return;
    if (typeof window.sha256Hash !== 'function') { alert('sha256Hash no disponible'); return; }
    setPwHashing(true);
    window.sha256Hash(pwInput).then(hash => {
      set('passwordHash', hash);
      setPwInput('');
      setPwHashing(false);
    });
  };

  return (
    <>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field">
          <label className="field-label">Nombre</label>
          <input className="input" value={data.name || ''} onChange={e => set('name', e.target.value)} placeholder="ej. Sara López"/>
        </div>
        <div className="field">
          <label className="field-label">Rol</label>
          <select className="select" value={data.role || 'commercial'} onChange={e => set('role', e.target.value)}>
            <option value="admin">Admin</option>
            <option value="commercial">Comercial</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field-label">ID interno</label>
        <input className="input mono" style={{fontSize:11}} value={data.id || ''} onChange={e => set('id', e.target.value)} placeholder="u-abc123"/>
        <div style={{fontSize:10, color:'var(--text-subtle)', marginTop:4}}>Identificador único. Cámbialo solo si tienes una razón.</div>
      </div>

      <div className="field">
        <label className="field-label">Contraseña</label>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <input
            type="password"
            className="input"
            style={{flex:1}}
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyPassword()}
            placeholder={data.passwordHash ? 'Escribe nueva contraseña (sustituye la actual)' : 'Define una contraseña'}
          />
          <button className="btn btn-primary" onClick={applyPassword} disabled={!pwInput || pwHashing} style={{fontSize:12}}>
            {pwHashing ? '…' : 'Aplicar'}
          </button>
        </div>
        <div style={{fontSize:11, color: data.passwordHash ? 'var(--success)' : 'var(--danger)', marginTop:6, fontFamily:'var(--font-mono)'}}>
          {data.passwordHash ? '✓ Contraseña configurada (hash SHA-256 guardado)' : '⚠ Sin contraseña — el usuario no podrá iniciar sesión'}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Tono y estilo IA por idioma</label>
        <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:8, lineHeight:1.5}}>
          Cada idioma tiene su propio prompt de tono que se inyecta cuando este usuario pide al asistente que escriba o reescriba un texto.
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {['es','fr','de','en','nl'].map(l => (
            <div key={l}>
              <div style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3, color:'var(--text-muted)'}}>{langLabels[l]} · {l.toUpperCase()}</div>
              <textarea
                className="textarea"
                rows={2}
                value={aiStyles[l] || ''}
                placeholder={'Tono para ' + langLabels[l] + '…'}
                onChange={e => setAi(l, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* Per-user "Mi tono IA" panel — visible to commercial users so they can
   tune their own assistant prompts without needing admin to intervene. */
function MyToneIaPanel({ currentUser, setAppState }) {
  const styles = (currentUser && currentUser.aiStyles) || {};
  const langLabels = { es:'Español', fr:'Français', de:'Deutsch', en:'English', nl:'Nederlands' };

  const updateStyle = (lang, value) => {
    setAppState(prev => ({
      ...prev,
      users: (prev.users || []).map(u => {
        if (u.id !== currentUser.id) return u;
        const aiStyles = Object.assign({}, u.aiStyles || {});
        if (value) aiStyles[lang] = value; else delete aiStyles[lang];
        return { ...u, aiStyles };
      }),
    }));
  };

  return (
    <div style={{maxWidth:680, display:'flex', flexDirection:'column', gap:14}}>
      <div className="product-card" style={{padding:20}}>
        <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>
          Tu tono y estilo · {currentUser.name}
        </div>
        <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:14, lineHeight:1.5}}>
          Estas instrucciones se inyectan como <em>system prompt</em> cuando pides al asistente que escriba o reescriba un texto. Solo afectan a tus generaciones — cada usuario tiene su propio tono.
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {['es','fr','de','en','nl'].map(l => (
            <div key={l}>
              <div style={{fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, color:'var(--text-muted)'}}>{langLabels[l]} · {l.toUpperCase()}</div>
              <textarea
                className="textarea"
                rows={3}
                value={styles[l] || ''}
                placeholder={'Tono para ' + langLabels[l] + '…'}
                onChange={e => updateStyle(l, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 14px', background:'color-mix(in oklch, var(--accent) 8%, var(--bg-panel))', borderRadius:'var(--r-sm)', fontSize:11.5, color:'var(--text-muted)', lineHeight:1.6}}>
        <strong style={{color:'var(--text)'}}>Cómo se usa:</strong> Compositor → click en cualquier bloque de texto → botón <Icon name="sparkles" size={11}/> IA → describe la idea en lenguaje natural. El asistente responde en el idioma activo siguiendo tu tono.
      </div>
    </div>
  );
}

/* Admin-only overview of every user's AI tone prompts. Shows all 5
   languages × all users in a collapsible per-user section, lets the admin
   edit anyone's prompts in place. */
function AiStylesAdminOverview({ appState, setAppState }) {
  const users = (appState && appState.users) || [];
  const [openId, setOpenId] = React.useState(users[0]?.id || null);
  const langLabels = { es:'Español', fr:'Français', de:'Deutsch', en:'English', nl:'Nederlands' };

  const updateStyle = (userId, lang, value) => {
    setAppState(prev => ({
      ...prev,
      users: (prev.users || []).map(u => {
        if (u.id !== userId) return u;
        const aiStyles = Object.assign({}, u.aiStyles || {});
        if (value) aiStyles[lang] = value; else delete aiStyles[lang];
        return { ...u, aiStyles };
      }),
    }));
  };

  if (users.length === 0) return <div style={{fontSize:12, color:'var(--text-muted)'}}>Sin usuarios.</div>;

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {users.map(u => {
        const open = openId === u.id;
        const styles = u.aiStyles || {};
        const langCount = Object.keys(styles).filter(k => styles[k]).length;
        return (
          <div key={u.id} style={{border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden'}}>
            <button
              onClick={() => setOpenId(open ? null : u.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                background: open ? 'var(--bg-sunken)' : 'var(--bg-panel)', textAlign:'left', borderBottom: open ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{fontSize:11, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:1, padding:'2px 6px', borderRadius:4, fontWeight:700,
                background: u.role === 'admin' ? 'color-mix(in oklch, var(--mbo) 15%, transparent)' : 'color-mix(in oklch, var(--artisjet) 12%, transparent)',
                color: u.role === 'admin' ? 'var(--mbo)' : 'var(--artisjet)'}}>{u.role}</span>
              <span style={{fontWeight:500}}>{u.name}</span>
              <span style={{marginLeft:'auto', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>
                {langCount}/5 idioma{langCount === 1 ? '' : 's'}
              </span>
              <Icon name="chevron" size={12} />
            </button>
            {open && (
              <div style={{padding:12, display:'flex', flexDirection:'column', gap:10, background:'var(--bg-panel)'}}>
                {['es','fr','de','en','nl'].map(l => (
                  <div key={l}>
                    <div style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3, color:'var(--text-muted)'}}>{langLabels[l]} · {l.toUpperCase()}</div>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={styles[l] || ''}
                      placeholder={'Tono ' + langLabels[l] + ' para ' + u.name + '…'}
                      onChange={e => updateStyle(u.id, l, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* OpenAI key panel — admin-only. The API key persists in appState (Supabase
   + localStorage) so every device that opens the app gets it. Per-language
   tone prompts no longer live here — they moved to each user's profile
   under Backoffice → Usuarios. */
function AISettingsPanel({ appState, setAppState }) {
  const apiKey = (appState && appState.openaiKey) || '';
  const [tested, setTested] = React.useState('');
  const [testing, setTesting] = React.useState(false);

  const onChangeKey = (v) => {
    if (setAppState) setAppState(prev => ({ ...prev, openaiKey: v }));
    try { sessionStorage.removeItem('bomedia_openai_key'); } catch (e) {}
    setTested('');
  };

  const test = () => {
    if (typeof callOpenAI !== 'function') return;
    setTesting(true);
    callOpenAI({ notes: 'Test rápido: di "ok" en una frase corta.', lang: 'es', mode: 'generate' })
      .then(reply => { setTested('✓ ' + reply.slice(0, 80)); })
      .catch(err => { setTested('Error: ' + err.message); })
      .finally(() => setTesting(false));
  };

  return (
    <div style={{maxWidth:680, display:'flex', flexDirection:'column', gap:14}}>
      <div className="product-card" style={{padding:20}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
          <Icon name="sparkles" size={18}/>
          <div style={{fontSize:15, fontWeight:600}}>Clave OpenAI</div>
        </div>
        <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:12}}>
          Guardada en <strong>Supabase</strong> — la comparten todos los usuarios. Asegúrate de mantener la contraseña de admin fuerte: cualquiera con acceso al Backoffice como admin puede leer la key.
        </div>
        <div style={{display:'flex', gap:8}}>
          <input
            type="password"
            value={apiKey}
            onChange={e => onChangeKey(e.target.value)}
            placeholder="sk-…"
            style={{flex:1, padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:13, fontFamily:'var(--font-mono)', background:'var(--bg-panel)'}}
          />
          <button className="btn btn-outline" onClick={test} disabled={!apiKey || testing} style={{fontSize:12, whiteSpace:'nowrap'}}>
            {testing ? 'Probando…' : 'Probar conexión'}
          </button>
        </div>
        {apiKey && (
          <div style={{marginTop:8, fontSize:12, color:'var(--success)', fontWeight:500}}>✓ API key configurada</div>
        )}
        {tested && (
          <div style={{marginTop:8, fontSize:11, padding:'6px 10px', background:'var(--bg-sunken)', borderRadius:'var(--r-sm)', fontFamily:'var(--font-mono)', color: tested.startsWith('Error') ? 'var(--danger)' : 'var(--success)'}}>
            {tested}
          </div>
        )}
      </div>

      <div className="product-card" style={{padding:20}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6, gap:10}}>
          <div style={{fontSize:14, fontWeight:600}}>Tono y estilo · resumen por usuario</div>
          <span style={{fontSize:11, color:'var(--text-muted)'}}>Cada usuario usa su propio tono al pedir IA</span>
        </div>
        <AiStylesAdminOverview appState={appState} setAppState={setAppState} />
      </div>

      <div style={{padding:'12px 14px', background:'color-mix(in oklch, var(--accent) 8%, var(--bg-panel))', borderRadius:'var(--r-sm)', fontSize:11.5, color:'var(--text-muted)', lineHeight:1.6}}>
        <strong style={{color:'var(--text)'}}>Cómo usarlo:</strong> abre cualquier bloque de texto en el Compositor → botón <Icon name="sparkles" size={11}/> IA → describe la idea → el asistente genera el párrafo en el idioma activo, siguiendo el tono fijado para tu usuario.
      </div>
    </div>
  );
}

Object.assign(window, { Backoffice, AISettingsPanel, UsersPanel, UserBOEdit, AiStylesAdminOverview, MyToneIaPanel });
