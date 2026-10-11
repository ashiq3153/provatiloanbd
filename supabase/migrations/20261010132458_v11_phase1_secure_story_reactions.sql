-- Keep story reactions callable through one narrow RPC while denying direct table updates.
-- The BEFORE UPDATE guard trigger enforces that non-service callers can change
-- exactly one reaction counter by +1 and cannot change story content or overwrite counts.
create or replace function public.react_to_success_story(p_story_id uuid, p_reaction_type text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p_reaction_type is null or p_reaction_type not in
    ('like','dislike','love','loveit','congratulation','wow','sad','hundred') then
    raise exception 'Invalid reaction type';
  end if;

  update public.success_stories
    set like_count = greatest(coalesce(like_count, 0), 0) + case when p_reaction_type='like' then 1 else 0 end,
        dislike_count = greatest(coalesce(dislike_count, 0), 0) + case when p_reaction_type='dislike' then 1 else 0 end,
        love_count = greatest(coalesce(love_count, 0), 0) + case when p_reaction_type='love' then 1 else 0 end,
        loveit_count = greatest(coalesce(loveit_count, 0), 0) + case when p_reaction_type='loveit' then 1 else 0 end,
        congratulation_count = greatest(coalesce(congratulation_count, 0), 0) + case when p_reaction_type='congratulation' then 1 else 0 end,
        wow_count = greatest(coalesce(wow_count, 0), 0) + case when p_reaction_type='wow' then 1 else 0 end,
        sad_count = greatest(coalesce(sad_count, 0), 0) + case when p_reaction_type='sad' then 1 else 0 end,
        hundred_count = greatest(coalesce(hundred_count, 0), 0) + case when p_reaction_type='hundred' then 1 else 0 end
    where id = p_story_id;

  return found;
end;
$fn$;

-- Do not grant direct UPDATE or keep a broad update policy for browser roles.
drop policy if exists success_stories_reaction_update on public.success_stories;
revoke update on table public.success_stories from anon, authenticated;
revoke all on function public.react_to_success_story(uuid,text) from public;
grant execute on function public.react_to_success_story(uuid,text) to anon, authenticated;
