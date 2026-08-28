type Trace = {
  intent: string;
  conceptName: string | null;
  atomType: string | null;
  ruleName: string;
};

type TracePanelProps = {
  trace: Trace | null;
  isUnreviewed: boolean;
};

export function TracePanel({ trace, isUnreviewed }: TracePanelProps) {
  if (!trace) return null;

  return (
    <aside className="trace-panel" aria-labelledby="trace-heading">
      <p className="eyebrow" id="trace-heading">
        Jak powstała pomoc
      </p>
      <div className="trace-list">
        <p>{`Luna: ${trace.intent} · trapez`}</p>
        <p>
          {`OKF: trapez · ${trace.atomType ?? "brak"}${isUnreviewed ? " · DEV/UNREVIEWED" : ""}`}
        </p>
        <p>{`Reguła deterministyczna: ${trace.ruleName}`}</p>
      </div>
    </aside>
  );
}
