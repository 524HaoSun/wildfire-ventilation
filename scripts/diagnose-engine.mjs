import fs from "node:fs";

const nyc = JSON.parse(fs.readFileSync(new URL("../client/src/data/nyc_wildfire_june2023.json", import.meta.url)));
const mean = (values) => values.filter((v) => v !== null).reduce((a, b) => a + b, 0) / values.filter((v) => v !== null).length;

const windows = [
  ["01–05 Jun", 0, 120],
  ["02–05 Jun", 24, 120],
  ["03–05 Jun", 48, 120],
  ["04–05 Jun", 72, 120],
  ["05 Jun", 96, 120],
];

console.log("Background diagnostics");
for (const [label, start, end] of windows) {
  const value = mean(nyc.pm25.slice(start, end));
  console.log(label, value.toFixed(4), "ratio", (410.1 / value).toFixed(2));
}

console.log("CO background windows");
for (const [label, start, end] of windows) {
  console.log(label, mean(nyc.co.slice(start, end)).toFixed(4));
}

const preEvent = nyc.pm25.slice(0, 120).filter((v) => v !== null);
const sorted = [...preEvent].sort((a, b) => a - b);
console.log("Pre-event median", ((sorted[59] + sorted[60]) / 2).toFixed(4));
for (const width of [24, 48, 72, 96]) {
  let closest = { start: 0, value: Infinity, delta: Infinity };
  for (let start = 0; start + width <= 120; start += 1) {
    const value = mean(nyc.pm25.slice(start, start + width));
    const delta = Math.abs(value - 9.1);
    if (delta < closest.delta) closest = { start, value, delta };
  }
  console.log(`Closest ${width}h mean`, closest.start, closest.value.toFixed(4));
}
