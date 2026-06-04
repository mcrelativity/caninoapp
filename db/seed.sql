INSERT INTO usuarios (email, password_hash)
VALUES (
  'dueno@caninos.com',
  '$2b$10$e0MYzXyjpJS7Pd0RVvHwHeFxVZ1wttq2hhbYx/2sD3C/Ik2VqQ5xq'
);

INSERT INTO perfiles_caninos (usuario_id, nombre, raza, fecha_nacimiento, peso_actual_kg)
VALUES (
  (SELECT id FROM usuarios WHERE email = 'dueno@caninos.com'),
  'Toby',
  'Golden Retriever',
  TO_DATE('2026-03-01', 'YYYY-MM-DD'),
  5.20
);

INSERT INTO bitacora_salud_entrenamiento (
  perfil_id,
  fecha_registro,
  categoria,
  gramos_alimento_diario,
  observaciones
)
VALUES (
  (SELECT id FROM perfiles_caninos WHERE nombre = 'Toby'),
  TO_DATE('2026-06-04', 'YYYY-MM-DD'),
  'Control Esfínteres',
  320,
  'Rutina cada 2 horas. Dos avisos exitosos con refuerzo positivo.'
);

INSERT INTO bitacora_salud_entrenamiento (
  perfil_id,
  fecha_registro,
  categoria,
  gramos_alimento_diario,
  observaciones
)
VALUES (
  (SELECT id FROM perfiles_caninos WHERE nombre = 'Toby'),
  TO_DATE('2026-06-03', 'YYYY-MM-DD'),
  'Alimentación',
  320,
  'Se ajusta la porción a 110 g por comida. Mantener agua fresca.'
);

INSERT INTO bitacora_salud_entrenamiento (
  perfil_id,
  fecha_registro,
  categoria,
  gramos_alimento_diario,
  observaciones
)
VALUES (
  (SELECT id FROM perfiles_caninos WHERE nombre = 'Toby'),
  TO_DATE('2026-06-02', 'YYYY-MM-DD'),
  'Comandos Básicos',
  0,
  'Aprende "sentado" y "ven" con tres sesiones cortas al día.'
);

COMMIT;
