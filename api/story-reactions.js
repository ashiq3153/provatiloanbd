const REACTION_COLUMNS = Object.freeze({
  like: "like_count",
  dislike: "dislike_count",
  love: "love_count",
  loveit: "loveit_count",
  congratulation: "congratulation_count",
  wow: "wow_count",
  sad: "sad_count",
  hundred: "hundred_count",
});

export function normalizeStoryReaction(value) {
  if (typeof value !== "string") return null;
  const reaction = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(REACTION_COLUMNS, reaction)
    ? reaction
    : null;
}

export function getStoryReactionColumn(value) {
  const reaction = normalizeStoryReaction(value);
  return reaction ? REACTION_COLUMNS[reaction] : null;
}
