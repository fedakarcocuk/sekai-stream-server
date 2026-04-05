const express = require('express')
const https = require('https')
const http = require('http')
const { ANIME } = require('@consumet/extensions')

const app = express()
app.use(express.json())
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
app.options('*', (_, res) => res.sendStatus(204))

let provider = null
function getProvider() {
  if (!provider) provider = new ANIME.AnimeKai()
  return provider
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib.get(url, { headers }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return resolve(httpGet(res.headers.location, headers))
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

app.get('/search', async (req, res) => {
  try {
    const r = await getProvider().search(req.query.q || '')
    res.json({ ok: true, results: r.results || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
})

app.get('/info', async (req, res) => {
  try {
    const info = await getProvider().fetchAnimeInfo(req.query.id || '')
    res.json({ ok: true, episodes: info.episodes || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
})

app.get('/episode', async (req, res) => {
  try {
    const src = await getProvider().fetchEpisodeSources(req.query.id || '')
    res.json({ ok: true, sources: src.sources || [], subtitles: src.subtitles || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
})

app.get('/subtitle', async (req, res) => {
  try {
    const text = await httpGet(req.query.url || '', {
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://animekai.to',
      'Referer': 'https://animekai.to/'
    })
    res.json({ ok: true, text })
  } catch (e) { res.json({ ok: false, error: e.message }) }
})

app.post('/translate', async (req, res) => {
  try {
    const { cues } = req.body
    const lines = cues.map(c => c.text.replace(/\n/g, ' '))
    const q = encodeURIComponent(lines.join('\n'))
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${q}`
    const data = await httpGet(url, { 'User-Agent': 'Mozilla/5.0' })
    const json = JSON.parse(data)
    const parts = json[0].map(x => x[0]).join('').split('\n')
    res.json({ ok: true, cues: cues.map((c, i) => ({ ...c, text: parts[i] ?? c.text })) })
  } catch (e) { res.json({ ok: false, error: e.message }) }
})

app.get('/', (_, res) => res.json({ status: 'SekaiAniVault Stream Server çalışıyor' }))

const PORT = process.env.PORT || 4939
app.listen(PORT, () => console.log(`Server: http://0.0.0.0:${PORT}`))
