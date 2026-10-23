-- PROPOSTA V2. Não executada. Não é uma migração aplicada.
-- Revisar em Supabase dedicado de homologação, gerar migração por CLI e testar antes de produção.
-- Requer auth.users e auth.uid() do Supabase.
begin;
create schema if not exists gmm;
create table gmm.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null, normalized_name text not null, country text, unique(owner_id, normalized_name),
  unique(id,owner_id)
);
create table gmm.genres (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null, unique(owner_id,name),
  unique(id,owner_id)
);
create table gmm.songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  artist_id uuid not null, title text not null, canonical_key text not null, recording_key text not null, original_year integer check(original_year between 1970 and 2009), genre_id uuid, source_url text, source_id text, validation_state text not null default 'pending', metadata jsonb not null default '{}'::jsonb, unique(owner_id,canonical_key,recording_key),
  unique(id,owner_id)
);
create table gmm.productions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  song_id uuid not null, parent_id uuid, version integer not null check(version>0), state text not null default 'selected', cancelled_at timestamptz, planned_at timestamptz, notes text, rights jsonb not null default '{}'::jsonb, approval jsonb, unique(owner_id,song_id,version),
  unique(id,owner_id)
);
create table gmm.reservations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  song_id uuid not null, production_id uuid, canonical_key text not null, state text not null check(state in ('reserved','active','cancelled')), unique(owner_id,canonical_key),
  unique(id,owner_id)
);
create table gmm.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, role text not null, version integer not null check(version>0), original_name text, filename text not null, content_type text not null, byte_size bigint check(byte_size>=0), sha256 text not null, drive_file_id text, drive_revision_id text, local_reference text, unique(owner_id,production_id,role,version),
  unique(id,owner_id)
);
create table gmm.cover_variants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, asset_id uuid not null, template_id text, config jsonb not null default '{}'::jsonb, approved_at timestamptz,
  unique(id,owner_id)
);
create table gmm.licenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, status text not null check(status in ('confirmed','library','pending','unauthorized','expired')), recording_allowed boolean, composition_allowed boolean, visual_allowed boolean, platform text, commercial_allowed boolean, valid_until date, territories text[], source_url text, evidence_asset_id uuid,
  unique(id,owner_id)
);
create table gmm.asset_licenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  asset_id uuid not null, license_id uuid not null, unique(owner_id,asset_id,license_id),
  unique(id,owner_id)
);
create table gmm.editing_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, asset_id uuid, editor text not null default 'CapCut', settings jsonb not null default '{}'::jsonb,
  unique(id,owner_id)
);
create table gmm.final_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, asset_id uuid not null, platform text not null check(platform in ('tiktok','youtube')), format jsonb not null default '{}'::jsonb, version integer not null check(version>0), unique(owner_id,production_id,platform,version),
  unique(id,owner_id)
);
create table gmm.publications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid not null, final_version_id uuid, platform text not null check(platform in ('tiktok','youtube')), title text not null, description text, hashtags text, planned_at timestamptz, published_at timestamptz, published_url text, state text not null default 'draft', is_historical boolean not null default false, operator_decision text,
  unique(id,owner_id)
);
create table gmm.editorial_calendar (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  production_id uuid, publication_id uuid, planned_at timestamptz not null, note text,
  unique(id,owner_id)
);
create table gmm.metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  publication_id uuid not null, measured_at timestamptz not null, views bigint check(views>=0), likes bigint check(likes>=0), comments bigint check(comments>=0), shares bigint check(shares>=0), source text not null default 'manual',
  unique(id,owner_id)
);
create table gmm.audit_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entity_id uuid, entity_type text, action text not null, detail jsonb not null default '{}'::jsonb,
  unique(id,owner_id)
);
create table gmm.settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text not null, value jsonb not null default '{}'::jsonb, unique(owner_id,key),
  unique(id,owner_id)
);
create table gmm.backup_sync (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null, state text not null, manifest_hash text, reference text, completed_at timestamptz, last_error text,
  unique(id,owner_id)
);
alter table gmm.songs add constraint songs_artist_id_owner_fk foreign key (artist_id,owner_id) references gmm.artists(id,owner_id);
create index on gmm.songs (owner_id,artist_id);
alter table gmm.songs add constraint songs_genre_id_owner_fk foreign key (genre_id,owner_id) references gmm.genres(id,owner_id);
create index on gmm.songs (owner_id,genre_id);
alter table gmm.productions add constraint productions_song_id_owner_fk foreign key (song_id,owner_id) references gmm.songs(id,owner_id);
create index on gmm.productions (owner_id,song_id);
alter table gmm.productions add constraint productions_parent_id_owner_fk foreign key (parent_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.productions (owner_id,parent_id);
alter table gmm.reservations add constraint reservations_song_id_owner_fk foreign key (song_id,owner_id) references gmm.songs(id,owner_id);
create index on gmm.reservations (owner_id,song_id);
alter table gmm.reservations add constraint reservations_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.reservations (owner_id,production_id);
alter table gmm.media_assets add constraint media_assets_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.media_assets (owner_id,production_id);
alter table gmm.cover_variants add constraint cover_variants_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.cover_variants (owner_id,production_id);
alter table gmm.cover_variants add constraint cover_variants_asset_id_owner_fk foreign key (asset_id,owner_id) references gmm.media_assets(id,owner_id);
create index on gmm.cover_variants (owner_id,asset_id);
alter table gmm.licenses add constraint licenses_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.licenses (owner_id,production_id);
alter table gmm.licenses add constraint licenses_evidence_asset_id_owner_fk foreign key (evidence_asset_id,owner_id) references gmm.media_assets(id,owner_id);
create index on gmm.licenses (owner_id,evidence_asset_id);
alter table gmm.asset_licenses add constraint asset_licenses_asset_id_owner_fk foreign key (asset_id,owner_id) references gmm.media_assets(id,owner_id);
create index on gmm.asset_licenses (owner_id,asset_id);
alter table gmm.asset_licenses add constraint asset_licenses_license_id_owner_fk foreign key (license_id,owner_id) references gmm.licenses(id,owner_id);
create index on gmm.asset_licenses (owner_id,license_id);
alter table gmm.editing_projects add constraint editing_projects_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.editing_projects (owner_id,production_id);
alter table gmm.editing_projects add constraint editing_projects_asset_id_owner_fk foreign key (asset_id,owner_id) references gmm.media_assets(id,owner_id);
create index on gmm.editing_projects (owner_id,asset_id);
alter table gmm.final_versions add constraint final_versions_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.final_versions (owner_id,production_id);
alter table gmm.final_versions add constraint final_versions_asset_id_owner_fk foreign key (asset_id,owner_id) references gmm.media_assets(id,owner_id);
create index on gmm.final_versions (owner_id,asset_id);
alter table gmm.publications add constraint publications_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.publications (owner_id,production_id);
alter table gmm.publications add constraint publications_final_version_id_owner_fk foreign key (final_version_id,owner_id) references gmm.final_versions(id,owner_id);
create index on gmm.publications (owner_id,final_version_id);
alter table gmm.editorial_calendar add constraint editorial_calendar_production_id_owner_fk foreign key (production_id,owner_id) references gmm.productions(id,owner_id);
create index on gmm.editorial_calendar (owner_id,production_id);
alter table gmm.editorial_calendar add constraint editorial_calendar_publication_id_owner_fk foreign key (publication_id,owner_id) references gmm.publications(id,owner_id);
create index on gmm.editorial_calendar (owner_id,publication_id);
alter table gmm.metrics add constraint metrics_publication_id_owner_fk foreign key (publication_id,owner_id) references gmm.publications(id,owner_id);
create index on gmm.metrics (owner_id,publication_id);
alter table gmm.artists enable row level security;
create policy owner_access on gmm.artists for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.genres enable row level security;
create policy owner_access on gmm.genres for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.songs enable row level security;
create policy owner_access on gmm.songs for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.productions enable row level security;
create policy owner_access on gmm.productions for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.reservations enable row level security;
create policy owner_access on gmm.reservations for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.media_assets enable row level security;
create policy owner_access on gmm.media_assets for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.cover_variants enable row level security;
create policy owner_access on gmm.cover_variants for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.licenses enable row level security;
create policy owner_access on gmm.licenses for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.asset_licenses enable row level security;
create policy owner_access on gmm.asset_licenses for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.editing_projects enable row level security;
create policy owner_access on gmm.editing_projects for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.final_versions enable row level security;
create policy owner_access on gmm.final_versions for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.publications enable row level security;
create policy owner_access on gmm.publications for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.editorial_calendar enable row level security;
create policy owner_access on gmm.editorial_calendar for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.metrics enable row level security;
create policy owner_access on gmm.metrics for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.audit_log enable row level security;
create policy owner_access on gmm.audit_log for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.settings enable row level security;
create policy owner_access on gmm.settings for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter table gmm.backup_sync enable row level security;
create policy owner_access on gmm.backup_sync for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on schema gmm from public, anon;
grant usage on schema gmm to authenticated;
grant select,insert,update,delete on all tables in schema gmm to authenticated;
commit;
