import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { FFMITool, KneeToWallTool, PhysiqueGoalTool, SquatGeometryTool, VTaperTool } from '../../../components/lab/LabTools';
import { ApeIndexSimpleTool, ExerciseFitSimpleTool, FemurTibiaSimpleTool } from '../../../components/lab/LabSimpleTools';
import { getLanguage } from '../../../lib/language';

const tools = {
  'exercise-fit': { th: { title: 'Exercise Fit — KDKAMATO LAB', description: 'เลือกท่าก่อน แล้วใช้เฉพาะค่าที่จำเป็นเพื่อดูว่า setup ไหนควรลองเปรียบเทียบ' }, en: { title: 'Exercise Fit — KDKAMATO LAB', description: 'Choose the movement first, then use only the measurements needed for that movement.' }, Component: ExerciseFitSimpleTool },
  'squat-geometry': { th: { title: 'Squat แบบไหนควรลองก่อน? — KDKAMATO LAB', description: 'เปรียบเทียบรูปแบบ Squat การยกส้น ความกว้างเท้า และการเดินหน้าของเข่าในแบบจำลองตำแหน่ง' }, en: { title: 'Squat Geometry — KDKAMATO LAB', description: 'Compare heel elevation, stance, knee travel, and Squat variants in a deterministic position model.' }, Component: SquatGeometryTool },
  'physique-goal': { th: { title: 'อยากให้หุ่นดู V ขึ้น ควรพัฒนาอะไร? — KDKAMATO LAB', description: 'สำรวจการเปลี่ยนสัดส่วนไหล่ต่อเอวหลายแบบ โดยไม่ใช้เป็นคะแนนพันธุกรรมหรือความน่าดึงดูด' }, en: { title: 'Physique Goal Explorer — KDKAMATO LAB', description: 'Explore shoulder-to-waist proportion scenarios without genetic or attractiveness scoring.' }, Component: PhysiqueGoalTool },
  'v-taper': { th: { title: 'สัดส่วน V ของคุณตอนนี้เป็นอย่างไร? — KDKAMATO LAB', description: 'คำนวณอัตราส่วนรอบไหล่ต่อรอบเอว พร้อมขอบเขตว่าเลขนี้บอกอะไรได้และบอกอะไรไม่ได้' }, en: { title: 'V-Taper Snapshot — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.' }, Component: VTaperTool },
  'ffmi': { th: { title: 'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'คำนวณ FFMI เพื่อใช้ติดตามตัวเอง พร้อมข้อจำกัดจากการประเมินเปอร์เซ็นต์ไขมัน' }, en: { title: 'FFMI Snapshot — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation.' }, Component: FFMITool },
  'knee-to-wall': { th: { title: 'เข่าคุณเดินหน้าได้แค่ไหน? — KDKAMATO LAB', description: 'วัด Knee-to-Wall ซ้ายและขวา เพื่อใช้เป็นข้อมูลประกอบเรื่องการเคลื่อนไหวของข้อเท้าใน Squat' }, en: { title: 'Knee-to-Wall — KDKAMATO LAB', description: 'Measure left and right knee-to-wall distance as weight-bearing ankle-motion context for Squat.' }, Component: KneeToWallTool },
  'ape-index': { th: { title: 'แขนคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'Quick Check สำหรับวัด reach เท่านั้น แล้วนำค่าเดิมไปใช้ต่อใน Exercise Fit' }, en: { title: 'Ape Index — KDKAMATO LAB', description: 'A Quick Check for reach only; reuse the same value in Exercise Fit.' }, Component: ApeIndexSimpleTool },
  'femur-tibia': { th: { title: 'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง? — KDKAMATO LAB', description: 'Quick Check สำหรับวัดสัดส่วนช่วงขา แล้วนำค่าเดิมไปใช้ต่อใน Exercise Fit หรือ Squat Geometry' }, en: { title: 'Femur:Tibia — KDKAMATO LAB', description: 'A Quick Check for leg proportions; reuse the same values in Exercise Fit or Squat Geometry.' }, Component: FemurTibiaSimpleTool }
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
