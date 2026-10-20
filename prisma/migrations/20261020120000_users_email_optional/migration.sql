-- Connexion par téléphone (code SMS) : un client peut n'avoir aucun email.
-- Rejouable sans erreur : retirer NOT NULL deux fois ne fait rien.
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
