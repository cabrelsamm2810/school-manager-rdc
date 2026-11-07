# Audit SMTP et activation — 7 novembre 2026

## Portée et conclusion

Audit du code de la branche de correction, du processus serveur du sandbox et du fournisseur SMTP déjà configuré. Aucun fournisseur, secret de production ou schéma de base n'a été changé. Aucune donnée existante n'a été supprimée. Les comptes de test créés par les vérifications ont été supprimés par leurs identifiants.

**La panne de livraison signalée en production n'a pas été reproduite ici.** Les cinq variables SMTP sont présentes dans le processus local, sans espace périphérique ; l'expéditeur correspond au compte SMTP. Résolution DNS réussie (deux adresses), authentification SMTP réussie avec STARTTLS obligatoire et certificats vérifiés (199 ms). Le serveur accepte l'enveloppe `MAIL FROM` (250), sans destinataire ni commande DATA : aucun email extérieur n'a été envoyé pour ce diagnostic. Les domaines de l'expéditeur publient des enregistrements SPF et DMARC. Leur présence ne prouve ni l'alignement SPF/DKIM d'un email reçu ni sa remise en boîte principale.

Le résumé des 600 dernières lignes du serveur local ne contenait aucune occurrence d'erreur d'identifiants, DNS, timeout ou d'envoi de validation, ni de réponse 503 de renvoi. Ce constat ne couvre pas les journaux Vercel.

Les précédentes conclusions attribuant définitivement la panne Vercel aux variables ne constituent donc pas une preuve actuelle. Il faut la catégorie et la référence d'une erreur provenant du déploiement concerné pour conclure. L'accès aux paramètres et journaux Vercel ainsi qu'à une boîte Gmail de test n'est pas disponible dans cette session.

## Défauts établis et corrections

Deux régressions ont été reproduites avant correction : un ancien code expiré était accepté (200 au lieu de 400), et deux demandes simultanées de renvoi envoyaient deux emails. Les anciens tests ne couvraient ni l'expiration ni la concurrence.

- `lib/smtp.ts` : configuration validée à chaque envoi, pas de fournisseur Gmail choisi implicitement si l'hôte manque. Port entier valide, expéditeur valide et sans injection d'en-tête ; repli SMTP_FROM sur SMTP_USER seulement si ce dernier est une adresse valide. Le mot de passe est préservé exactement, sans supprimer de caractères significatifs.
- TLS implicite sur 465 ; STARTTLS obligatoire sur les autres ports, TLS 1.2 minimum et validation des certificats maintenue. Délais DNS/connexion/salutation/socket bornés, et délai total d'envoi limité à 45 secondes sous la limite Vercel de 60 secondes. Aucun retry automatique susceptible de dupliquer un message après un résultat réseau ambigu.
- Confirmation d'envoi uniquement si le destinataire figure dans la liste des destinataires acceptés par SMTP. Une acceptation SMTP n'est **pas** une preuve de réception Gmail.
- Diagnostic structuré : catégorie `configuration`, `authentication`, `dns`, `tls`, `timeout`, `connection`, `sender`, `recipient` ou `protocol`, référence unique, codes SMTP et étapes sur liste blanche. Les messages et réponses bruts ne sont pas journalisés : aucune adresse, aucun mot de passe, aucun corps d'email ou code de validation dans ces logs.
- Modules d'envoi et de validation marqués `server-only` ; routes Node.js explicites. Les identifiants restent dans les variables serveur, jamais dans des variables NEXT_PUBLIC_*.
- Code à six chiffres généré avec `crypto.randomInt`, expiration à 15 minutes, cinq tentatives de validation par fenêtre de 15 minutes ; cinq demandes d'envoi maximum par heure et par compte, et une minute entre demandes. Ces compteurs sont persistants, partagés entre les instances et conservés après échec SMTP.
- Compare-and-swap PostgreSQL sur l'état de validation : un seul envoi gagne une course entre deux instances ; une activation concurrente ou une tentative incorrecte ne peut pas écraser un changement plus récent.
- Un renvoi réutilise le code tant qu'il est valable, sans prolonger sa durée de vie ; un code expiré est renouvelé. Un échec SMTP ne remplace pas un code encore valable. Les tentatives et quotas ne sont pas remis à zéro par un renvoi.
- Après activation : statut ACTIF, code effacé, aucune session créée automatiquement. Les comptes suspendus/désactivés restent non activables par ce parcours.
- Compte conservé si l'envoi initial échoue, avec `verificationEmailSent=false`. Réponse de renvoi 503 sans fausse confirmation et référence du diagnostic ; limitation 429 avec Retry-After. Versions HTML et texte de l'email de validation conservées, nom échappé dans le HTML contre l'injection de contenu et durée de validité explicitée.

## Compatibilité des données

Aucune migration. Le champ PostgreSQL TEXT `User.validationCode` existant contient un état JSON versionné (code, expiration, tentatives, fenêtres et délai de renvoi). Comme l'ancien code, cet état est confidentiel côté serveur et exclu des réponses d'inscription et des sélections publiques d'utilisateurs ; le code n'est pas haché au repos afin de pouvoir renvoyer le même code. L'accès à la base reste donc sensible.

Les anciennes valeurs numériques à six chiffres restent lisibles. En l'absence d'horodatage historique d'émission, leur durée est comptée conservativement depuis `createdAt` ; un ancien compte peut demander un nouveau code. Aucun compte n'est modifié en masse. Le schéma et la procédure existante de déploiement Vercel sont inchangés ; déployer le code backend et frontend de cette branche ensemble.

## Vérifications exécutées

- Avant correction : 14 tests existants réussis ; deux nouveaux tests de régression échouaient exactement sur expiration et envoi concurrent.
- `npm test -- tests/activation.test.ts tests/smtp.test.ts tests/smtp-local.integration.test.ts` : 48 tests réussis. Le récepteur local négocie réellement STARTTLS avec une CA de test explicitement approuvée, reçoit un email unique contenant versions texte/HTML et code, et simule aussi un refus d'expéditeur. Il ne transmet aucun email à l'extérieur.
- `RUN_DB_TESTS=true npm test -- tests/activation-postgres.integration.test.ts` : trois tests réussis sur PostgreSQL local. Appels des vraies routes d'inscription/renvoi/validation avec transport email simulé, puis relecture des écritures persistées. Ils couvrent code incorrect, expiration, activation unique, renvoi après expiration, concurrence, panne SMTP, conservation des codes et limitation des tentatives. Suppression des seuls comptes créés pour ces tests.
- Suite générale exécutée avant l'ajout des deux derniers tests SMTP : 78 tests réussis, quatre tests PostgreSQL ignorés par défaut. Les trois nouveaux tests PostgreSQL ont été exécutés séparément et réussissent. Après les dernières modifications, les 48 tests SMTP/activation et les trois tests PostgreSQL ont de nouveau réussi.
- `npx tsc --noEmit --incremental false` : réussi.
- `npx prisma generate && next build`, NODE_ENV=production, sans DATABASE_URL/DIRECT_URL et dans un volume de build isolé : réussi (exit 0), y compris après les dernières modifications.
- Serveur `next start` isolé en mode production : `/register`, `/verify`, `/login` répondent 200, les trois routes d'inscription/validation/renvoi rejettent un corps invalide avec 400. `/verify` nécessite le rendu client à cause de Suspense/useSearchParams : le HTML initial ne contient que le chargement ; le bundle correspondant est bien servi et contient le formulaire et la nouvelle explication. Ce contrôle n'est pas une validation visuelle sur Vercel.
- Navigateur mobile : formulaire et nouvelle explication d'expiration lisibles ; capture du renvoi limité et de l'activation réussie. La navigation suivante a remplacé le document et interrompu le rapport du script : pas de verdict global fondé sur ce script. Relecture indépendante en base : compte valide ACTIF et code effacé ; compte expiré toujours EN_ATTENTE. Les deux comptes ont été supprimés (reste : zéro). La page d'inscription a ensuite été capturée séparément et son formulaire initial s'affiche correctement. Les assertions navigateur code incorrect/expiré ne sont pas revendiquées comme complètes ; ces scénarios sont vérifiés par les tests de routes et PostgreSQL ci-dessus.

## Clôture de la validation de production

Restent non vérifiés : inscription avec une nouvelle adresse Gmail contrôlée par le propriétaire, réception effective et classement en boîte principale/spam, authentification et paramètres d'expéditeur du déploiement Vercel, SPF/DKIM/DMARC du message réellement reçu et parcours complet sur ce déploiement.

Pour les terminer, utiliser une adresse Gmail de test autorisée et fournir les logs de la requête Vercel concernée (catégorie/référence `[smtp] delivery_failed`, sans secret ni code). Vérifier que le déploiement contient cette correction, puis tester inscription, code faux, expiration, renvoi, activation et refus de réutilisation. N'afficher aucun secret et ne modifier aucune variable avant qu'un diagnostic du déploiement ait identifié la cause. Ne jamais présenter une build locale réussie, une authentification SMTP ou une acceptation du relais comme une preuve de remise Gmail ou de bon fonctionnement en production.
