create table public.account_preferences (
user_id uuid primary key references auth.users(id) on delete cascade,
avatar text not null default '' check(length(avatar)<=180000 and (avatar='' or avatar ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
mode text not null default 'dark' check(mode in ('dark','light','system')),
font_size integer not null default 16 check(font_size between 14 and 20),
density text not null default 'comfortable' check(density in ('comfortable','compact')),
reduce_motion boolean not null default false
);
alter table public.account_preferences enable row level security;
revoke all on public.account_preferences from public,anon,authenticated;
grant select,insert,update on public.account_preferences to authenticated;
create policy own_preferences_read on public.account_preferences for select to authenticated using(user_id=(select auth.uid()) and private.current_role() is not null);
create policy own_preferences_insert on public.account_preferences for insert to authenticated with check(user_id=(select auth.uid()) and private.current_role() is not null);
create policy own_preferences_update on public.account_preferences for update to authenticated using(user_id=(select auth.uid()) and private.current_role() is not null) with check(user_id=(select auth.uid()) and private.current_role() is not null);
