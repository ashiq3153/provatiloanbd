import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStorageReference, splitStorageReference } from "../api/loan-documents.js";

const projectUrl = "https://example-project.supabase.co";
const chatId = 12345;
const objectPath = "12345/1729000000000_nid_front.png";

test("normalizes an owner path and strips legacy signed URL tokens", () => {
  assert.equal(
    normalizeStorageReference(objectPath, chatId, projectUrl),
    "loan_documents/" + objectPath,
  );
  assert.equal(
    normalizeStorageReference("loan_documents/" + objectPath, chatId, projectUrl),
    "loan_documents/" + objectPath,
  );
  const signed = projectUrl + "/storage/v1/object/sign/loan_documents/" + objectPath + "?token=secret-token";
  assert.equal(
    normalizeStorageReference(signed, chatId, projectUrl),
    "loan_documents/" + objectPath,
  );
});

test("normalizes a legacy public URL for the configured Supabase project", () => {
  const url = projectUrl + "/storage/v1/object/public/loan_documents/" + objectPath;
  assert.equal(normalizeStorageReference(url, chatId, projectUrl), "loan_documents/" + objectPath);
});

test("supports the separate private deposit screenshot bucket when explicitly allowed", () => {
  const path = "12345/1729000000000_deposit.png";
  const url = projectUrl + "/storage/v1/object/sign/deposit_screenshots/" + path + "?token=old";
  const normalized = normalizeStorageReference(url, chatId, projectUrl, {
    allowedBuckets: ["loan_documents", "deposit_screenshots"],
    defaultBucket: "loan_documents",
  });
  assert.equal(normalized, "deposit_screenshots/" + path);
  assert.deepEqual(splitStorageReference(normalized), {
    bucket: "deposit_screenshots",
    path,
  });
});

test("rejects a signed URL from another Supabase project or an unrelated host", () => {
  assert.throws(
    () => normalizeStorageReference("https://attacker.example/storage/v1/object/sign/loan_documents/" + objectPath, chatId, projectUrl),
    /origin does not match/,
  );
});

test("rejects references belonging to a different Telegram user", () => {
  assert.throws(
    () => normalizeStorageReference("99999/private.png", chatId, projectUrl),
    /does not belong/,
  );
});

test("rejects traversal, empty segments, encoded separators and malformed file paths", () => {
  for (const path of [
    "12345/../99999/private.png",
    "12345//private.png",
    "12345/%2e%2e/private.png",
    "12345/a\\b.png",
    "12345/private file.png",
  ]) {
    assert.throws(() => normalizeStorageReference(path, chatId, projectUrl));
  }
});

test("rejects an unapproved bucket for the selected column", () => {
  const screenshot = projectUrl + "/storage/v1/object/sign/deposit_screenshots/" + objectPath;
  assert.throws(
    () => normalizeStorageReference(screenshot, chatId, projectUrl, {
      allowedBuckets: ["loan_documents"],
      defaultBucket: "loan_documents",
    }),
    /bucket is not allowed/,
  );
});

test("rejects URLs that are not an allowed Supabase Storage object URL", () => {
  assert.throws(
    () => normalizeStorageReference(projectUrl + "/storage/v1/object/upload/loan_documents/" + objectPath, chatId, projectUrl),
    /Unsupported Supabase Storage URL/,
  );
  assert.throws(() => splitStorageReference("unknown_bucket/12345/file.pdf"), /Unsupported storage bucket/);
});
