"use client";

import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";

// Bookings per day, one bar per day of the week. A client component for two
// reasons, both real: it measures its own width (an SVG drawn in pixels has to
// know how wide its box is, or its text scales down to nothing on a phone),
// and it holds one piece of state, which doctor is shown.
//
// Hand-rolled SVG, not a chart library: one series of seven bars is about
// 3 kB of our own code, where Recharts would add ~100 kB of compressed
// JavaScript to a page that the budget in PERF.md already finds too heavy.
//
// Honest by construction: the axis starts at zero, every bar carries its
// value as text above it (the chart reads the same in greyscale), the heading
// above names the range and the unit, the box has a fixed height so nothing
// moves when it draws, and the same numbers are in a table under it.

const HEIGHT = 240;
const PAD = { top: 24, right: 8, bottom: 40, left: 36 };
const BAR_MAX = 24; // thin bars; the rest of each day's band is air

// 0, 1, 2 … up to a round top above the largest value: never fewer than four
// steps, so a quiet week does not look like a busy one.
function ticksFor(max) {
  const top = Math.max(4, max);
  const step = Math.max(1, Math.ceil(top / 5));
  const ticks = [];
  for (let t = 0; t <= Math.ceil(top / step) * step; t += step) ticks.push(t);
  return ticks;
}

// A bar with a 4 px rounded top and a square foot on the baseline.
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function useWidth(ref) {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect(); // stop watching when the chart goes away
  }, [ref]);
  return width;
}

function WeekChart({ days, doctors }) {
  const [shown, setShown] = useState("all");
  const box = useRef(null);
  const measured = useWidth(box);
  const width = measured ?? 640; // before the first measure: a viewBox that scales
  const descId = useId();

  const values = days.map((d) => (shown === "all" ? d.total : (d.counts[shown] ?? 0)));
  const ticks = ticksFor(Math.max(...values));
  const top = ticks[ticks.length - 1];
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / days.length;
  const barW = Math.min(BAR_MAX, band * 0.6);
  const y = (v) => PAD.top + plotH - (v / top) * plotH;
  const who = shown === "all" ? "all doctors" : doctors.find((d) => d.id === shown)?.name;
  const total = values.reduce((sum, v) => sum + v, 0);

  return (
    <figure className="chart">
      {doctors.length > 1 && (
        <div className="chart__filters" role="group" aria-label="Show bookings for">
          {[{ id: "all", name: "All doctors" }, ...doctors].map((d) => (
            <button
              key={d.id}
              type="button"
              className="chip chip--toggle"
              aria-pressed={shown === d.id}
              onClick={() => setShown(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      <div className="chart__plot" ref={box}>
        <svg
          width={measured ?? "100%"}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-labelledby={descId}
        >
          {/* Hairline grid and the y axis: whole numbers of bookings, from 0. */}
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart__grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart__tick" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const v = values[i];
            const cx = PAD.left + band * i + band / 2;
            return (
              <g key={d.date}>
                {v > 0 && (
                  <path className="chart__bar" d={barPath(cx - barW / 2, y(v), barW, y(0) - y(v))}>
                    <title>{`${d.label}: ${v} ${v === 1 ? "booking" : "bookings"}`}</title>
                  </path>
                )}
                {/* The value, as text, on every bar: no colour needed to read it. */}
                <text className="chart__value" x={cx} y={y(v) - 6} textAnchor="middle">
                  {v}
                </text>
                <text className="chart__label" x={cx} y={HEIGHT - PAD.bottom + 18} textAnchor="middle">
                  {d.label.split(" ")[0]}
                </text>
                <text className="chart__label chart__label--sub" x={cx} y={HEIGHT - PAD.bottom + 34} textAnchor="middle">
                  {d.isToday ? "today" : d.label.split(" ").slice(1).join(" ")}
                </text>
              </g>
            );
          })}
          <line className="chart__axis" x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} />
        </svg>
      </div>

      <figcaption id={descId} className="chart__caption">
        Showing {who}: {total} {total === 1 ? "booking" : "bookings"} this week. Each bar is one day; the number above
        it is that day&apos;s bookings. The same numbers, for every doctor, are in the table below.
      </figcaption>
    </figure>
  );
}

WeekChart.propTypes = {
  days: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      isToday: PropTypes.bool.isRequired,
      counts: PropTypes.objectOf(PropTypes.number).isRequired,
      total: PropTypes.number.isRequired,
    }),
  ).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }))
    .isRequired,
};

export default WeekChart;
