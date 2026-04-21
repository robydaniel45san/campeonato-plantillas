-- =====================================================
-- CAMPEONATO PLANTILLAS — Schema Supabase
-- =====================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- =====================================================
-- CAMPEONATOS
-- =====================================================
create table if not exists campeonatos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  descripcion text,
  logo_url    text,
  formato     text not null default 'liga'
                check (formato in ('liga','copa','grupos','mixto')),
  estado      text not null default 'borrador'
                check (estado in ('borrador','activo','finalizado','suspendido')),
  fecha_inicio date,
  fecha_fin    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================
-- TEMPORADAS
-- =====================================================
create table if not exists temporadas (
  id              uuid primary key default uuid_generate_v4(),
  campeonato_id   uuid not null references campeonatos(id) on delete cascade,
  nombre          text not null,
  fecha_inicio    date,
  fecha_fin       date,
  activa          boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =====================================================
-- EQUIPOS
-- =====================================================
create table if not exists equipos (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  escudo_url       text,
  color_principal  text default '#16a34a',
  color_secundario text default '#ffffff',
  ciudad           text,
  fundado_en       int,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Inscripciones equipo → campeonato
create table if not exists inscripciones (
  id            uuid primary key default uuid_generate_v4(),
  campeonato_id uuid not null references campeonatos(id) on delete cascade,
  equipo_id     uuid not null references equipos(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(campeonato_id, equipo_id)
);

-- =====================================================
-- JUGADORES
-- =====================================================
create table if not exists jugadores (
  id               uuid primary key default uuid_generate_v4(),
  equipo_id        uuid references equipos(id) on delete set null,
  nombre           text not null,
  apellido         text,
  numero_dorsal    int,
  posicion         text check (posicion in ('Portero','Defensa','Centrocampista','Delantero')),
  foto_url         text,
  fecha_nacimiento date,
  nacionalidad     text,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- =====================================================
-- FASES
-- =====================================================
create table if not exists fases (
  id            uuid primary key default uuid_generate_v4(),
  campeonato_id uuid not null references campeonatos(id) on delete cascade,
  nombre        text not null,
  tipo          text not null default 'grupos'
                  check (tipo in ('grupos','eliminacion','liga')),
  orden         int not null default 1,
  created_at    timestamptz not null default now()
);

-- =====================================================
-- GRUPOS
-- =====================================================
create table if not exists grupos (
  id         uuid primary key default uuid_generate_v4(),
  fase_id    uuid not null references fases(id) on delete cascade,
  nombre     text not null,
  orden      int not null default 1,
  created_at timestamptz not null default now()
);

-- Equipos en grupo
create table if not exists grupo_equipos (
  id        uuid primary key default uuid_generate_v4(),
  grupo_id  uuid not null references grupos(id) on delete cascade,
  equipo_id uuid not null references equipos(id) on delete cascade,
  unique(grupo_id, equipo_id)
);

-- =====================================================
-- CANCHAS
-- =====================================================
create table if not exists canchas (
  id         uuid primary key default uuid_generate_v4(),
  nombre     text not null,
  direccion  text,
  ciudad     text,
  capacidad  int,
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================
-- ÁRBITROS
-- =====================================================
create table if not exists arbitros (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  apellido      text,
  especialidad  text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =====================================================
-- PARTIDOS
-- =====================================================
create table if not exists partidos (
  id                    uuid primary key default uuid_generate_v4(),
  campeonato_id         uuid not null references campeonatos(id) on delete cascade,
  fase_id               uuid references fases(id) on delete set null,
  grupo_id              uuid references grupos(id) on delete set null,
  equipo_local_id       uuid not null references equipos(id),
  equipo_visitante_id   uuid not null references equipos(id),
  goles_local           int default 0,
  goles_visitante       int default 0,
  penales_local         int,
  penales_visitante     int,
  fecha                 timestamptz,
  estado                text not null default 'programado'
                          check (estado in ('programado','en_curso','finalizado','suspendido','postergado')),
  jornada               int,
  cancha_id             uuid references canchas(id) on delete set null,
  arbitro_id            uuid references arbitros(id) on delete set null,
  notas                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- =====================================================
-- GOLES
-- =====================================================
create table if not exists goles (
  id          uuid primary key default uuid_generate_v4(),
  partido_id  uuid not null references partidos(id) on delete cascade,
  jugador_id  uuid references jugadores(id) on delete set null,
  equipo_id   uuid not null references equipos(id),
  minuto      int,
  tipo        text not null default 'normal'
                check (tipo in ('normal','penal','autogol','tiempo_extra')),
  created_at  timestamptz not null default now()
);

-- =====================================================
-- TARJETAS
-- =====================================================
create table if not exists tarjetas (
  id          uuid primary key default uuid_generate_v4(),
  partido_id  uuid not null references partidos(id) on delete cascade,
  jugador_id  uuid references jugadores(id) on delete set null,
  equipo_id   uuid not null references equipos(id),
  tipo        text not null check (tipo in ('amarilla','roja','doble_amarilla')),
  minuto      int,
  created_at  timestamptz not null default now()
);

-- =====================================================
-- VISTA: POSICIONES
-- =====================================================
create or replace view posiciones as
with stats as (
  select
    p.campeonato_id,
    p.grupo_id,
    e.id   as equipo_id,
    e.nombre,
    e.escudo_url,
    e.color_principal,
    count(*) filter (where p.estado = 'finalizado') as pj,
    count(*) filter (where p.estado = 'finalizado' and (
      (p.equipo_local_id = e.id     and p.goles_local > p.goles_visitante) or
      (p.equipo_visitante_id = e.id and p.goles_visitante > p.goles_local)
    )) as pg,
    count(*) filter (where p.estado = 'finalizado' and (
      (p.equipo_local_id = e.id     and p.goles_local < p.goles_visitante) or
      (p.equipo_visitante_id = e.id and p.goles_visitante < p.goles_local)
    )) as pp,
    count(*) filter (where p.estado = 'finalizado' and p.goles_local = p.goles_visitante) as pe,
    sum(case
      when p.estado = 'finalizado' and p.equipo_local_id = e.id     then p.goles_local
      when p.estado = 'finalizado' and p.equipo_visitante_id = e.id then p.goles_visitante
      else 0
    end) as gf,
    sum(case
      when p.estado = 'finalizado' and p.equipo_local_id = e.id     then p.goles_visitante
      when p.estado = 'finalizado' and p.equipo_visitante_id = e.id then p.goles_local
      else 0
    end) as gc
  from partidos p
  join equipos e on e.id = p.equipo_local_id or e.id = p.equipo_visitante_id
  group by p.campeonato_id, p.grupo_id, e.id, e.nombre, e.escudo_url, e.color_principal
)
select
  *,
  (gf - gc) as dg,
  (pg * 3 + pe) as pts
from stats
order by pts desc, dg desc, gf desc;

-- =====================================================
-- VISTA: GOLEADORES
-- =====================================================
create or replace view goleadores as
select
  g.campeonato_id,
  j.id         as jugador_id,
  j.nombre,
  j.apellido,
  j.foto_url,
  j.posicion,
  e.id         as equipo_id,
  e.nombre     as equipo_nombre,
  e.escudo_url as equipo_escudo,
  count(*)     as goles,
  count(*) filter (where g2.tipo = 'penal')   as penales,
  count(*) filter (where g2.tipo = 'autogol') as autogoles
from goles g2
join partidos g on g.id = g2.partido_id
join jugadores j on j.id = g2.jugador_id
join equipos e on e.id = g2.equipo_id
group by g.campeonato_id, j.id, j.nombre, j.apellido, j.foto_url, j.posicion, e.id, e.nombre, e.escudo_url
order by goles desc;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
alter table campeonatos  enable row level security;
alter table temporadas   enable row level security;
alter table equipos      enable row level security;
alter table inscripciones enable row level security;
alter table jugadores    enable row level security;
alter table fases        enable row level security;
alter table grupos       enable row level security;
alter table grupo_equipos enable row level security;
alter table canchas      enable row level security;
alter table arbitros     enable row level security;
alter table partidos     enable row level security;
alter table goles        enable row level security;
alter table tarjetas     enable row level security;

-- Lectura pública (anon puede leer todo)
create policy "lectura_publica" on campeonatos  for select using (true);
create policy "lectura_publica" on temporadas   for select using (true);
create policy "lectura_publica" on equipos      for select using (true);
create policy "lectura_publica" on inscripciones for select using (true);
create policy "lectura_publica" on jugadores    for select using (true);
create policy "lectura_publica" on fases        for select using (true);
create policy "lectura_publica" on grupos       for select using (true);
create policy "lectura_publica" on grupo_equipos for select using (true);
create policy "lectura_publica" on canchas      for select using (true);
create policy "lectura_publica" on arbitros     for select using (true);
create policy "lectura_publica" on partidos     for select using (true);
create policy "lectura_publica" on goles        for select using (true);
create policy "lectura_publica" on tarjetas     for select using (true);

-- Solo autenticados pueden escribir
create policy "escritura_auth" on campeonatos  for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on temporadas   for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on equipos      for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on inscripciones for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on jugadores    for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on fases        for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on grupos       for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on grupo_equipos for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on canchas      for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on arbitros     for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on partidos     for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on goles        for all using (auth.role() = 'authenticated');
create policy "escritura_auth" on tarjetas     for all using (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_campeonatos_updated_at before update on campeonatos
  for each row execute function set_updated_at();
create trigger trg_equipos_updated_at before update on equipos
  for each row execute function set_updated_at();
create trigger trg_jugadores_updated_at before update on jugadores
  for each row execute function set_updated_at();
create trigger trg_partidos_updated_at before update on partidos
  for each row execute function set_updated_at();
