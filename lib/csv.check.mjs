import assert from "node:assert/strict";
import { csvField, toCsv } from "./csv.js";

assert.equal(csvField("plain"), "plain");
assert.equal(csvField("Fever, and a cough"), '"Fever, and a cough"');
assert.equal(csvField('says "urgent"'), '"says ""urgent"""');
assert.equal(csvField("line one\nline two"), '"line one\nline two"');
assert.equal(csvField(" padded"), '" padded"');
assert.equal(csvField(null), "");
assert.equal(csvField(0), "0");

const csv = toCsv(
  [
    { header: "Reason", value: (r) => r.reason },
    { header: "Fee (ETB)", value: (r) => r.fee },
  ],
  [{ reason: 'Fever, "since Monday"\nand a rash', fee: 450 }],
);
assert.equal(csv, '﻿Reason,Fee (ETB)\r\n"Fever, ""since Monday""\nand a rash",450\r\n');

console.log("csv: all checks passed");
