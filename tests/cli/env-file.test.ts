import assert from "node:assert/strict";
import test from "node:test";
import { parseEnvFileText } from "../../src/cli/env-file.js";

test("parses dotenv values without losing quoted whitespace", () => {
  assert.deepEqual(
    parseEnvFileText(
      `# comment\nPORT=3000\nexport API_URL=https://api.example.test # local\nMESSAGE="hello world\\nnext"\nEMPTY=\n`,
    ),
    [
      { key: "PORT", value: "3000" },
      { key: "API_URL", value: "https://api.example.test" },
      { key: "MESSAGE", value: "hello world\nnext" },
      { key: "EMPTY", value: "" },
    ],
  );
});

test("rejects malformed dotenv assignments", () => {
  assert.throws(() => parseEnvFileText("not-an-assignment"), /line 1/);
  assert.throws(
    () => parseEnvFileText("123INVALID=value"),
    /valid variable name/,
  );
});
