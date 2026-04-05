// MegaUp embed URL'den kaynak çözer (consumet MegaUp extractor akışı)
const axios = require('axios')

const SERVER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    const embedUrl = req.query.url || (req.body && req.body.url)
    if (!embedUrl) return res.json({ ok: false, error: 'url parametresi gerekli' })

    console.log('[megaup] embed url:', embedUrl)

    // 1. /e/ → /media/ dönüştür
    const mediaUrl = embedUrl.replace('/e/', '/media/')
    console.log('[megaup] media url:', mediaUrl)

    // 2. Media endpoint'ten şifreli veriyi çek (aynı desktop UA ile)
    const mediaRes = await axios.get(mediaUrl, {
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': SERVER_UA,
        'Referer': embedUrl,
      }
    })
    console.log('[megaup] media status:', mediaRes.status)
    const encryptedData = mediaRes.data?.result
    if (!encryptedData) {
      return res.json({ ok: false, error: 'media result boş', raw: JSON.stringify(mediaRes.data).slice(0, 200) })
    }
    console.log('[megaup] encrypted data length:', encryptedData.length)

    // 3. dec-mega'ya şifreli veri + aynı UA gönder
    const decRes = await axios.post('https://enc-dec.app/api/dec-mega', {
      text: encryptedData,
      agent: SERVER_UA,
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('[megaup] dec-mega status:', decRes.status)
    const decrypted = decRes.data?.result
    if (!decrypted) {
      return res.json({ ok: false, error: 'dec-mega boş', raw: JSON.stringify(decRes.data).slice(0, 200) })
    }

    res.json({
      ok: true,
      sources: (decrypted.sources || []).map(s => ({
        url: s.file,
        isM3U8: s.file.includes('.m3u8') || s.file.endsWith('m3u8'),
      })),
      subtitles: (decrypted.tracks || [])
        .filter(t => t.kind === 'captions' || t.kind === 'subtitles')
        .map(t => ({ url: t.file, lang: t.label }))
    })
  } catch (e) {
    console.error('[megaup] error:', e.message)
    res.json({ ok: false, error: e.message })
  }
}
