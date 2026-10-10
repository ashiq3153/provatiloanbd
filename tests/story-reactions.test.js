import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeStoryReaction,
  getStoryReactionColumn,
} from "../api/story-reactions.js";

test("accepts only explicitly allowed success-story reaction names", () => {
  for (const reaction of [
    "like", "dislike", "love", "loveit",
    "congratulation", "wow", "sad", "hundred",
  ]) {
    assert.equal(normalizeStoryReaction(reaction), reaction);
    assert.ok(getStoryReactionColumn(reaction).endsWith("_count"));
  }
});

test("normalizes case and whitespace for supported reactions", () => {
  assert.equal(normalizeStoryReaction("  LOVE "), "love");
  assert.equal(getStoryReactionColumn(" WoW "), "wow_count");
});

test("rejects arbitrary columns, SQL fragments, objects and empty values", () => {
  for (const value of [
    "created_at", "name", "like_count", "like; update success_stories",
    "__proto__", "", "   ", null, undefined, 1, {},
  ]) {
    assert.equal(normalizeStoryReaction(value), null);
    assert.equal(getStoryReactionColumn(value), null);
  }
});
