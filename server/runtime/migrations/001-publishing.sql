-- Banco privado do serviço local; não altera IndexedDB nem banco remoto.
BEGIN IMMEDIATE;
      CREATE TABLE objects (kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
      CREATE TABLE transfers (id TEXT PRIMARY KEY,owner TEXT NOT NULL,fingerprint TEXT NOT NULL UNIQUE,data TEXT NOT NULL,offset INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE chunks (transfer_id TEXT NOT NULL REFERENCES transfers(id),offset INTEGER NOT NULL,bytes BLOB NOT NULL,PRIMARY KEY(transfer_id,offset));
      CREATE TABLE jobs (id TEXT PRIMARY KEY,owner TEXT NOT NULL,key TEXT NOT NULL UNIQUE,state TEXT NOT NULL,due INTEGER NOT NULL,lease TEXT,lease_until INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL,data TEXT NOT NULL);
      CREATE INDEX jobs_due ON jobs(state,due,lease_until);
      CREATE TABLE events (id INTEGER PRIMARY KEY,job_id TEXT,at TEXT NOT NULL,event TEXT NOT NULL);
      PRAGMA user_version=1; COMMIT;
