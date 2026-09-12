import { ProcessingOverlay } from "@/components/processing-overlay";

export default function Loading() {
  return (
    <ProcessingOverlay
      title="กำลังเปิดหน้า..."
      detail="กำลังเตรียมข้อมูลให้พร้อม ใช้เวลาเพียงครู่เดียว"
    />
  );
}
