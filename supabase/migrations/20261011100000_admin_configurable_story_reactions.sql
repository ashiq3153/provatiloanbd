-- Configurable success-story emoji counts and one reaction per Telegram user per story.
alter table public.success_stories
  add column if not exists custom_reactions jsonb not null default
    '[{"emoji":"👍","label":"Like","count":0,"genuine_count":0},{"emoji":"👎","label":"Dislike","count":0,"genuine_count":0},{"emoji":"❤️","label":"Love","count":0,"genuine_count":0},{"emoji":"🎉","label":"Congratulations","count":0,"genuine_count":0},{"emoji":"😮","label":"Wow","count":0,"genuine_count":0},{"emoji":"😢","label":"Sad","count":0,"genuine_count":0},{"emoji":"🔥","label":"Fire","count":0,"genuine_count":0}]'::jsonb;

alter table public.success_stories
  drop constraint if exists success_stories_custom_reactions_array_check;
alter table public.success_stories
  add constraint success_stories_custom_reactions_array_check
  check (jsonb_typeof(custom_reactions) = 'array');

create table if not exists public.success_story_reactions (
  id bigint generated always as identity primary key,
  story_id uuid not null references public.success_stories(id) on delete cascade,
  chat_id bigint not null,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (story_id, chat_id)
);

alter table public.success_story_reactions enable row level security;
revoke all on public.success_story_reactions from anon, authenticated;
grant all on public.success_story_reactions to service_role;

create or replace function public.react_to_success_story_once(
  p_story_id uuid, p_chat_id bigint, p_emoji text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_reactions jsonb;
  v_item jsonb;
  v_found boolean := false;
  v_new jsonb := '[]'::jsonb;
begin
  if p_chat_id is null or p_chat_id <= 0 or p_emoji is null
     or char_length(btrim(p_emoji)) < 1 or char_length(p_emoji) > 16 then
    raise exception 'Invalid reaction';
  end if;

  insert into public.success_story_reactions(story_id, chat_id, emoji)
  values (p_story_id, p_chat_id, btrim(p_emoji));

  select custom_reactions into v_reactions
  from public.success_stories where id = p_story_id for update;
  if not found then
    delete from public.success_story_reactions where story_id = p_story_id and chat_id = p_chat_id;
    raise exception 'Story not found';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(v_reactions, '[]'::jsonb))
  loop
    if v_item->>'emoji' = btrim(p_emoji) then
      v_item := jsonb_set(v_item, '{genuine_count}',
        to_jsonb(coalesce((v_item->>'genuine_count')::integer, 0) + 1), true);
      v_found := true;
    end if;
    v_new := v_new || jsonb_build_array(v_item);
  end loop;

  if not v_found then
    v_new := v_new || jsonb_build_array(jsonb_build_object(
      'emoji', btrim(p_emoji), 'label', btrim(p_emoji), 'count', 0, 'genuine_count', 1
    ));
  end if;

  update public.success_stories set custom_reactions = v_new where id = p_story_id;
  return true;
exception
  when unique_violation then
    raise exception 'You have already reacted to this story' using errcode = '23505';
end;
$$;

revoke all on function public.react_to_success_story_once(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.react_to_success_story_once(uuid, bigint, text) to service_role;

comment on column public.success_stories.custom_reactions is
  'Admin configured display count in count; verified Telegram-member reactions in genuine_count.';
