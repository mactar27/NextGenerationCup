# ⚽ Plateforme Privée de Gestion de Tournoi de Football Élite 2026

Plateforme web sécurisée destinée à l'organisation intégrale d'un tournoi fermé réunissant **21 équipes officielles**, avec une limite stricte de **30 joueurs par équipe (soit 630 joueurs maximum)**.

---

## 🔒 1. Architecture d'Isolation Stricte des Dirigeants (RBAC)

L'isolation n'est pas un simple masquage graphique : elle est **imposée côté serveur** à chaque requête :

1. **Rôle Administrateur (`ADMIN`)** :
   - Vision globale sur les 21 équipes et l'ensemble des 630 joueurs.
   - Validation, rejet avec motif explicite, suspension et réactivation des licences.
   - Consultation du journal d'audit de sécurité (`/api/audit`).

2. **Rôle Dirigeant d'Équipe (`TEAM_MANAGER`)** :
   - Rattaché de manière immuable à son `team_id`.
   - Les routes serveur (`/api/teams`, `/api/players`, `/api/teams/[id]`, `/api/players/[id]`) filtrent et rejettent systématiquement avec un code **HTTP 403 Forbidden** toute tentative d'accès aux données d'un autre club.
   - Contrôle automatisé du quota strict de **30 joueurs maximum par équipe**.
   - Détection en temps réel des doublons sur l'ensemble de la compétition.

3. **Rôle Officiel / Arbitre (`OFFICIAL`)** :
   - Gestion des rencontres, programmation et saisie des scores officiels.

---

## 📋 2. Fonctionnalités Clés Réalisées

* **Authentification Privée Sécurisée** : Sessions chiffrées avec cookies `HttpOnly`, hachage scrypt fort. Aucune inscription publique possible.
* **Génération de Licences Numériques** : Format carte sportive au ratio 1.6:1, numéro unique (`TFB-2026-XXXX`), dates d'émission et d'expiration, photo du joueur, signature et QR Code SVG haute fidélité.
* **Vérification en Ligne par QR Code** : Page `/verify/[token]` affichant en temps réel le statut authentique de la licence (même si le document a été téléchargé ou imprimé antérieurement).
* **Compétition & Classement Dynamique** : Calcul automatique des points (3 victoires, 1 nul), de la différence de buts et des statistiques.
* **Journalisation d'Audit** : Historique complet des connexions, validations de licences et modifications.

---

## 🚀 3. Démarrage et Comptes de Démonstration

```bash
# Démarrer le serveur en développement
pnpm dev

# Compiler pour la production
./node_modules/.bin/next build --webpack
```

### Comptes pré-configurés pour tester l'isolation :

| Rôle | Identifiant | Mot de passe | Périmètre d'accès |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin` | `Admin2026!Secure` | 21 Équipes • 630 Joueurs • Validations • Audit |
| **Dirigeant FCB** | `dir_fcb` | `Dirigeant2026!` | **Uniquement FC Barcelona Academy (max 30 joueurs)** |
| **Dirigeant RMA** | `dir_rma` | `Dirigeant2026!` | **Uniquement Real Madrid Castilla (max 30 joueurs)** |
| **Officiel / Arbitre** | `officiel` | `Officiel2026!` | Rencontres • Calendrier • Saisie des scores |
