import test from "node:test";
import assert from "node:assert/strict";
import { validateDemoRequest } from "./form-validation.js";

test("accepts a complete demo request", () => {
  const result = validateDemoRequest({
    name: "Asha Mehta",
    email: "asha@example.com",
    company: "Northstar Growth",
    role: "Agency",
    goal: "Understand which gift audiences convert."
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test("rejects missing and malformed required fields", () => {
  const result = validateDemoRequest({ name: "", email: "not-an-email", company: "", role: "" });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors), ["name", "email", "company", "role"]);
});

test("rejects honeypot submissions", () => {
  const result = validateDemoRequest({
    name: "Asha Mehta",
    email: "asha@example.com",
    company: "Northstar Growth",
    role: "Agency",
    website: "https://spam.example"
  });
  assert.equal(result.valid, false);
  assert.equal(result.errors.website, "Unable to process this request.");
});
