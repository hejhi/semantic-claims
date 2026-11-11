# Claim Index

A project is *valid* if the checker, run in the project with no arguments, reports success. The *claims of a project* are the claims in the claim documents that the checker validates in the project. A *subject* is the set of claim documents in one directory whose file names are equal apart from the claim kind. A claim is *cross-cutting* if the claim's document is a cross-cutting claim document, as [Cross-cutting claims](../../REFERENCE.md#cross-cutting-claims) defines. An *executable proof* of a claim is a test of the claim that counts as an executable proof under [Proof structure](../../JAVASCRIPT.md#proof-structure).

## §1 Claims and proofs

### §1.1 Every named claim appears once under its subject

WHEN the claim index is built for a valid project, the claim index SHALL list each of the claims of the project exactly once, under the claim's subject, with the claim's kind, identifier, title, statement, cross-cutting status, claim document path, and line number.

### §1.2 Every claim lists exactly its matching executable proofs

WHEN the claim index is built for a valid project, the claim index SHALL list under each claim exactly the executable proofs of the claim, each with the path of the proof file and the line number of the proof.
