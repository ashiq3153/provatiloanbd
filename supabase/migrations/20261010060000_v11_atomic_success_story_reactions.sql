-- Atomic success-story reaction counts, callable only by the server service role.
-- This migration is prepared for review only and has NOT been applied to Supabase.
-- Reconcile the live/local migration history and validate against non-production before deployment.

begin;

create or replace function public.increment_success_story_reaction(
  p_story_id uuid,
  p_reaction_type text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  updated_count integer;
begin
  if p_reaction_type not in (
    'like', 'dislike', 'love', 'loveit',
    'congratulation', 'wow', 'sad', 'hundred'
  ) then
    raise exception 'Unsupported success-story reaction';
  end if;

  update public.success_stories
  set
    like_count = coalesce(like_count, 0) + case when p_reaction_type = 'like' then 1 else 0 end,
    dislike_count = coalesce(dislike_count, 0) + case when p_reaction_type = 'dislike' then 1 else 0 end,
    love_count = coalesce(love_count, 0) + case when p_reaction_type = 'love' then 1 else 0 end,
    loveit_count = coalesce(loveit_count, 0) + case when p_reaction_type = 'loveit' then 1 else 0 end,
    congratulation_count = coalesce(congratulation_count, 0) + case when p_reaction_type = 'congratulation' then 1 else 0 end,
    wow_count = coalesce(wow_count, 0) + case when p_reaction_type = 'wow' then 1 else 0 end,
    sad_count = coalesce(sad_count, 0) + case when p_reaction_type = 'sad' then 1 else 0 end,
    hundred_count = coalesce(hundred_count, 0) + case when p_reaction_type = 'hundred' then 1 else 0 end
  where id = p_story_id
  returning case p_reaction_type
    when 'like' then like_count
    when 'dislike' then dislike_count
    when 'love' then love_count
    when 'loveit' then loveit_count
    when 'congratulation' then congratulation_count
    when 'wow' then wow_count
    when 'sad' then sad_count
    when 'hundred' then hundred_count
  end into updated_count;

  if not found then
    raise exception 'Success story not found';
  end if;

  return updated_count;
end;
$function$;

revoke all on function public.increment_success_story_reaction(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_success_story_reaction(uuid, text) to service_role;

commit;
