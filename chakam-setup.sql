-- chakam + visitor log for through my big eyes
-- Paste all of this into Supabase → SQL Editor → New query, change the passcode on the last line, and press Run.

-- ---------- friends' photos ----------
create table if not exists public.photos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 40),
  note text check (note is null or char_length(note) <= 120),
  path text not null unique check (path ~ '^guests/[a-z0-9-]+\.jpg$'),
  w int check (w between 1 and 4000),
  h int check (h between 1 and 4000),
  visitor text check (visitor is null or char_length(visitor) <= 40),
  hidden boolean not null default false
);
alter table public.photos enable row level security;
drop policy if exists "anyone can see the wall" on public.photos;
create policy "anyone can see the wall" on public.photos for select to anon, authenticated using (hidden = false);
drop policy if exists "anyone can add a photo" on public.photos;
create policy "anyone can add a photo" on public.photos for insert to anon, authenticated with check (hidden = false);
-- visitors can see who posted and when, but not the private visitor id
revoke select on public.photos from anon, authenticated;
grant select (id, created_at, name, note, path, w, h, hidden) on public.photos to anon, authenticated;
grant insert (name, note, path, w, h, visitor) on public.photos to anon, authenticated;

-- ---------- visitor log (private: only readable with the passcode) ----------
create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor text not null check (char_length(visitor) <= 40),
  name text check (name is null or char_length(name) <= 40),
  page text check (char_length(page) <= 40),
  referrer text check (referrer is null or char_length(referrer) <= 120),
  device text check (device in ('phone', 'computer'))
);
alter table public.visits enable row level security;
drop policy if exists "anyone can log a visit" on public.visits;
create policy "anyone can log a visit" on public.visits for insert to anon, authenticated with check (true);
revoke all on public.visits from anon, authenticated;
grant insert (visitor, name, page, referrer, device) on public.visits to anon, authenticated;

-- ---------- the photos themselves ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chakam', 'chakam', true, 3145728, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg'];
drop policy if exists "anyone can upload to chakam" on storage.objects;
create policy "anyone can upload to chakam" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'chakam' and name ~ '^guests/[a-z0-9-]+\.jpg$');
drop policy if exists "anyone can see chakam" on storage.objects;
create policy "anyone can see chakam" on storage.objects for select to anon, authenticated using (bucket_id = 'chakam');

-- ---------- owner tools (visitors.html), locked with a passcode ----------
create table if not exists public.owner (pass_hash text not null);
alter table public.owner enable row level security;
revoke all on public.owner from anon, authenticated;

create or replace function public.owner_ok(pass text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.owner where pass_hash = crypt(pass, pass_hash));
$$;
revoke all on function public.owner_ok(text) from public, anon, authenticated;

create or replace function public.owner_visits(pass text) returns setof public.visits
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.owner_ok(pass) then raise exception 'wrong passcode' using errcode = '28P01'; end if;
  return query select * from public.visits order by created_at desc limit 5000;
end $$;

create or replace function public.owner_photos(pass text) returns setof public.photos
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  if not public.owner_ok(pass) then raise exception 'wrong passcode' using errcode = '28P01'; end if;
  return query select * from public.photos order by created_at desc;
end $$;

create or replace function public.owner_hide(pass text, photo_id bigint, hide boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.owner_ok(pass) then raise exception 'wrong passcode' using errcode = '28P01'; end if;
  update public.photos set hidden = hide where id = photo_id;
end $$;

revoke all on function public.owner_visits(text), public.owner_photos(text), public.owner_hide(text, bigint, boolean) from public;
grant execute on function public.owner_visits(text), public.owner_photos(text), public.owner_hide(text, bigint, boolean) to anon, authenticated;

-- Your passcode for visitors.html. Change it to something long only you know, then Run.
-- Change it in Supabase only; never save your real passcode in this file.
-- (Running this again later with a new passcode replaces the old one.)
delete from public.owner;
insert into public.owner (pass_hash) values (extensions.crypt('CHANGE-THIS-PASSCODE', extensions.gen_salt('bf')));
