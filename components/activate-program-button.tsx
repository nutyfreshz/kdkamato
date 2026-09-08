"use client";

import { useFormStatus } from "react-dom";
import { activateFreeProgram } from "@/app/program/actions";
import { ProcessingOverlay } from "@/components/processing-overlay";

function SubmitState() {
  const { pending } = useFormStatus();
  return (
    <>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Activating..." : "Activate This Program"}
      </button>
      {pending && <ProcessingOverlay title="กำลัง Activate Program..." detail="กำลังตรวจ fingerprint และบันทึก Program version กรุณารอสักครู่" />}
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
