const { ANIME } = require('@consumet/extensions')
const provider = new ANIME.AnimeKai()

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const info = await provider.fetchAnimeInfo(req.query.id || '')
    res.json({ ok: true, episodes: info.episodes || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
}
