const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

export function csvField(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvField(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvField(c.value(row))).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
