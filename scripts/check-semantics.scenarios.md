# Checker

An *invocation* is one run of the checker. The *project* of an invocation is the invocation's working directory and every file beneath that directory. A *kind argument* is an argument that names a claim kind. The *selected kinds* of an invocation whose arguments are each a kind argument are the kinds that the arguments name, or both kinds for an invocation with no arguments. An *unsupported argument list* contains an argument other than a kind argument and differs from the argument list that starts the explorer.

A *recognized file* is a claim document or proof file, named as [File pairing](../JAVASCRIPT.md#file-pairing) defines, in the project and outside each directory that [Validation scope](../JAVASCRIPT.md#validation-scope) skips. A *checked file* of an invocation is a recognized file of a selected kind. A claim document and a proof file are each other's *counterparts* if they pair as [File pairing](../JAVASCRIPT.md#file-pairing) defines. A checked file is *valid* if the file satisfies every rule in [File pairing](../JAVASCRIPT.md#file-pairing), [Claim document structure](../JAVASCRIPT.md#claim-document-structure), and [Proof structure](../JAVASCRIPT.md#proof-structure), and a project is *valid* for an invocation if each checked file of the invocation is valid.

A claim document's *identifier hierarchy* is *complete* if the document declares at least one section and at least one claim, each section and claim has a nonempty title and an identifier that is unique in the document, and the first component of each claim identifier is the identifier of a declared section. A *statement rule* is a rule listed in [Claim document structure](../JAVASCRIPT.md#claim-document-structure). A proof file *differs in structure* from the proof file's counterpart if a test group or test in the proof file has no identifier, has an identifier that the counterpart omits, is the test of a claim outside the test group of the claim's section, or has a title that differs from the counterpart's title for the same identifier after the structural separator is removed. A test group or test is *executable* if it and each test group that encloses it are free of skip and todo markers. An *executable proof* of a claim is an executable test with the claim's identifier. A *section group* of a section is a test group with the section's identifier in the counterpart of the section's claim document.

The checker *rejects* an invocation if the checker reports its usage and reports failure before the checker validates a file. The checker *fails validation* if the checker reports that validation failed and reports failure. A *missing-proof error* is an error that names a claim's identifier and states that the claim has no executable proof.

## §1 Validation scope

### §1.1 Supported kind selections determine validation scope

WHEN the checker is run with arguments that are each a kind argument, the checker SHALL validate exactly the checked files.

### §1.2 A checked file without its counterpart fails validation

IF the checker is run on a project that contains a checked file whose counterpart is absent, THEN the checker SHALL fail validation.

### §1.3 TypeScript tests and JavaScript modules are equivalent proof formats

WHEN the checker is run with arguments that are each a kind argument, the checker SHALL validate checked TypeScript and JavaScript proof files by the same rules.

### §1.4 An unsupported argument list is rejected

IF the checker is run with an unsupported argument list, THEN the checker SHALL reject the invocation.

### §1.5 A claim document with multiple paired proof files fails validation

IF the checker is run on a project that contains a checked claim document with more than one counterpart, THEN the checker SHALL fail validation with an error that names each counterpart.

## §2 Claim document structure

### §2.1 An incomplete identifier hierarchy fails validation

IF the checker is run on a project that contains a checked claim document whose identifier hierarchy is incomplete, THEN the checker SHALL fail validation.

### §2.2 A proof that differs from the structure of its claim document fails validation

IF the checker is run on a project that contains a checked proof file that differs in structure from the proof file's counterpart, THEN the checker SHALL fail validation.

### §2.3 A statement that breaks a statement rule fails validation

IF the checker is run on a project that contains a checked claim document with a statement that breaks a statement rule, THEN the checker SHALL fail validation.

### §2.4 A claim document with a backtick fails validation

IF the checker is run on a project that contains a checked claim document with a backtick, THEN the checker SHALL fail validation with an error that names each line of the document that contains a backtick.

## §3 Proof coverage

### §3.1 A section without exactly one matching test group fails validation

IF the checker is run on a project that contains a checked claim document with a section that has zero executable section groups or more than one section group, THEN the checker SHALL fail validation.

### §3.2 Exactly the claims without an executable proof are reported as missing

WHEN the checker is run on a project that contains a checked claim document with exactly one counterpart, the checker SHALL write a missing-proof error for exactly the claims of the document that have zero executable proofs.

## §4 Validation results

### §4.1 Failure output names each invalid checked file

IF the checker is run on a project that contains an invalid checked file, THEN the checker SHALL write errors that name each invalid checked file.

### §4.2 Success output includes the number of checked pairs

WHEN the checker is run with arguments that are each a kind argument on a project that is valid for the invocation, the checker SHALL write to standard output, for each selected kind, the number of checked claim documents of that kind.

### §4.3 The checker reports success for a valid project

WHEN the checker is run with arguments that are each a kind argument on a project that is valid for the invocation, the checker SHALL report success.
