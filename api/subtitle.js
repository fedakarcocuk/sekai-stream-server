const https = require('https')
const http = require('http')

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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const text = await httpGet(req.query.url || '', {
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://animekai.to',
      'Referer': 'https://animekai.to/'
    })
    res.json({ ok: true, text })
  } catch (e) { res.json({ ok: false, error: e.message }) }
}
