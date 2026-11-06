import { notFound } from 'next/navigation';
import SiteHeader from '../../../components/SiteHeader';
import { FFMITool, KneeToWallTool, VTaperTool } from '../../../components/lab/LabQuickTools';
import { ApeIndexSimpleTool, ExerciseFitSimpleTool, FemurTibiaSimpleTool } from '../../../components/lab/LabSimpleTools';
import { PhysiqueScenarioExploreTool } from '../../../components/lab/PhysiqueScenarioExploreTool';
import { SquatSetupTrialTool } from '../../../components/lab/SquatSetupTrialTool';
import { getLanguage } from '../../../lib/language';

const tools = {
  'exercise-fit': { th: { title: 'Exercise Fit — KDKAMATO LAB', description: "เลือกท่า แล้วกรอกข้อมูลที่จำเป็น เพื่อดูว่าควรลองปรับอะไรและเปรียบเทียบแบบไหน" }, en: { title: 'Exercise Fit — KDKAMATO LAB', description: 'Choose the movement first, then use only the measurements needed for that movement.' }, Component: ExerciseFitSimpleTool },
  'squat-geometry': { th: { title: "ควรลองจัดท่าสควอตแบบไหนก่อน? — KDKAMATO LAB", description: "เลือกสควอตที่ใช้อยู่ ระบบจะใช้สัดส่วนขาจัดลำดับสิ่งที่ควรลองเปรียบเทียบ โดยเปลี่ยนทีละอย่าง" }, en: { title: 'Squat Setup Trial — KDKAMATO LAB', description: 'Choose the Squat variant you use and prioritize two setup comparisons from your leg proportions, changing one thing at a time.' }, Component: SquatSetupTrialTool },
  'physique-goal': { th: { title: 'Physique Scenario — KDKAMATO LAB', description: "ลองเปลี่ยนรอบไหล่หรือเอวในแบบจำลอง เพื่อดูผลต่อสัดส่วนตัววี ใช้ทำความเข้าใจตัวเลขเท่านั้น" }, en: { title: 'Physique Scenario — KDKAMATO LAB', description: 'Explore how hypothetical shoulder or waist changes affect the V-ratio without treating the result as a prescription.' }, Component: PhysiqueScenarioExploreTool },
  'v-taper': { th: { title: "สัดส่วนไหล่ต่อเอวของคุณเป็นเท่าไร? — KDKAMATO LAB", description: "คำนวณอัตราส่วนรอบไหล่ต่อเอว พร้อมอธิบายวิธีใช้และข้อจำกัดของตัวเลข" }, en: { title: 'V-Taper Snapshot — KDKAMATO LAB', description: 'Calculate shoulder-to-waist ratio and understand what it can and cannot tell you.' }, Component: VTaperTool },
  'ffmi': { th: { title: "มวลไร้ไขมันเทียบกับส่วนสูงของคุณเป็นเท่าไร? — KDKAMATO LAB", description: "คำนวณ FFMI เพื่อติดตามตัวเอง โดยผลขึ้นอยู่กับความแม่นยำของเปอร์เซ็นต์ไขมันที่กรอก" }, en: { title: 'FFMI Snapshot — KDKAMATO LAB', description: 'Calculate height-normalized fat-free mass with clear limits around body-fat estimation.' }, Component: FFMITool },
  'knee-to-wall': { th: { title: "เข่าเคลื่อนไปข้างหน้าได้แค่ไหน? — KDKAMATO LAB", description: "วัดระยะเท้าถึงผนังขณะดันเข่าแตะผนังทั้งสองข้าง เพื่อดูการเคลื่อนไหวข้อเท้าประกอบท่าสควอต" }, en: { title: 'Knee-to-Wall — KDKAMATO LAB', description: 'Measure left and right knee-to-wall distance as weight-bearing ankle-motion context for Squat.' }, Component: KneeToWallTool },
  'ape-index': { th: { title: 'แขนของคุณยาวแค่ไหนเมื่อเทียบกับส่วนสูง? — KDKAMATO LAB', description: "วัดช่วงแขนเทียบกับส่วนสูง แล้วใช้ค่าต่อในเครื่องมือเลือกท่าฝึก" }, en: { title: 'Ape Index — KDKAMATO LAB', description: 'A Quick Check for reach only; reuse the same value in Exercise Fit.' }, Component: ApeIndexSimpleTool },
  'femur-tibia': { th: { title: 'ต้นขาของคุณยาวแค่ไหนเมื่อเทียบกับหน้าแข้ง? — KDKAMATO LAB', description: "วัดสัดส่วนต้นขาเทียบกับหน้าแข้ง แล้วใช้ค่าต่อในเครื่องมือเลือกท่าฝึกหรือทดลองสควอต" }, en: { title: 'Femur:Tibia — KDKAMATO LAB', description: 'A Quick Check for leg proportions; reuse the same values in Exercise Fit or Squat Geometry.' }, Component: FemurTibiaSimpleTool }
};

export async function generateMetadata({ params }) {
  const language = await getLanguage();
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  if (!tool) return { title: 'KDKAMATO LAB' };
  const localized = tool[language];
  const canonical = `/lab/${toolSlug}`;
  return {
    ...localized,
    alternates: { canonical },
    openGraph: {
      title: localized.title,
      description: localized.description,
      url: canonical,
      siteName: 'KDKAMATO',
      type: 'website'
    }
  };
}

export default async function Page({ params }) {
  const language = await getLanguage();
  const { tool: toolSlug } = await params;
  const tool = tools[toolSlug];
  if (!tool) notFound();
  const Component = tool.Component;
  return <><SiteHeader language={language}/><main className="tool-page shell"><Component language={language}/></main></>;
}
