"use client";

import styles from "./program-app.module.css";

export function ProcessingOverlay({
  title = "กำลังประมวลผล...",
  detail = "กรุณารอสักครู่ ระบบกำลังบันทึกและอัปเดตข้อมูล",
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className={styles.processingOverlay} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.processingCard}>
        <span className={styles.processingSpinner} aria-hidden="true" />
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
