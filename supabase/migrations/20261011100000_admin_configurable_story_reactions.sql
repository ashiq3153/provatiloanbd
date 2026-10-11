-- Admin-configurable reaction emoji and display counts for success stories.
-- This migration is intentionally committed to a feature branch only; it is not applied to production.
alter table public.success_stories
  add column if not exists custom_reactions jsonb not null default
    '[{"emoji":"👍","label":"Like","count":0},{"emoji":"👎","label":"Dislike","count":0},{"emoji":"❤️","label":"Love","count":0},{"emoji":"🎉","label":"Congratulations","count":0},{"emoji":"😮","label":"Wow","count":0},{"emoji":"😢","label":"Sad","count":0},{"emoji":"🔥","label":"Fire","count":0}]'::jsonb;

alter table public.success_stories
  drop constraint if exists success_stories_custom_reactions_array_check;
alter table public.success_stories
  add constraint success_stories_custom_reactions_array_check
  check (jsonb_typeof(custom_reactions) = 'array');

comment on column public.success_stories.custom_reactions is
  'Admin-configured emoji/count display entries. Counts are configured display values, not verified unique member votes.';
