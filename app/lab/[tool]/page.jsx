import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { FFMITool, KneeToWallTool, VTaperTool } from '../../../components/lab/LabTools';
import { ApeIndexSimpleTool, ExerciseFitSimpleTool, FemurTibiaSimpleTool, PhysiqueGoalSimpleTool, SquatGeometrySimpleTool } from '../../../components/lab/LabSimpleTools';
import { getLanguage } from '../../../lib/language';

const tools = {
  'exercise-fit': { th: { title: 'Exercise Fit — KDKAMATO LAB', description: 'เลือกท่าก่อน แล้วใช้เฉพาะค่าที่จำเป็นเพื่อดูว่า setup ไหนควรลองเปรียบเทียบ' }, en: { title: 'Exercise Fit — KDKAMATO LAB', description: 'Choose the movement first, then use only the measurements needed for that movement.' }, Component: ExerciseFitSimpleTool },
  'squat-geometry': { th: { title: 'Squat setup แบบไหนควรลองก่อน? — KDKAMATO LAB', description: 'ใช้ค่าช่วงขาที่วัดไว้แล้วเปลี่ยน setup ทีละอย่าง โดยไม่ต้องตีความภาพมุมข้อต่อ' }, en: { title: 'Squat Setup Explorer — KDKAMATO LAB', description: 'Reuse leg measurements and compare one setup variable at a time without a joint-angle diagram.' }, Component: SquatGeometrySimpleTool },
  'physique-goal': { th: { title: 'อยากให้หุ่นดู V ขึ้น ควรเปลี่ยนด้านไหน? — KDKAMATO LAB', description: 'ใช้รอบไหล่และเอวที่วัดไว้เป็นฐาน แล้วเปรียบเทียบ scenario แบบง่าย ๆ' }, en: { title: 'Physique Goal Explorer — KDKAMATO LAB', description: 'Reuse shoulder and waist measurements as a baseline and compare simple scenarios.' }, Component: PhysiqueGoalSimpleTool },
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
