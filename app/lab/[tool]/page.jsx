import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { ApeIndexTool, ExerciseFitTool, FFMITool, FemurTibiaTool, KneeToWallTool, PhysiqueGoalTool, SquatGeometryTool, VTaperTool } from '../../../components/lab/LabTools';

const tools = {
  'exercise-fit': { title: 'ท่าไหนเข้ากับโครงคุณ? — KDKAMATO LAB', description: 'Use body proportions to understand mechanical tendencies across squat, bench press and deadlift.', Component: ExerciseFitTool },
  'squat-geometry': { title: 'Squat แบบไหนเข้ากับขาคุณ? — KDKAMATO LAB', description: 'Compare heel elevation, stance, knee travel and squat variants in a deterministic schematic.', Component: SquatGeometryTool },
  'physique-goal': { title: 'อยาก V-shape ขึ้น ควรพัฒนาอะไร? — KDKAMATO LAB', description: 'Explore shoulder-to-waist proportion scenarios without genetic or attractiveness scoring.', Component: PhysiqueGoalTool },
  'v-taper': { title: 'หุ่น V ของคุณตอนนี้เท่าไหร่? — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.', Component: VTaperTool },
  'ffmi': { title: 'คุณมีกล้ามมากแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation and genetic-ceiling claims.', Component: FFMITool },
  'knee-to-wall': { title: 'เข่าคุณเดินหน้าได้แค่ไหน? — KDKAMATO LAB', description: 'Measure left and right knee-to-wall distance as weight-bearing ankle dorsiflexion context for squat strategy.', Component: KneeToWallTool },
  'ape-index': { title: 'แขนคุณยาวแค่ไหนเมื่อเทียบกับตัว? — KDKAMATO LAB', description: 'Compare arm span with height and use the result as reach context, not a performance prediction.', Component: ApeIndexTool },
  'femur-tibia': { title: 'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง? — KDKAMATO LAB', description: 'Calculate femur-to-tibia segment relationship and explore squat geometry without overprescribing a variant.', Component: FemurTibiaTool }
};

export async function generateMetadata({ params }) {
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  return tool ? { title: tool.title, description: tool.description } : { title: 'KDKAMATO LAB' };
}

export default async function Page({ params }) {
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  if (!tool) notFound();
  const Component = tool.Component;
  return <><SiteHeader/><main className="tool-page shell"><Component/></main></>;
}
