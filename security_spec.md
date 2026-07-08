# Security Specification for Soka Usajili Pro

## Data Invariants
1. A team belongs to exactly one manager (managerId).
2. A player/staff member must belong to a team.
3. Max 25 players and 5 staff members per team.
4. Only Admin can confirm payments and approve teams.
5. Team managers can only edit their own team, players, and staff.
6. Match results can only be updated by Admin.
7. Registration periods can only be managed by Admin.

## Dirty Dozen Payloads (Rejection Targets)
1. Team Manager trying to approve their own team (`isApproved: true`).
2. Team Manager trying to update payment status to `CONFIRMED`.
3. Anonymous user trying to register a team.
4. User trying to delete/edit another team's players.
5. User trying to add more than 25 players (Enforcement via rules).
6. User trying to create a match.
7. User trying to update a match score.
8. User trying to create a registration period.
9. User trying to set their own role to `ADMIN` in profile.
10. Team Manager trying to change the `managerId` of their team.
11. User trying to inject 1MB string as a player name.
12. User trying to delete the admin profile.

## Firestore Rules Logic (Draft)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Deny
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isVerified() { return request.auth.token.email_verified == true; }
    function isAdmin() { return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }

    // Users
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId) && request.resource.data.role == 'TEAM_MANAGER';
      allow update: if isSignedIn() && isOwner(userId) && request.resource.data.role == resource.data.role; // Prevent self-elevation
    }

    // Teams
    match /teams/{teamId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.managerId == request.auth.uid && request.resource.data.isApproved == false;
      allow update: if (isSignedIn() && (
        isAdmin() || 
        (resource.data.managerId == request.auth.uid && 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'logoUrl', 'paymentProofUrl', 'paymentMethod']))
      ));
    }

    // Players
    match /players/{playerId} {
      allow read: if true;
      allow create: if isSignedIn() && get(/databases/$(database)/documents/teams/$(request.resource.data.teamId)).data.managerId == request.auth.uid;
      allow delete, update: if isSignedIn() && get(/databases/$(database)/documents/teams/$(resource.data.teamId)).data.managerId == request.auth.uid;
    }

    // Staff
    match /staff/{staffId} {
      allow read: if true;
      allow create: if isSignedIn() && get(/databases/$(database)/documents/teams/$(request.resource.data.teamId)).data.managerId == request.auth.uid;
      allow delete, update: if isSignedIn() && get(/databases/$(database)/documents/teams/$(resource.data.teamId)).data.managerId == request.auth.uid;
    }

    // Matches
    match /matches/{matchId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Periods
    match /registrationPeriods/{periodId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
