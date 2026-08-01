import assert from "node:assert/strict";
import test from "node:test";
import { parseRepository } from "../../src/cli/repository.js";

test("parses GitHub shorthand", () => {
  assert.deepEqual(parseRepository("acme/api"), {
    fullName: "acme/api",
    url: "https://github.com/acme/api.git",
    defaultName: "api",
  });
});

test("parses GitHub URLs", () => {
  assert.deepEqual(parseRepository("https://github.com/acme/api.git"), {
    fullName: "acme/api",
    url: "https://github.com/acme/api.git",
    defaultName: "api",
  });
});

test("keeps direct Git URLs", () => {
  assert.deepEqual(parseRepository("https://git.example.com/team/api.git"), {
    fullName: null,
    url: "https://git.example.com/team/api.git",
    defaultName: "api",
  });
});

test("rejects ambiguous repository names", () => {
  assert.throws(() => parseRepository("api"), /Repository must be/);
});
