"use client";

import styles from "./program-app.module.css";

export function ProcessingOverlay({
  title = "กำลังประมวลผล…",
  detail = "กำลังบันทึกและอัปเดตข้อมูล กรุณารอสักครู่",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className={`${styles.processingOverlay} app-processing-overlay`} role="status" aria-live="polite" aria-busy="true">
      <div className={`${styles.processingCard} app-processing-card`}>
        <span className={`${styles.processingSpinner} app-processing-spinner`} aria-hidden="true" />
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
