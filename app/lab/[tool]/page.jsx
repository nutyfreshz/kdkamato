import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { ApeIndexTool, ExerciseFitTool, FFMITool, FemurTibiaTool, PhysiqueGoalTool, SquatGeometryTool, VTaperTool } from '../../../components/lab/LabTools';

const tools = {
  'exercise-fit': { title: 'Exercise Fit Explorer — KDKAMATO LAB', description: 'Use body proportions to understand mechanical tendencies across squat, bench press and deadlift.', Component: ExerciseFitTool },
  'squat-geometry': { title: 'Squat Geometry Explorer — KDKAMATO LAB', description: 'Compare heel elevation, stance, knee travel and squat variants in a deterministic schematic.', Component: SquatGeometryTool },
  'physique-goal': { title: 'Physique Goal Explorer — KDKAMATO LAB', description: 'Explore shoulder-to-waist proportion scenarios without genetic or attractiveness scoring.', Component: PhysiqueGoalTool },
  'v-taper': { title: 'V-Taper Snapshot — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.', Component: VTaperTool },
  'ffmi': { title: 'FFMI Snapshot — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation and genetic-ceiling claims.', Component: FFMITool },
  'ape-index': { title: 'Ape Index — KDKAMATO LAB', description: 'Compare arm span with height and use the result as reach context, not a performance prediction.', Component: ApeIndexTool },
  'femur-tibia': { title: 'Femur:Tibia Snapshot — KDKAMATO LAB', description: 'Calculate femur-to-tibia segment relationship and explore squat geometry without overprescribing a variant.', Component: FemurTibiaTool }
};

export function generateMetadata({ params }) {
  const tool = tools[params.tool];
  return tool ? { title: tool.title, description: tool.description } : { title: 'KDKAMATO LAB' };
}

export default function Page({ params }) {
  const tool = tools[params.tool];
  if (!tool) notFound();
  const Component = tool.Component;
  return <><SiteHeader/><main className="tool-page shell"><Component/></main></>;
}
