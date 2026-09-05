import SiteHeader from '../../../components/SiteHeader';
import { FrameSnapshotTool } from '../../../components/lab/LabTools';
export const metadata = { title: 'Frame Snapshot — KDKAMATO LAB', description: 'Use wrist and ankle markers as skeletal-frame context without fake universal categories or genetic scoring.' };
export default function Page(){return <><SiteHeader/><main className="tool-page shell"><FrameSnapshotTool/></main></>}
