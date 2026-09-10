import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { FFMITool, KneeToWallTool, VTaperTool } from '../../../components/lab/LabQuickTools';
import { ApeIndexSimpleTool, ExerciseFitSimpleTool, FemurTibiaSimpleTool } from '../../../components/lab/LabSimpleTools';
import { PhysiqueScenarioExploreTool } from '../../../components/lab/PhysiqueScenarioExploreTool';
import { SquatSetupTrialTool } from '../../../components/lab/SquatSetupTrialTool';
import { getLanguage } from '../../../lib/language';

const tools = {
  'exercise-fit': { th: { title: 'Exercise Fit — KDKAMATO LAB', description: 'เลือกท่าก่อน แล้วใช้เฉพาะค่าที่จำเป็นเพื่อดูว่าควรเปรียบเทียบการปรับท่าแบบใด' }, en: { title: 'Exercise Fit — KDKAMATO LAB', description: 'Choose the movement first, then use only the measurements needed for that movement.' }, Component: ExerciseFitSimpleTool },
  'squat-geometry': { th: { title: 'Squat setup แบบไหนควรลองก่อน? — KDKAMATO LAB', description: 'เลือกท่า Squat ที่ใช้อยู่ แล้วใช้สัดส่วนช่วงขาจัดลำดับการเปรียบเทียบที่ควรลองก่อน โดยเปลี่ยนทีละอย่าง' }, en: { title: 'Squat Setup Trial — KDKAMATO LAB', description: 'Choose the Squat variant you use and prioritize two setup comparisons from your leg proportions, changing one thing at a time.' }, Component: SquatSetupTrialTool },
  'physique-goal': { th: { title: 'Physique Scenario — KDKAMATO LAB', description: 'ลองคำนวณสถานการณ์จำลองว่าถ้ารอบไหล่หรือเอวเปลี่ยน สัดส่วน V (V-shape) จะเปลี่ยนอย่างไร โดยไม่ใช้เป็นคำแนะนำ' }, en: { title: 'Physique Scenario — KDKAMATO LAB', description: 'Explore how hypothetical shoulder or waist changes affect the V-ratio without treating the result as a prescription.' }, Component: PhysiqueScenarioExploreTool },
  'v-taper': { th: { title: 'สัดส่วน V (V-shape) ของคุณตอนนี้เป็นอย่างไร? — KDKAMATO LAB', description: 'คำนวณอัตราส่วนรอบไหล่ต่อรอบเอว พร้อมอธิบายว่าตัวเลขนี้บอกอะไรได้และบอกอะไรไม่ได้' }, en: { title: 'V-Taper Snapshot — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.' }, Component: VTaperTool },
  'ffmi': { th: { title: 'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'คำนวณ FFMI เพื่อใช้ติดตามตัวเอง พร้อมข้อจำกัดจากการประเมินเปอร์เซ็นต์ไขมัน' }, en: { title: 'FFMI Snapshot — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation.' }, Component: FFMITool },
  'knee-to-wall': { th: { title: 'เข่าของคุณเดินหน้าได้แค่ไหน? — KDKAMATO LAB', description: 'วัด Knee-to-Wall ซ้ายและขวา เพื่อใช้เป็นข้อมูลประกอบเรื่องการเคลื่อนไหวของข้อเท้าในท่า Squat' }, en: { title: 'Knee-to-Wall — KDKAMATO LAB', description: 'Measure left and right knee-to-wall distance as weight-bearing ankle-motion context for Squat.' }, Component: KneeToWallTool },
  'ape-index': { th: { title: 'แขนของคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'Quick Check สำหรับวัดระยะเอื้อม (reach) เท่านั้น แล้วนำค่าเดิมไปใช้ต่อใน Exercise Fit' }, en: { title: 'Ape Index — KDKAMATO LAB', description: 'A Quick Check for reach only; reuse the same value in Exercise Fit.' }, Component: ApeIndexSimpleTool },
  'femur-tibia': { th: { title: 'ต้นขาของคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง? — KDKAMATO LAB', description: 'Quick Check สำหรับวัดสัดส่วนช่วงขา แล้วนำค่าเดิมไปใช้ต่อใน Exercise Fit หรือ Squat Setup Trial' }, en: { title: 'Femur:Tibia — KDKAMATO LAB', description: 'A Quick Check for leg proportions; reuse the same values in Exercise Fit or Squat Geometry.' }, Component: FemurTibiaSimpleTool }
};

export async function generateMetadata({ params }) {
  const language = await getLanguage();
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  return tool ? tool[language] : { title: 'KDKAMATO LAB' };
}

export default async function Page({ params }) {
  const language = await getLanguage();
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  if (!tool) notFound();
  const Component = tool.Component;
  return <><SiteHeader language={language}/><main className="tool-page shell"><Component language={language}/></main></>;
}
