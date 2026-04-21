-- =====================================================
-- FIX: Corregir políticas RLS para INSERT/UPDATE/DELETE
-- Ejecutar en SQL Editor de Supabase si ya corriste migration_001
-- =====================================================

do $$
declare
  t text;
  tables text[] := array[
    'campeonatos','temporadas','equipos','inscripciones','jugadores',
    'fases','grupos','grupo_equipos','canchas','arbitros',
    'partidos','goles','tarjetas'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "escritura_auth" on %I', t);
    execute format(
      'create policy "escritura_auth" on %I for all using (auth.uid() is not null) with check (auth.uid() is not null)',
      t
    );
  end loop;
end;
$$;
