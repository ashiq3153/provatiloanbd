-- Commit to the matching version recorded by the connected Preview Supabase project.
create or replace function public.apply_global_loan_config(
  p_value jsonb,
  p_created_by_chat_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_category text;
  v_rate_key text;
  v_rate numeric;
  v_max_amount numeric;
  v_min_tenure numeric;
  v_max_tenure numeric;
  v_enabled jsonb;
  v_tier_key text;
  v_tier numeric;
  v_now timestamptz := now();
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then
    raise exception 'Loan configuration must be a JSON object';
  end if;
  if jsonb_typeof(p_value -> 'feeTiers') <> 'object' then
    raise exception 'All approved fee tiers are required';
  end if;
  foreach v_tier_key in array array[
    'processingFeeUpTo1m',
    'processingFeeAbove1m',
    'securityDepositUpTo500k',
    'securityDepositAbove500k'
  ] loop
    if jsonb_typeof(p_value -> 'feeTiers' -> v_tier_key) <> 'number' then
      raise exception 'Missing approved fee tier: %', v_tier_key;
    end if;
    v_tier := (p_value -> 'feeTiers' ->> v_tier_key)::numeric;
    if v_tier < 0 or v_tier > 1 then
      raise exception 'Approved fee tier is outside 0..1: %', v_tier_key;
    end if;
  end loop;

  if jsonb_typeof(p_value -> 'categories') <> 'object' then
    raise exception 'Approved category limits are required';
  end if;

  for v_category, v_rate_key in
    select c.category, c.rate_key
    from (values
      ('personal','minRatePersonal'),
      ('business','minRateBusiness'),
      ('expat','minRateExpat'),
      ('student','minRateStudent'),
      ('emergency','minRateEmergency'),
      ('women','minRateWomen')
    ) as c(category, rate_key)
  loop
    if jsonb_typeof(p_value -> v_rate_key) <> 'number' then
      raise exception 'Missing approved monthly rate: %', v_rate_key;
    end if;
    v_rate := (p_value ->> v_rate_key)::numeric;
    if v_rate < 0 or v_rate > 1 then
      raise exception 'Approved monthly rate is outside 0..1: %', v_rate_key;
    end if;

    if jsonb_typeof(p_value -> 'categories' -> v_category) <> 'object' then
      raise exception 'Missing approved category limits: %', v_category;
    end if;
    v_enabled := p_value -> 'categories' -> v_category -> 'enabled';
    if jsonb_typeof(v_enabled) <> 'boolean' then
      raise exception 'Missing enabled flag for category: %', v_category;
    end if;
    if jsonb_typeof(p_value -> 'categories' -> v_category -> 'maxAmount') <> 'number'
       or jsonb_typeof(p_value -> 'categories' -> v_category -> 'minTenure') <> 'number'
       or jsonb_typeof(p_value -> 'categories' -> v_category -> 'maxTenure') <> 'number' then
      raise exception 'Incomplete approved category limits: %', v_category;
    end if;
    v_max_amount := (p_value -> 'categories' -> v_category ->> 'maxAmount')::numeric;
    v_min_tenure := (p_value -> 'categories' -> v_category ->> 'minTenure')::numeric;
    v_max_tenure := (p_value -> 'categories' -> v_category ->> 'maxTenure')::numeric;
    if v_max_amount < 50000 or v_min_tenure < 1 or v_max_tenure < v_min_tenure
       or trunc(v_min_tenure) <> v_min_tenure or trunc(v_max_tenure) <> v_max_tenure then
      raise exception 'Invalid approved category limits: %', v_category;
    end if;
  end loop;

  insert into public.system_settings(key, value)
  values ('global_loan_config', p_value)
  on conflict (key) do update set value = excluded.value;

  for v_category, v_rate_key in
    select c.category, c.rate_key
    from (values
      ('personal','minRatePersonal'),
      ('business','minRateBusiness'),
      ('expat','minRateExpat'),
      ('student','minRateStudent'),
      ('emergency','minRateEmergency'),
      ('women','minRateWomen')
    ) as c(category, rate_key)
  loop
    v_rate := (p_value ->> v_rate_key)::numeric;
    update public.loan_rate_versions
      set is_active = false, effective_to = v_now
      where loan_category = v_category and is_active = true;

    insert into public.loan_rate_versions(
      loan_category, monthly_rate, calculation_method,
      effective_from, is_active, created_by_chat_id
    )
    values (v_category, v_rate, 'flat', v_now, true, p_created_by_chat_id);
  end loop;

  return true;
end;
$fn$;

revoke all on function public.apply_global_loan_config(jsonb,bigint) from public, anon, authenticated;
grant execute on function public.apply_global_loan_config(jsonb,bigint) to service_role;
