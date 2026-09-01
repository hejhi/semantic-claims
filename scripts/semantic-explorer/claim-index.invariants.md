# Claim Index Invariants

The Semantic Explorer builds a claim index from named claim documents and proof files.

## §1 Claims and proofs

### §1.1 Every named claim appears once under its subject

The explorer includes every valid named invariant or scenario claim exactly once. Claim documents with the same colocated subject basename belong to one subject. A basename beginning with `--` marks its claims as cross-cutting, with the interaction as their subject. For each claim, the explorer includes its kind, identifier, title, full statement, cross-cutting status, claim document path, and source line.

### §1.2 Every claim lists exactly its matching executable proofs

For each claim, the explorer lists every matching executable proof declaration from the paired proof file, including its path and source line. It does not list those proofs under any other claim.
