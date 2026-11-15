-- Teleconsultations Service : ajout du statut REQUESTED (demande du patient).
-- À exécuter UNE fois sur une base existante (create_all ne modifie pas une table déjà créée).
-- Exemple : docker exec -i chroniccare-postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB> < migrations/001_add_requested_status.sql
-- Les contraintes sont (re)créées après les avoir retirées, pour pouvoir relancer le script.

BEGIN;

ALTER TABLE teleconsultations
    ALTER COLUMN scheduled_at DROP NOT NULL;

ALTER TABLE teleconsultations
    DROP CONSTRAINT IF EXISTS ck_teleconsultations_status;
ALTER TABLE teleconsultations
    ADD CONSTRAINT ck_teleconsultations_status
    CHECK (status IN ('REQUESTED','SCHEDULED','COMPLETED','CANCELLED'));

ALTER TABLE teleconsultations
    DROP CONSTRAINT IF EXISTS ck_teleconsultations_date_required;
ALTER TABLE teleconsultations
    ADD CONSTRAINT ck_teleconsultations_date_required
    CHECK (status IN ('REQUESTED','CANCELLED') OR scheduled_at IS NOT NULL);

COMMIT;
