// MegaUp embed URL'ini server-side'dan çözer
// Android uygulaması embed URL'ini gönderir, biz enc-dec.app'i server'dan çağırırız
const https = require('https')

const SERVER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const u = new URL(url)
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': SERVER_UA,
      }
    }
    const req = https.request(opts, res => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) } catch { resolve({ raw }) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    const embedUrl = req.query.url || (req.body && req.body.url)
    if (!embedUrl) return res.json({ ok: false, error: 'url parametresi gerekli' })

    console.log('[megaup] embed url:', embedUrl)

    const d = await postJson('https://enc-dec.app/api/dec-mega', {
      text: embedUrl,
      agent: SERVER_UA
    })

    console.log('[megaup] dec-mega response:', JSON.stringify(d).slice(0, 200))

    if (!d.result && !d.sources) {
      return res.json({ ok: false, error: 'dec-mega boş', raw: JSON.stringify(d).slice(0, 200) })
    }

    const result = d.result || d
    res.json({
      ok: true,
      sources: (result.sources || []).map(s => ({ url: s.file, isM3U8: (s.file || '').includes('.m3u8') })),
      subtitles: (result.tracks || [])
        .filter(t => t.kind === 'captions' || t.kind === 'subtitles')
        .map(t => ({ url: t.file, lang: t.label }))
    })
  } catch (e) {
    console.error('[megaup] error:', e.message)
    res.json({ ok: false, error: e.message })
  }
}
