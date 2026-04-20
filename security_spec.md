# Firebase Security Specification - e-Gov't Services Portal

## 1. Data Invariants
- An application cannot exist without a valid `userId` matching the authenticated user.
- A document cannot be read or written by anyone other than its `userId` owner.
- `createdAt` and `userId` fields are immutable after creation.
- Status updates must be restricted to valid enum values.

## 2. The "Dirty Dozen" Payloads (Red Team Tests)
1. **Identity Spoofing**: Attempt to create an application with a `userId` that is not mine.
2. **Bulk Read Leak**: Attempt to list all applications without a `where` clause restricting by `userId`.
3. **Cross-User Get**: Attempt to fetch a document ID belonging to another user.
4. **Status Shortcut**: Attempt to update an application status to "Approved" as a regular user (if admin logic existed, but here we keep it simple for now).
5. **Ghost Field Injection**: Attempt to create a user profile with an `isAdmin: true` field not in schema.
6. **Immutable Field Tamper**: Attempt to change the `createdAt` timestamp of an existing application.
7. **Document ID Poisoning**: Attempt to create a document with an ID longer than 128 characters.
8. **Orphaned Write**: Attempt to create an application for a user who doesn't have a profile yet (relational check).
9. **PII Blanket Read**: Attempt to list all user profiles.
10. **Malicious Step Update**: Attempt to set `currentStep` to a negative number or a string.
11. **Verification Bypass**: Attempt to write as a user with an unverified email (if required).
12. **Recursive Cost Attack**: Rapid multi-document get calls inside a loop.

## 3. Test Runner Configuration
Tests will be implemented in `firestore.rules.test.ts` using the `@firebase/rules-unit-testing` framework.
