// The shared frame of every Open Graph card (1200 × 630). ImageResponse
// supports flexbox and a subset of CSS only, so this is plain nested divs with
// inline styles. Used by app/opengraph-image.js and the per-clinic one.
export const OG_SIZE = { width: 1200, height: 630 };

const TEAL = "#0f766e";

export function OgFrame({ eyebrow, title, lines, footer }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f6f8f7",
        color: "#0f172a",
        borderTop: `18px solid ${TEAL}`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 32, color: TEAL, fontWeight: 700, letterSpacing: 1 }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: title.length > 28 ? 68 : 84, fontWeight: 700, lineHeight: 1.1, marginTop: 20 }}>
          {title}
        </div>
        {lines.map((line) => (
          <div key={line} style={{ display: "flex", fontSize: 36, color: "#334155", marginTop: 18 }}>
            {line}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 30, color: "#475569" }}>
        <div style={{ display: "flex" }}>{footer}</div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: TEAL }}>Hakim</div>
      </div>
    </div>
  );
}
