-- Run reaction increments with the caller's privileges, not SECURITY DEFINER.
-- The existing reaction-only update policy and guard trigger restrict the update
-- to exactly one counter increment per call.
create or replace function public.react_to_success_story(p_story_id uuid, p_reaction_type text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $fn$
begin
  if p_reaction_type is null or p_reaction_type not in
    ('like','dislike','love','loveit','congratulation','wow','sad','hundred') then
    raise exception 'Invalid reaction type';
  end if;

  update public.success_stories
    set like_count = like_count + case when p_reaction_type='like' then 1 else 0 end,
        dislike_count = dislike_count + case when p_reaction_type='dislike' then 1 else 0 end,
        love_count = love_count + case when p_reaction_type='love' then 1 else 0 end,
        loveit_count = loveit_count + case when p_reaction_type='loveit' then 1 else 0 end,
        congratulation_count = congratulation_count + case when p_reaction_type='congratulation' then 1 else 0 end,
        wow_count = wow_count + case when p_reaction_type='wow' then 1 else 0 end,
        sad_count = sad_count + case when p_reaction_type='sad' then 1 else 0 end,
        hundred_count = hundred_count + case when p_reaction_type='hundred' then 1 else 0 end
    where id = p_story_id;

  return found;
end;
$fn$;

revoke all on function public.react_to_success_story(uuid,text) from public;
grant execute on function public.react_to_success_story(uuid,text) to anon, authenticated;
