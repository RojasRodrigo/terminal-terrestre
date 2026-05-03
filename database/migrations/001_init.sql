-- ============================================================
-- Terminal Terrestre — esquema de base de datos
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ciudades (nodos del grafo)
CREATE TABLE IF NOT EXISTS ciudades (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     VARCHAR(100) NOT NULL UNIQUE,
  codigo     VARCHAR(10)  NOT NULL UNIQUE,
  latitud    DECIMAL(9,6),
  longitud   DECIMAL(9,6),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rutas (aristas del grafo con pesos)
CREATE TABLE IF NOT EXISTS rutas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ciudad_origen_id UUID NOT NULL REFERENCES ciudades(id),
  ciudad_dest_id   UUID NOT NULL REFERENCES ciudades(id),
  distancia_km     INTEGER NOT NULL CHECK (distancia_km > 0),
  duracion_min     INTEGER NOT NULL CHECK (duracion_min > 0),
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rutas_unique UNIQUE (ciudad_origen_id, ciudad_dest_id),
  CONSTRAINT no_self_loop CHECK (ciudad_origen_id <> ciudad_dest_id)
);

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa        VARCHAR(20) NOT NULL UNIQUE,
  capacidad    INTEGER NOT NULL DEFAULT 40,
  empresa      VARCHAR(100),
  estado       VARCHAR(20) NOT NULL DEFAULT 'disponible'
               CHECK (estado IN ('disponible','en_ruta','mantenimiento','fuera_servicio')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Horarios / Despachos (cola de prioridad persistida)
CREATE TABLE IF NOT EXISTS despachos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id           UUID NOT NULL REFERENCES buses(id),
  ruta_id          UUID NOT NULL REFERENCES rutas(id),
  hora_programada  TIMESTAMPTZ NOT NULL,
  prioridad        INTEGER NOT NULL DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10),
  urgencia         VARCHAR(20) NOT NULL DEFAULT 'normal'
                   CHECK (urgencia IN ('normal','alta','critica')),
  estado           VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','en_plataforma','despachado','cancelado')),
  plataforma_num   INTEGER,
  pasajeros        INTEGER DEFAULT 0,
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  despachado_at    TIMESTAMPTZ
);

-- Historial de trayectos calculados
CREATE TABLE IF NOT EXISTS trayectos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ciudad_origen_id UUID NOT NULL REFERENCES ciudades(id),
  ciudad_dest_id   UUID NOT NULL REFERENCES ciudades(id),
  ruta_calculada   JSONB NOT NULL,   -- array de ciudad ids
  distancia_total  INTEGER NOT NULL,
  duracion_total   INTEGER NOT NULL,
  algoritmo        VARCHAR(50) NOT NULL DEFAULT 'dijkstra',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rutas_origen ON rutas(ciudad_origen_id);
CREATE INDEX IF NOT EXISTS idx_rutas_dest   ON rutas(ciudad_dest_id);
CREATE INDEX IF NOT EXISTS idx_despachos_estado ON despachos(estado);
CREATE INDEX IF NOT EXISTS idx_despachos_hora   ON despachos(hora_programada);

-- ============================================================
-- Datos semilla — ciudades de Bolivia
-- ============================================================
INSERT INTO ciudades (nombre, codigo, latitud, longitud) VALUES
  ('Cochabamba', 'CBB', -17.3935, -66.1570),
  ('La Paz',     'LPZ', -16.5000, -68.1193),
  ('Oruro',      'ORU', -17.9833, -67.1500),
  ('Potosí',     'POT', -19.5836, -65.7531),
  ('Sucre',      'SUC', -19.0333, -65.2627),
  ('Santa Cruz', 'SCZ', -17.7892, -63.1975),
  ('Trinidad',   'TDD', -14.8333, -64.9000),
  ('Tarija',     'TJA', -21.5355, -64.7296)
ON CONFLICT (codigo) DO NOTHING;

-- Rutas (bidireccionales — se insertan ambas direcciones)
WITH c AS (SELECT id, codigo FROM ciudades)
INSERT INTO rutas (ciudad_origen_id, ciudad_dest_id, distancia_km, duracion_min)
SELECT o.id, d.id, r.dist, r.dur FROM (VALUES
  ('CBB','LPZ',394,300), ('LPZ','CBB',394,300),
  ('CBB','ORU',210,150), ('ORU','CBB',210,150),
  ('CBB','SCZ',480,360), ('SCZ','CBB',480,360),
  ('CBB','SUC',320,240), ('SUC','CBB',320,240),
  ('CBB','TDD',510,420), ('TDD','CBB',510,420),
  ('LPZ','ORU',228,160), ('ORU','LPZ',228,160),
  ('ORU','POT',330,240), ('POT','ORU',330,240),
  ('POT','SUC',160,110), ('SUC','POT',160,110),
  ('SCZ','TDD',600,480), ('TDD','SCZ',600,480),
  ('SCZ','SUC',280,210), ('SUC','SCZ',280,210),
  ('SUC','TJA',320,250), ('TJA','SUC',320,250)
) AS r(orig, dest, dist, dur)
JOIN c o ON o.codigo = r.orig
JOIN c d ON d.codigo = r.dest
ON CONFLICT (ciudad_origen_id, ciudad_dest_id) DO NOTHING;

-- Buses de ejemplo
INSERT INTO buses (placa, capacidad, empresa) VALUES
  ('B-1234', 45, 'Trans Andes'),
  ('B-5678', 40, 'Flota Yungas'),
  ('C-9012', 50, 'Trans Copacabana'),
  ('C-3456', 35, 'Bolivia Bus'),
  ('D-7890', 42, 'Trans Andes')
ON CONFLICT (placa) DO NOTHING;
