// What the list looks like while it loads: the same shapes, no content.
function ClinicListSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <p className="count">Looking for clinics with free time this week…</p>
      <ul className="cards" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="card card--skeleton" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClinicListSkeleton;
