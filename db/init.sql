-- =============================================================================
-- SISTEMA DE ENCUESTAS OFFLINE CON SINCRONIZACIÓN INTELIGENTE
-- SCRIPT DE INICIALIZACIÓN AUTOMÁTICA DOCKER (SCHEMA + SEMILLAS)
-- Encuestas Offline de Colombia
-- SENA - Tecnología en Análisis y Desarrollo de Software - Ficha 3142784
-- =============================================================================
-- Este archivo se ejecuta automáticamente al iniciar el contenedor de PostgreSQL
-- por primera vez gracias al montaje en /docker-entrypoint-initdb.d/init.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones necesarias
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TABLA 1: municipios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipios (
    codigo          VARCHAR(5)      PRIMARY KEY,            -- Código DIVIPOLA DANE. Ej: 41001 = Neiva
    nombre          VARCHAR(100)    NOT NULL,
    departamento    VARCHAR(100)    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_municipios_departamento ON municipios(departamento);


-- -----------------------------------------------------------------------------
-- TABLA 2: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          SERIAL PRIMARY KEY,                 -- AUTO_INCREMENT
    numero_documento    VARCHAR(20)     NOT NULL UNIQUE,    -- Cédula o identificador del usuario
    nombre_completo     VARCHAR(200)    NOT NULL,
    email               VARCHAR(150)    UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,           -- Para autenticación JWT
    rol                 VARCHAR(15)     NOT NULL CHECK (rol IN ('encuestador','supervisor','admin')),
    dispositivo_id      VARCHAR(100),                       -- ID del celular Android asignado
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);


-- -----------------------------------------------------------------------------
-- TABLA 3: personas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personas (
    numero_documento    VARCHAR(20)     PRIMARY KEY,
    tipo_documento       VARCHAR(5)      NOT NULL CHECK (tipo_documento IN ('CC','TI','CE','NIT')),
    nombres              VARCHAR(150)    NOT NULL,
    apellidos            VARCHAR(150)    NOT NULL,
    telefono             VARCHAR(20),
    email                VARCHAR(150),
    direccion            VARCHAR(255),
    eps                  VARCHAR(100),
    ocupacion            VARCHAR(100),
    estrato              SMALLINT        CHECK (estrato BETWEEN 1 AND 6),
    municipio_codigo     VARCHAR(5)      REFERENCES municipios(codigo),
    sync_version         BIGINT          NOT NULL DEFAULT 1,   -- Incrementado en cada UPDATE del servidor
    sync_status          VARCHAR(10)     NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending','synced','conflict')),
    creado_en            TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_municipio ON personas(municipio_codigo);
CREATE INDEX IF NOT EXISTS idx_personas_sync_status ON personas(sync_status);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.sync_version = OLD.sync_version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_personas_updated_at ON personas;
CREATE TRIGGER trg_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();


-- -----------------------------------------------------------------------------
-- TABLA 4: historial_encuestas
-- Log INMUTABLE (solo INSERT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_encuestas (
    id_encuesta             UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_documento        VARCHAR(20)     NOT NULL REFERENCES personas(numero_documento),
    id_encuestador          INTEGER         NOT NULL REFERENCES usuarios(id_usuario),
    datos_recolectados      JSONB           NOT NULL,         -- Snapshot completo del formulario
    fecha_encuesta          TIMESTAMP       NOT NULL,         -- Cuándo se tomó la encuesta
    fecha_sincronizacion    TIMESTAMP,                        -- NULL mientras no haya internet
    dispositivo_id          VARCHAR(100),
    es_actualizacion        BOOLEAN         NOT NULL DEFAULT FALSE,
    version_anterior_id     UUID            REFERENCES historial_encuestas(id_encuesta)
);

CREATE INDEX IF NOT EXISTS idx_historial_persona ON historial_encuestas(numero_documento);
CREATE INDEX IF NOT EXISTS idx_historial_encuestador ON historial_encuestas(id_encuestador);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_encuestas(fecha_encuesta);

-- Bloqueo de UPDATE y DELETE a nivel de BD para inmutabilidad
CREATE OR REPLACE FUNCTION fn_bloquear_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'historial_encuestas es inmutable: no se permiten UPDATE ni DELETE';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_no_update ON historial_encuestas;
CREATE TRIGGER trg_historial_no_update
    BEFORE UPDATE ON historial_encuestas
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_modificacion();

DROP TRIGGER IF EXISTS trg_historial_no_delete ON historial_encuestas;
CREATE TRIGGER trg_historial_no_delete
    BEFORE DELETE ON historial_encuestas
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_modificacion();


-- -----------------------------------------------------------------------------
-- TABLA 5: cola_sincronizacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cola_sincronizacion (
    id_cola             SERIAL          PRIMARY KEY,
    id_encuesta         UUID            NOT NULL REFERENCES historial_encuestas(id_encuesta),
    accion               VARCHAR(10)     NOT NULL CHECK (accion IN ('INSERT','UPDATE')),
    payload              JSONB           NOT NULL,
    fecha_encuesta        TIMESTAMP       NOT NULL,
    estado                VARCHAR(20)     NOT NULL DEFAULT 'pending'
                          CHECK (estado IN ('pending','sent','conflict','conflict_resolved','error')),
    intentos              INTEGER         NOT NULL DEFAULT 0,
    ultimo_error          TEXT,
    creado_en             TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cola_estado ON cola_sincronizacion(estado);


-- -----------------------------------------------------------------------------
-- TABLA 6: log_conflictos
-- Auditoría forense de Smart Merge
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS log_conflictos (
    id_log                  SERIAL          PRIMARY KEY,
    id_encuesta_nueva       UUID            NOT NULL REFERENCES historial_encuestas(id_encuesta),
    id_encuesta_previa      UUID            NOT NULL REFERENCES historial_encuestas(id_encuesta),
    datos_anteriores         JSONB           NOT NULL,
    datos_entrantes          JSONB           NOT NULL,
    datos_resultado          JSONB           NOT NULL,
    campos_en_conflicto      JSONB           NOT NULL,
    estrategia                VARCHAR(50)     NOT NULL DEFAULT 'smart_merge_last_capture_wins',
    resuelto_por              INTEGER         REFERENCES usuarios(id_usuario),
    creado_en                 TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_conflictos_nueva ON log_conflictos(id_encuesta_nueva);


-- -----------------------------------------------------------------------------
-- TABLA 7: reporte_plano
-- Metadatos de reportes CSV
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reporte_plano (
    id_reporte           SERIAL          PRIMARY KEY,
    tipo_reporte          VARCHAR(20)     NOT NULL CHECK (tipo_reporte IN ('nuevos','actualizados','conflictos','completo')),
    fecha_desde            DATE            NOT NULL,
    fecha_hasta             DATE            NOT NULL,
    ruta_archivo             VARCHAR(500)    NOT NULL,
    registros_incluidos      INTEGER         NOT NULL DEFAULT 0,
    generado_por             INTEGER         NOT NULL REFERENCES usuarios(id_usuario),
    generado_en              TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reporte_tipo ON reporte_plano(tipo_reporte);


-- =============================================================================
-- DATOS SEMILLA (SEED DATA FOR DEMO & DEVELOPMENT)
-- =============================================================================
BEGIN;

-- 1. MUNICIPIOS
INSERT INTO municipios (codigo, nombre, departamento) VALUES
    ('41001', 'Neiva', 'Huila'),
    ('41551', 'Pitalito', 'Huila'),
    ('18001', 'Florencia', 'Caquetá'),
    ('11001', 'Bogotá D.C.', 'Cundinamarca'),
    ('05001', 'Medellín', 'Antioquia')
ON CONFLICT (codigo) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    departamento = EXCLUDED.departamento;

-- 2. USUARIOS (Password Hash para '123456')
INSERT INTO usuarios (numero_documento, nombre_completo, email, password_hash, rol, dispositivo_id, activo) VALUES
    ('admin', 'Super Administrador', 'admin@encuestasoffline.gov.co', '$2b$10$8XaVT//NFT3dfqLe2qZc1Ox480pn7gUXbsoOdkqenS0UaHbAKNw.e', 'admin', NULL, TRUE),
    ('1001001', 'Jorge Ramírez', 'jorge@encuestasoffline.gov.co', '$2b$10$8XaVT//NFT3dfqLe2qZc1Ox480pn7gUXbsoOdkqenS0UaHbAKNw.e', 'encuestador', 'ANDROID-JORGE-01', TRUE),
    ('1001002', 'María Pérez', 'maria@encuestasoffline.gov.co', '$2b$10$8XaVT//NFT3dfqLe2qZc1Ox480pn7gUXbsoOdkqenS0UaHbAKNw.e', 'encuestador', 'ANDROID-MARIA-02', TRUE),
    ('1001003', 'Ana Silvia Gómez', 'ana.supervisor@encuestasoffline.gov.co', '$2b$10$8XaVT//NFT3dfqLe2qZc1Ox480pn7gUXbsoOdkqenS0UaHbAKNw.e', 'supervisor', NULL, TRUE),
    ('998877', 'Encuestador de Prueba', 'prueba@encuestasoffline.gov.co', '$2b$10$8XaVT//NFT3dfqLe2qZc1Ox480pn7gUXbsoOdkqenS0UaHbAKNw.e', 'encuestador', 'ANDROID-TEST-99', TRUE)
ON CONFLICT (numero_documento) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    rol = EXCLUDED.rol,
    activo = EXCLUDED.activo;

-- 3. PERSONAS
INSERT INTO personas (numero_documento, tipo_documento, nombres, apellidos, telefono, email, direccion, eps, ocupacion, estrato, municipio_codigo, sync_version, sync_status) VALUES
    ('1034567890', 'CC', 'Luis Alberto', 'Rodríguez Santos', '3109876543', 'luis.rodriguez@email.com', 'Carrera 10 # 12-45', 'Sanitas', 'Agricultor', 2, '41001', 2, 'synced'),
    ('1012345678', 'CC', 'Carlos Eduardo', 'Mendoza Silva', '3154567890', 'carlos.mendoza@email.com', 'Calle 8 # 14-20', 'Sura', 'Docente', 3, '41551', 1, 'synced'),
    ('1023456789', 'CC', 'Laura Sofía', 'Gómez Martínez', '3187654321', 'laura.gomez@email.com', 'Avenida Circunvalar # 4-15', 'Coosalud', 'Comerciante', 1, '18001', 1, 'synced'),
    ('1045678901', 'CC', 'Ana Lucía', 'Morales Castro', '3123456789', 'ana.morales@email.com', 'Calle 25 # 8-30', 'Nueva EPS', 'Estudiante', 2, '41001', 1, 'synced')
ON CONFLICT (numero_documento) DO UPDATE SET
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email,
    direccion = EXCLUDED.direccion,
    eps = EXCLUDED.eps,
    ocupacion = EXCLUDED.ocupacion,
    estrato = EXCLUDED.estrato,
    municipio_codigo = EXCLUDED.municipio_codigo,
    sync_status = EXCLUDED.sync_status;

-- 4. HISTORIAL DE ENCUESTAS (CASOS PARA SMART MERGE)
INSERT INTO historial_encuestas (
    id_encuesta,
    numero_documento,
    id_encuestador,
    datos_recolectados,
    fecha_encuesta,
    fecha_sincronizacion,
    dispositivo_id,
    es_actualizacion,
    version_anterior_id
) VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-111111111111',
    '1034567890',
    (SELECT id_usuario FROM usuarios WHERE numero_documento = '1001001'),
    '{
        "nombres": "Luis Alberto",
        "apellidos": "Rodríguez Santos",
        "telefono": "3101234567",
        "email": "luis.rodriguez@email.com",
        "direccion": "Calle 15 # 5-20",
        "eps": "Coosalud",
        "ocupacion": "Agricultor",
        "estrato": 2,
        "vacunas": ["Covid19"],
        "observaciones": "Atendido en vereda El Caguán. Conectividad nula."
    }'::jsonb,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '3 hours',
    'ANDROID-JORGE-01',
    FALSE,
    NULL
) ON CONFLICT (id_encuesta) DO NOTHING;

INSERT INTO historial_encuestas (
    id_encuesta,
    numero_documento,
    id_encuestador,
    datos_recolectados,
    fecha_encuesta,
    fecha_sincronizacion,
    dispositivo_id,
    es_actualizacion,
    version_anterior_id
) VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-222222222222',
    '1034567890',
    (SELECT id_usuario FROM usuarios WHERE numero_documento = '1001002'),
    '{
        "nombres": "Luis Alberto",
        "apellidos": "Rodríguez Santos",
        "telefono": "3109876543",
        "email": "luis.rodriguez@email.com",
        "direccion": "Carrera 10 # 12-45",
        "eps": "Sanitas",
        "ocupacion": "Agricultor",
        "estrato": 2,
        "vacunas": ["Covid19", "Fiebre Amarilla"],
        "observaciones": "Actualización de residencia y nueva vacuna aplicada."
    }'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour',
    'ANDROID-MARIA-02',
    TRUE,
    'a1b2c3d4-e5f6-7a8b-9c0d-111111111111'
) ON CONFLICT (id_encuesta) DO NOTHING;

-- 5. LOG DE CONFLICTOS SMART MERGE
INSERT INTO log_conflictos (
    id_encuesta_nueva,
    id_encuesta_previa,
    datos_anteriores,
    datos_entrantes,
    datos_resultado,
    campos_en_conflicto,
    estrategia,
    resuelto_por,
    creado_en
) VALUES (
    'b2c3d4e5-f6a7-8b9c-0d1e-222222222222',
    'a1b2c3d4-e5f6-7a8b-9c0d-111111111111',
    '{
        "nombres": "Luis Alberto",
        "apellidos": "Rodríguez Santos",
        "telefono": "3101234567",
        "direccion": "Calle 15 # 5-20",
        "eps": "Coosalud",
        "vacunas": ["Covid19"]
    }'::jsonb,
    '{
        "nombres": "Luis Alberto",
        "apellidos": "Rodríguez Santos",
        "telefono": "3109876543",
        "direccion": "Carrera 10 # 12-45",
        "eps": "Sanitas",
        "vacunas": ["Covid19", "Fiebre Amarilla"]
    }'::jsonb,
    '{
        "nombres": "Luis Alberto",
        "apellidos": "Rodríguez Santos",
        "telefono": "3109876543",
        "direccion": "Carrera 10 # 12-45",
        "eps": "Sanitas",
        "vacunas": ["Covid19", "Fiebre Amarilla"]
    }'::jsonb,
    '{"telefono": {"anterior": "3101234567", "nuevo": "3109876543", "ganador": "nuevo (last_capture_wins)"}, "direccion": {"anterior": "Calle 15 # 5-20", "nuevo": "Carrera 10 # 12-45", "ganador": "nuevo (last_capture_wins)"}, "eps": {"anterior": "Coosalud", "nuevo": "Sanitas", "ganador": "nuevo (last_capture_wins)"}}'::jsonb,
    'smart_merge_last_capture_wins',
    NULL,
    NOW() - INTERVAL '1 hour'
);

COMMIT;
