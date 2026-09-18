import { getArticles, getMangaIndex } from '../lib/content';

const SITE_URL = 'https://kdkamato.vercel.app';

function validDate(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? new Date(parsed) : undefined;
}

export default async function sitemap() {
  const [articles, manga] = await Promise.all([
    getArticles({ limit: 500 }).catch(() => []),
    getMangaIndex({ limit: 500 }).catch(() => [])
  ]);

  const staticRoutes = [
    ['', 'daily', 1],
    ['/knowledge', 'daily', 0.9],
    ['/manga', 'daily', 0.9],
    ['/lab', 'weekly', 0.9],
    ['/training', 'weekly', 0.9],
    ['/lab/exercise-fit', 'monthly', 0.8],
    ['/lab/squat-geometry', 'monthly', 0.8],
    ['/lab/physique-goal', 'monthly', 0.7],
    ['/lab/knee-to-wall', 'monthly', 0.7],
    ['/lab/ape-index', 'monthly', 0.7],
    ['/lab/femur-tibia', 'monthly', 0.7],
    ['/lab/v-taper', 'monthly', 0.7],
    ['/lab/ffmi', 'monthly', 0.7]
  ].map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority
  }));

  const articleRoutes = articles
    .filter((article) => article.Slug)
    .map((article) => ({
      url: `${SITE_URL}/knowledge/${encodeURIComponent(article.Slug)}`,
      lastModified: validDate(article.Publish_Date),
      changeFrequency: 'monthly',
      priority: 0.8
    }));

  const mangaRoutes = manga
    .filter((episode) => episode.Slug)
    .map((episode) => ({
      url: `${SITE_URL}/manga/${encodeURIComponent(episode.Slug)}`,
      lastModified: validDate(episode.Publish_Date),
      changeFrequency: 'monthly',
      priority: 0.8
    }));

  return [...staticRoutes, ...articleRoutes, ...mangaRoutes];
}
