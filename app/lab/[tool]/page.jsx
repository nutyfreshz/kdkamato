import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { ApeIndexTool, ExerciseFitTool, FFMITool, FemurTibiaTool, KneeToWallTool, PhysiqueGoalTool, SquatGeometryTool, VTaperTool } from '../../../components/lab/LabTools';
import { getLanguage } from '../../../lib/language';

const tools = {
  'exercise-fit': { th: { title: 'ทำไมบางท่ารู้สึกไม่เข้ากับโครงคุณ? — KDKAMATO LAB', description: 'ใช้สัดส่วนร่างกายเพื่อเข้าใจว่าตำแหน่งและช่วงการเคลื่อนไหวใน Squat, Bench Press และ Deadlift อาจเปลี่ยนอย่างไร' }, en: { title: 'Exercise Fit Explorer — KDKAMATO LAB', description: 'Use body proportions to understand mechanical tendencies across Squat, Bench Press, and Deadlift.' }, Component: ExerciseFitTool },
  'squat-geometry': { th: { title: 'Squat แบบไหนควรลองก่อน? — KDKAMATO LAB', description: 'เปรียบเทียบรูปแบบ Squat การยกส้น ความกว้างเท้า และการเดินหน้าของเข่าในแบบจำลองตำแหน่ง' }, en: { title: 'Squat Geometry — KDKAMATO LAB', description: 'Compare heel elevation, stance, knee travel, and Squat variants in a deterministic position model.' }, Component: SquatGeometryTool },
  'physique-goal': { th: { title: 'อยากให้หุ่นดู V ขึ้น ควรพัฒนาอะไร? — KDKAMATO LAB', description: 'สำรวจการเปลี่ยนสัดส่วนไหล่ต่อเอวหลายแบบ โดยไม่ใช้เป็นคะแนนพันธุกรรมหรือความน่าดึงดูด' }, en: { title: 'Physique Goal Explorer — KDKAMATO LAB', description: 'Explore shoulder-to-waist proportion scenarios without genetic or attractiveness scoring.' }, Component: PhysiqueGoalTool },
  'v-taper': { th: { title: 'สัดส่วน V ของคุณตอนนี้เป็นอย่างไร? — KDKAMATO LAB', description: 'คำนวณอัตราส่วนรอบไหล่ต่อรอบเอว พร้อมขอบเขตว่าเลขนี้บอกอะไรได้และบอกอะไรไม่ได้' }, en: { title: 'V-Taper Snapshot — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.' }, Component: VTaperTool },
  'ffmi': { th: { title: 'มวลไร้ไขมันของคุณมากแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'คำนวณ FFMI เพื่อใช้ติดตามตัวเอง พร้อมข้อจำกัดจากการประเมินเปอร์เซ็นต์ไขมัน' }, en: { title: 'FFMI Snapshot — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation.' }, Component: FFMITool },
  'knee-to-wall': { th: { title: 'เข่าคุณเดินหน้าได้แค่ไหน? — KDKAMATO LAB', description: 'วัด Knee-to-Wall ซ้ายและขวา เพื่อใช้เป็นข้อมูลประกอบเรื่องการเคลื่อนไหวของข้อเท้าใน Squat' }, en: { title: 'Knee-to-Wall — KDKAMATO LAB', description: 'Measure left and right knee-to-wall distance as weight-bearing ankle-motion context for Squat.' }, Component: KneeToWallTool },
  'ape-index': { th: { title: 'แขนคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: 'เทียบช่วงแขนกับส่วนสูงเพื่อดูระยะเอื้อม โดยไม่ใช้ทำนายความสามารถในการเล่นกีฬา' }, en: { title: 'Ape Index — KDKAMATO LAB', description: 'Compare arm span with height and use the result as reach context, not a performance prediction.' }, Component: ApeIndexTool },
  'femur-tibia': { th: { title: 'ต้นขาคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง? — KDKAMATO LAB', description: 'คำนวณความสัมพันธ์ของช่วงต้นขากับหน้าแข้ง แล้วนำไปทดลองต่อใน Squat Geometry' }, en: { title: 'Femur:Tibia Snapshot — KDKAMATO LAB', description: 'Calculate the femur-to-tibia segment relationship and explore Squat geometry without overprescribing a variant.' }, Component: FemurTibiaTool }
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
