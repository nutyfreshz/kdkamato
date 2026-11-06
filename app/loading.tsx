import { ProcessingOverlay } from "@/components/processing-overlay";

export default function Loading() {
  return (
    <ProcessingOverlay
      title={"กำลังเปิดหน้า…"}
      detail={"กำลังเตรียมข้อมูล กรุณารอสักครู่"}
    />
  );
}
