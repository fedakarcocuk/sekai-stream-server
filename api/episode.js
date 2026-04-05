const { ANIME } = require('@consumet/extensions')
const provider = new ANIME.AnimeKai()

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end()
  try {
    const src = await provider.fetchEpisodeSources(req.query.id || '')
    res.json({ ok: true, sources: src.sources || [], subtitles: src.subtitles || [] })
  } catch (e) { res.json({ ok: false, error: e.message }) }
}
