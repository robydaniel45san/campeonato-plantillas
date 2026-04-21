-- =====================================================
-- SEED DATA — datos de ejemplo
-- =====================================================

-- Campeonato ejemplo
insert into campeonatos (id, nombre, descripcion, formato, estado, fecha_inicio, fecha_fin)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Campeonato Apertura',
  'Torneo de apertura de la temporada',
  'liga',
  'activo',
  '2025-01-15',
  '2025-06-30'
);

-- Equipos ejemplo
insert into equipos (id, nombre, color_principal, color_secundario, ciudad) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Equipo Rojo',    '#dc2626', '#ffffff', 'Ciudad A'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Equipo Azul',    '#2563eb', '#ffffff', 'Ciudad B'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Equipo Verde',   '#16a34a', '#ffffff', 'Ciudad C'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Equipo Naranja', '#ea580c', '#ffffff', 'Ciudad D');

-- Inscripciones
insert into inscripciones (campeonato_id, equipo_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000004');

-- Jugadores de ejemplo
insert into jugadores (equipo_id, nombre, apellido, numero_dorsal, posicion) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Jugador', 'Uno A',   10, 'Delantero'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Jugador', 'Dos A',    9, 'Delantero'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Jugador', 'Tres A',   1, 'Portero'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Jugador', 'Uno B',   10, 'Delantero'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Jugador', 'Dos B',    7, 'Centrocampista'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Jugador', 'Uno C',   11, 'Delantero'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Jugador', 'Uno D',    9, 'Delantero');

-- Cancha ejemplo
insert into canchas (id, nombre, direccion, ciudad) values
  ('cccccccc-0000-0000-0000-000000000001', 'Estadio Central', 'Av. Principal 123', 'Ciudad A');

-- Árbitro ejemplo
insert into arbitros (id, nombre, apellido) values
  ('dddddddd-0000-0000-0000-000000000001', 'Árbitro', 'Principal');

-- Fase ejemplo
insert into fases (id, campeonato_id, nombre, tipo, orden) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Fase de Grupos', 'grupos', 1);

-- Partidos de ejemplo
insert into partidos (campeonato_id, fase_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, fecha, estado, jornada, cancha_id, arbitro_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
   2, 1, '2025-01-20 15:00:00-04', 'finalizado', 1,
   'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004',
   0, 0, '2025-01-21 15:00:00-04', 'finalizado', 1,
   'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003',
   1, 1, '2025-01-27 15:00:00-04', 'finalizado', 2,
   'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004',
   3, 2, '2025-02-03 15:00:00-04', 'programado', 3,
   'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001');
