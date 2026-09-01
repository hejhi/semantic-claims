# Local Explorer Service Invariants

The local explorer service provides a read-only browser interface for claims and proofs on the maintainer's machine.

## §1 Local read-only operation

### §1.1 The explorer is served only through the local loopback interface

Running `semantic-claims explore` starts the explorer on a loopback address and reports its local URL without exposing the service through an external network interface.

### §1.2 Exploring leaves the repository unchanged

Starting, browsing, and stopping the explorer creates, changes, and removes no files inside the explored repository.
