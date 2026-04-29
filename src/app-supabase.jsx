/* ───────────── PERSISTENCE LAYER (ported from v2) ───────────── */

const SUPABASE_URL = 'https://midvgxxndddasxlnstkg.supabase.co'
const SUPABASE_KEY = 'sb_publishable_uiXB5JmZfPETeyGn3Rsw_Q_D7SLaJNd'
const SUPABASE_TABLE = 'composer_data'
const SUPABASE_ROW_ID = 'main'
const STORAGE_KEY = 'bomedia_composer_data'
const DRAFT_KEY = 'bomedia_draft_blocks'

function supabaseFetch(method, body) {
  let url = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?id=eq.' + SUPABASE_ROW_ID
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': method === 'GET' ? '' : 'return=minimal',
    },
  }
  if (method === 'GET') {
    url = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?select=data&id=eq.' + SUPABASE_ROW_ID
    delete opts.headers['Prefer']
  }
  if (body) opts.body = JSON.stringify(body)
  return fetch(url, opts)
}

function loadFromSupabase() {
  return supabaseFetch('GET')
    .then(r => r.json())
    .then(rows => {
      if (rows && rows.length > 0 && rows[0].data && Object.keys(rows[0].data).length > 0) {
        return rows[0].data
      }
      return null
    })
    .catch(() => null)
}

function saveToSupabase(data) {
  return supabaseFetch('PATCH', { data, updated_at: new Date().toISOString() })
    .then(() => true)
    .catch(() => false)
}

function supabaseBackupFetch(method, rowId, body) {
  let url = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE
  if (method === 'GET') {
    url += '?select=id,updated_at&id=like.backup_%&order=updated_at.desc&limit=10'
  } else if (method === 'POST') {
    // just POST to base URL
  } else {
    url += '?id=eq.' + rowId
  }
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : (method === 'GET' ? '' : 'return=minimal'),
    },
  }
  if (method === 'GET') delete opts.headers['Prefer']
  if (body) opts.body = JSON.stringify(body)
  return fetch(url, opts)
}

function saveBackupToSupabase(data, reason) {
  const backupId = 'backup_' + Date.now()
  const body = { id: backupId, data, updated_at: new Date().toISOString() }
  supabaseBackupFetch('POST', null, body).then(r => {
    if (r.ok) console.log('Supabase backup saved:', backupId, '(' + reason + ')')
    pruneSupabaseBackups()
  }).catch(e => console.error('Supabase backup error:', e))
  return backupId
}

function pruneSupabaseBackups() {
  supabaseBackupFetch('GET').then(r => r.json()).then(rows => {
    if (rows && rows.length > 5) {
      const toDelete = rows.slice(5)
      toDelete.forEach(row => {
        const delUrl = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?id=eq.' + row.id
        fetch(delUrl, { method:'DELETE', headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY} })
      })
    }
  }).catch(() => {})
}

function listSupabaseBackups() {
  return supabaseBackupFetch('GET').then(r => r.json()).then(rows => {
    return (rows || []).map(row => ({ id: row.id, date: row.updated_at }))
  }).catch(() => [])
}

function loadSupabaseBackup(backupId) {
  const url = SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?select=data&id=eq.' + backupId
  return fetch(url, {
    headers: {'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY},
  }).then(r => r.json()).then(rows => {
    if (rows && rows.length > 0 && rows[0].data) return rows[0].data
    return null
  }).catch(() => null)
}

function getStorageData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveStorageData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

function getDraftBlocks() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return null
}

function saveDraftBlocks(blocks) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(blocks)) } catch {}
}

/* Copy email HTML to clipboard as RICH content — that's what makes Gmail
   and Outlook paste the rendered email instead of the source code. We put
   both text/html (for rich paste) and text/plain (fallback for editors that
   only accept plain) on the clipboard.

   Returns a Promise<{ ok: boolean, mode: 'rich' | 'plain' | null, error?: string }>. */
function copyHtmlAsRich(html) {
  const safe = String(html || '')
  // Modern path — ClipboardItem with both MIME types. Requires secure
  // context (HTTPS or localhost) and a user gesture, which the click
  // handler already provides.
  if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof window.ClipboardItem === 'function') {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([safe], { type: 'text/html' }),
        'text/plain': new Blob([safe], { type: 'text/plain' }),
      }),
    ]).then(() => ({ ok: true, mode: 'rich' }))
      .catch(err => {
        // Fall back to plain text if the rich write was rejected (e.g.
        // permission policy in some browsers)
        return navigator.clipboard.writeText(safe)
          .then(() => ({ ok: true, mode: 'plain' }))
          .catch(err2 => ({ ok: false, mode: null, error: err2.message || String(err2) }))
      })
  }
  // Legacy fallback
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(safe)
      .then(() => ({ ok: true, mode: 'plain' }))
      .catch(err => ({ ok: false, mode: null, error: err.message || String(err) }))
  }
  return Promise.resolve({ ok: false, mode: null, error: 'Clipboard API not available' })
}

Object.assign(window, {
  SUPABASE_URL, SUPABASE_KEY, SUPABASE_TABLE, SUPABASE_ROW_ID, STORAGE_KEY, DRAFT_KEY,
  supabaseFetch, loadFromSupabase, saveToSupabase,
  supabaseBackupFetch, saveBackupToSupabase, pruneSupabaseBackups, listSupabaseBackups, loadSupabaseBackup,
  getStorageData, saveStorageData, getDraftBlocks, saveDraftBlocks,
  copyHtmlAsRich,
})
