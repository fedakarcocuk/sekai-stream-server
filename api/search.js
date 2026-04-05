const { ANIME } = require('@consumet/extensions')
const provider = new ANIME.AnimeKai()

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const r = await provider.search(req.query.q || '')
    res.json({ ok: true, results: r.results || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
}
