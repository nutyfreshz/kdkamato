import './globals.css';

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

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
