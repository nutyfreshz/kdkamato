import './globals.css';
import './i18n.css';
import './lab-ui.css';
import './typography-tuning.css';
import './ui-final-polish.css';
import './ui-final-polish-overrides.css';
import './cinematic-motion.css';
import './home-scroll.css';
import './worldclass-polish.css';
import './cinematic-handoffs-restored.css';
import './cinematic-seam-fixes.css';
import { getLanguage } from '../lib/language';
import { SiteMotion } from '../components/site-motion';

const SITE_URL = 'https://kdkamato.vercel.app';

export const metadata = {
  title: {
    default: 'KDKAMATO — Scientific Manga Universe',
    template: '%s | KDKAMATO'
  },
  description: 'Evidence-led fitness knowledge through Manga, deep-dive articles, interactive LAB tools, and training.',
  applicationName: 'KDKAMATO',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'KDKAMATO — Scientific Manga Universe',
    description: 'Manga. Knowledge. LAB. Training.',
    type: 'website',
    url: SITE_URL,
    siteName: 'KDKAMATO'
  },
  twitter: {
    card: 'summary',
    title: 'KDKAMATO — Scientific Manga Universe',
    description: 'Evidence-led fitness knowledge through Manga, deep-dive articles, interactive LAB tools, and training.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
};

export const viewport = {
  themeColor: '#08090a'
};

export default async function RootLayout({ children }) {
  const language = await getLanguage();
  return (
    <html lang={language}>
      <body>
        <SiteMotion />
        {children}
      </body>
    </html>
  );
}
