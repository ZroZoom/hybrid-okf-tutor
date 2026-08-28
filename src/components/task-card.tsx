type TaskCardProps = {
  isUnreviewed: boolean;
};

export function TaskCard({ isUnreviewed }: TaskCardProps) {
  return (
    <section className="task-card" aria-labelledby="task-heading">
      <div className="card-heading-row">
        <p className="eyebrow">Zadanie pokazowe</p>
        {isUnreviewed ? <span className="review-badge">DEV/UNREVIEWED</span> : null}
      </div>
      <h2 id="task-heading">Pole trapezu</h2>
      <p className="task-copy">
        Trapez ma podstawy długości 6 cm i 10 cm oraz wysokość 4 cm. Oblicz jego
        pole.
      </p>

      <svg
        className="trapezoid-figure"
        viewBox="0 0 360 190"
        role="img"
        aria-label="Trapez z podstawami 6 cm i 10 cm oraz wysokością 4 cm"
      >
        <path className="shape-fill" d="M72 148 L128 42 H258 L316 148 Z" />
        <path className="shape-line" d="M72 148 L128 42 H258 L316 148 Z" />
        <path className="height-line" d="M128 42 V148" />
        <path className="right-angle" d="M128 136 H140 V148" />
        <text x="193" y="29" textAnchor="middle">
          6 cm
        </text>
        <text x="194" y="174" textAnchor="middle">
          10 cm
        </text>
        <text x="116" y="101" textAnchor="end">
          4 cm
        </text>
      </svg>
    </section>
  );
}
