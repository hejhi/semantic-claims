# Skill Synchronization Invariants

Skill synchronization builds generated method references from the source documents and mirrors the Semantic Claims source skill into configured runtime directories.

## §1 Generated method references

### §1.1 Generated method references reproduce their source documents exactly

Every method document configured as a generated skill reference has the same content in the source skill as its repository source document after synchronization.

## §2 Runtime skill mirrors

### §2.1 Every runtime Semantic Claims skill exactly mirrors its source

After synchronization, each configured runtime copy of the Semantic Claims skill contains the same files and contents as its source. Other skills in the source and runtime directories remain unchanged.
