import './globals.css';
import './i18n.css';
import './lab-ui.css';
import './typography-tuning.css';
import { getLanguage } from '../lib/language';

export const metadata = {
  title: {
    default: 'KDKAMATO — Scientific Manga Universe',
    template: '%s | KDKAMATO'
  },
  description: 'Evidence-led fitness knowledge through Manga, deep-dive articles, interactive LAB tools, and training.',
  metadataBase: new URL('https://kdkamato.com'),
  openGraph: {
    title: 'KDKAMATO — Scientific Manga Universe',
    description: 'Manga. Knowledge. LAB. Training.',
    type: 'website'
  }
};

export default async function RootLayout({ children }) {
  const language = await getLanguage();
  return (
    <html lang={language}>
      <body>{children}</body>
    </html>
  );
}
