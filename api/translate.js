const https = require('https')

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end()
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
}
