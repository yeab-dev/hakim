// Turns rows into RFC 4180 CSV. Pure, with no Next.js or React, so
// `node lib/csv.check.mjs` can test it on its own.
//
// A field is quoted when it contains a comma, a quote, a newline or leading or
// trailing spaces, and a quote inside it is doubled. "Fever, and a cough"
// stays one column, and 'says "urgent"' survives the round trip. The output
// starts with a byte-order mark so Excel reads Amharic names as UTF-8, and
// lines end in CRLF as the RFC asks.

const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

export function csvField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// columns: [{ header, value: (row) => any }]
export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvField(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvField(c.value(row))).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
