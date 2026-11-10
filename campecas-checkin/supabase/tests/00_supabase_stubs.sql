-- Emulação mínima do ambiente Supabase (roles, auth, storage) para testar as
-- migrations num PostgreSQL comum. NÃO aplicar em produção.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema storage;
create schema extensions;
grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

create table auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud varchar(255),
  role varchar(255),
  email text,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  confirmation_token varchar(255),
  recovery_token varchar(255),
  email_change_token_new varchar(255),
  email_change varchar(255),
  banned_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  unique (provider_id, provider)
);

create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now(),
  unique (bucket_id, name)
);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
