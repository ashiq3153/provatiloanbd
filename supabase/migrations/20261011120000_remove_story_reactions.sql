-- Remove success-story reactions from the application schema.
-- This intentionally removes reaction counters and reaction RPCs; story content remains intact.
do $$
declare
  trigger_row record;
begin
  for trigger_row in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'success_stories'
      and not t.tgisinternal
      and t.tgname ilike '%reaction%'
  loop
    execute format('drop trigger if exists %I on public.success_stories', trigger_row.tgname);
  end loop;
end $$;

drop policy if exists success_stories_reaction_update on public.success_stories;
drop function if exists public.react_to_success_story(uuid, text);
drop function if exists public.react_to_success_story_once(uuid, bigint, text);
drop table if exists public.success_story_reactions;

alter table if exists public.success_stories
  drop column if exists like_count,
  drop column if exists dislike_count,
  drop column if exists love_count,
  drop column if exists loveit_count,
  drop column if exists congratulation_count,
  drop column if exists wow_count,
  drop column if exists sad_count,
  drop column if exists hundred_count,
  drop column if exists custom_reactions;
