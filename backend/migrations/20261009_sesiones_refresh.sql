-- Aditiva e idempotente; no toca encuestas existentes.
CREATE TABLE IF NOT EXISTS sesiones_refresh (
    token_hash CHAR(64) PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    password_fingerprint CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_refresh_usuario ON sesiones_refresh(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_refresh_expiracion ON sesiones_refresh(expires_at);
