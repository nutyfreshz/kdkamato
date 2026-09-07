import { activateFreeProgram } from "@/app/program/actions";

export function ActivateProgramButton() {
  return (
    <form action={activateFreeProgram}>
      <button className="btn primary" type="submit">Activate This Program</button>
    </form>
  );
}
