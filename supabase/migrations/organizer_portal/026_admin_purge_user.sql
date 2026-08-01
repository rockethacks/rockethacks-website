-- RocketHacks Organizer Portal
-- Migration 026: Admin purge — remove profile rows AND auth.users login
-- Run in SQL Editor after 025.

create or replace function public.admin_purge_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_target_is_admin boolean;
  v_admin_count int;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  select u.email into v_email
  from auth.users u
  where u.id = p_user_id;

  if v_email is null then
    raise exception 'User not found';
  end if;

  select exists (
    select 1
    from organizer_profiles
    where user_id = p_user_id
      and role = 'admin'
  ) into v_target_is_admin;

  if v_target_is_admin then
    select count(*)::int into v_admin_count
    from organizer_profiles
    where role = 'admin';

    if v_admin_count <= 1 then
      raise exception 'Cannot remove the last admin';
    end if;
  end if;

  -- Clear NO ACTION FKs that would block auth.users delete
  update applicants set checked_in_by = null where checked_in_by = p_user_id;
  update organizer_invites set created_by = null where created_by = p_user_id;
  update judge_invites set created_by = null where created_by = p_user_id;
  update audit_log set changed_by = null where changed_by = p_user_id;

  -- Invites are keyed by email, not user_id
  delete from organizer_invites where lower(email) = lower(v_email);
  delete from judge_invites where lower(email) = lower(v_email);

  -- Cascades to applicants / organizer_profiles / judge_profiles (+ child rows)
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_purge_user(uuid) from public;
grant execute on function public.admin_purge_user(uuid) to authenticated;
