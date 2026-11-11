# Explorer

The explorer's *start page* is the page at the explorer's local URL. A *subject* is the set of claim documents in one directory whose file names are equal apart from the claim kind. A subject's *path* is the path of the subject's claim documents from the project root, without the claim kind and the file extension. A claim's *number* is the claim's identifier without its section sign. Each claim is either *cross-cutting*, if the claim's document is a cross-cutting claim document as [Cross-cutting claims](../../REFERENCE.md#cross-cutting-claims) defines, or *local*.

A *filter* is a subject, a claim kind, the local claims, the cross-cutting claims, or a search text that contains a character other than whitespace. A claim *matches* a subject if the claim belongs to the subject, a claim kind if the claim has that kind, the local claims if the claim is local, the cross-cutting claims if the claim is cross-cutting, and a search text if the claim's subject path, number, title, or statement contains the text, ignoring case and the whitespace around the text. An *executable proof* of a claim is a test of the claim that counts as an executable proof under [Proof structure](../../JAVASCRIPT.md#proof-structure).

## §1 Exploration lenses

### §1.1 The start page lists every subject

The explorer SHALL list every subject on the explorer's start page.

### §1.2 Selected filters show exactly the matching claims

WHILE one or more filters are selected and zero claims are open, the explorer SHALL show exactly the claims that match every selected filter.

### §1.3 An open claim shows its statement, proofs, and source

WHILE a claim is open, the explorer SHALL show the claim's complete statement, the path of the claim's document, the claim's line number in that document, and the path and line number of each executable proof of the claim.
