-- Agrega el campo para asociar cada perfil canino a una foto almacenada en Azure Blob Storage.
-- Se guarda solo el nombre del blob (no una URL): las URLs de lectura se generan al vuelo
-- como SAS de usuario delegado de corta duración (ver config/blobStorage.js).
ALTER TABLE perfiles_caninos ADD (foto_blob_name VARCHAR2(500));
