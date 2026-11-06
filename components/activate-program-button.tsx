"use client";

import { useFormStatus } from "react-dom";
import { activateFreeProgram } from "@/app/program/actions";
import { ProcessingOverlay } from "@/components/processing-overlay";

function SubmitState() {
  const { pending } = useFormStatus();
  return (
    <>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "กำลังเปิดใช้…" : "เปิดใช้ โปรแกรม นี้"}
      </button>
      {pending && <ProcessingOverlay title={"กำลังเปิดใช้ โปรแกรม…"} detail={"กำลังตรวจสอบและบันทึกเวอร์ชันโปรแกรม กรุณารอสักครู่"} />}
    </>
  );
}

export function ActivateProgramButton({ fingerprint }: { fingerprint: string }) {
  return (
    <form action={activateFreeProgram}>
      <input type="hidden" name="expectedFingerprint" value={fingerprint} />
      <SubmitState />
    </form>
  );
}
