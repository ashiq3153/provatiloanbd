import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUserPrivateDocumentReference,
  normalizeUserPrivateDocumentMap,
} from "../api/private-documents.js";

const projectUrl = "https://fjbkwjcjsbemoxkjackh.supabase.co";

test("private document normalizer stores an owner-scoped path unchanged", () => {
  assert.equal(
    normalizeUserPrivateDocumentReference("12345/nid_scan.pdf", 12345, projectUrl),
    "12345/nid_scan.pdf",
  );
});

test("private document normalizer converts a legacy signed URL to a path", () => {
  const legacyUrl = "https://fjbkwjcjsbemoxkjackh.supabase.co/storage/v1/object/sign/loan_documents/12345/nid_scan.pdf?token=temporary";
  assert.equal(
    normalizeUserPrivateDocumentReference(legacyUrl, 12345, projectUrl),
    "12345/nid_scan.pdf",
  );
});

test("private document normalizer rejects another user's path", () => {
  assert.throws(
    () => normalizeUserPrivateDocumentReference("99999/secret.pdf", 12345, projectUrl),
    /Invalid private document reference/,
  );
});

test("private document normalizer rejects external and traversal URLs", () => {
  assert.throws(
    () => normalizeUserPrivateDocumentReference("https://evil.example/secret.pdf", 12345, projectUrl),
    /External or non-private/,
  );
  assert.throws(
    () => normalizeUserPrivateDocumentReference("12345/../99999/secret.pdf", 12345, projectUrl),
    /Invalid private document reference/,
  );
});

test("document maps are normalized and empty values are omitted", () => {
  assert.deepEqual(
    normalizeUserPrivateDocumentMap({ nid: "12345/nid.pdf", photo: "", optional: null }, 12345, projectUrl),
    { nid: "12345/nid.pdf" },
  );
});
