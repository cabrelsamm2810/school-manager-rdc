# Migration progressive de Base44 vers School Manager RDC

## Objectif
Cette documentation décrit la migration progressive de l'ancienne application Base44 vers la nouvelle architecture Next.js + TypeScript + PostgreSQL + Prisma.

## Principe de sécurité
- L'ancienne version Base44 reste intacte.
- Aucun historique de données n'est supprimé.
- Les données ne sont pas migrées de manière destructive.
- La nouvelle version est conçue pour être progressive et évoluer par lots.

## Flux de migration
Base44
  -> Export des données
  -> Transformation des structures
  -> Nettoyage / validation
  -> Import PostgreSQL
  -> Activation de la nouvelle application

## Étapes recommandées
### 1. Inventaire des données existantes
- utilisateurs
- écoles
- classes
- enseignants
- élèves
- parents
- documents
- messages
- fichiers
- frais

### 2. Export de Base44
Exporter les données dans un format standard : CSV, JSON, SQL ou une base de données intermédiaire.

### 3. Nettoyage et mapping
Créer un mapping de champs entre Base44 et les nouveaux modèles Prisma :
- User -> User
- School -> School
- Province -> Province
- Student -> Student
- Teacher -> Teacher
- Parent -> Parent

### 4. Sécurisation de l'import
- ne pas importer de mots de passe en clair
- réinitialiser les accès après validation
- conserver les identifiants uniquement dans la table de migration

### 5. Import PostgreSQL
Utiliser Prisma ou un script d'import dédié pour injecter les données dans la base PostgreSQL.

### 6. Validation et tests
- vérifier que les relations fonctionnent
- valider les rôles et permissions
- tester les transferts de fichier
- vérifier les contraintes et index

### 7. Activation progressive
- activer les nouvelles routes
- maintenir l'ancien système en parallèle
- migrer progressivement les utilisateurs et modules

## Variables d'environnement à préparer
- DATABASE_URL
- DIRECT_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- STORAGE_PROVIDER
- S3_ENDPOINT
- S3_BUCKET
- S3_REGION
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- FILE_MAX_SIZE

## Recommandations de supervision
- sauvegarder les exports avant chaque import
- faire des imports par lots
- enregistrer une trace des erreurs de migration
- contrôler les permissions de fichiers et de rôle après import

## Étape suivante
Avant d'importer les données réelles, valider le schéma Prisma et le fonctionnement des pages de connexion, d'inscription et du rôle utilisateur.
