import SiteHeader from '../../../components/SiteHeader';

export const metadata = { title: 'Frame Analyzer — Prototype' };
export default function FrameAnalyzerPage() {
  return <><SiteHeader/><main className="tool-page shell"><p className="eyebrow cyan">KDKAMATO LAB / PROTOTYPE</p><h1>FRAME ANALYZER</h1><div className="tool-warning"><strong>Calculation model intentionally not activated yet.</strong><p>We have designed the product surface, but the scientific scoring logic still needs a separate validation pass before public release. This prevents a decorative score from being presented as a genetics assessment.</p></div><a className="text-cta" href="/lab">← BACK TO LAB</a></main></>;
}
