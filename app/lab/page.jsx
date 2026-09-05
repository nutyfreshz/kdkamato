import Link from 'next/link';
import SiteHeader from '../../components/SiteHeader';

export const metadata = { title: 'LAB' };
export default function LabPage() {
  return <><SiteHeader/><main className="listing-page shell lab-page"><p className="eyebrow cyan">KDKAMATO LAB</p><h1>TEST YOURSELF.</h1><p className="listing-intro">Interactive acquisition tools are modular website features. They do not touch the Manga publishing pipeline.</p><div className="lab-library"><Link href="/lab/frame-analysis"><span>01</span><h2>FRAME ANALYZER</h2><p>Structural profile tool. Scientific model still needs validation before public launch.</p><b>OPEN →</b></Link><div className="disabled-tool"><span>02</span><h2>STRENGTH PROFILE</h2><p>Planned.</p></div><div className="disabled-tool"><span>03</span><h2>FFMI</h2><p>Planned.</p></div></div></main></>;
}
