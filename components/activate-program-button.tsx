import { activateFreeProgram } from "@/app/program/actions";

export function ActivateProgramButton({ fingerprint }: { fingerprint: string }) {
  return (
    <form action={activateFreeProgram}>
      <input type="hidden" name="expectedFingerprint" value={fingerprint} />
      <button className="btn primary" type="submit">Activate This Program</button>
    </form>
  );
}
