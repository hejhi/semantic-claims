# Ambiguity

This checklist lists words and constructs that give a claim statement or an introduction definition more than one reading, and the form that leaves one reading. Read each new or changed claim against every entry before the claim is final.

Section numbers cite D. M. Berry, E. Kamsties, and M. M. Krieger, [*From Contract Drafting to Software Specification: Linguistic Sources of Ambiguity*](https://cs.uwaterloo.ca/~dberry/handbook/ambiguityHandbook.pdf) (2003), which explains each source with further examples.

## Quantities and sets

### "a", "any", and "the" (§5.1, §5.2.2)

"A" and "any" can mean one member or every member, and "the" presumes that exactly one exists. Write "each" for every member, and state the order or the condition that selects a single member.

- **Bad:** "IF a submission of the form contains one or more invalid fields, THEN the form SHALL focus the invalid field."
- **Good:** "IF a submission of the form contains one or more invalid fields, THEN the form SHALL focus the first invalid field in document order."

### "all", "many", and "few" (§5.2.1, §5.2.3)

A plural quantifier leaves open whether a property is true of each member or for the set as a whole. Write "each" with the property in the singular.

- **Bad:** "WHEN orders are imported, the shop SHALL give all orders unique numbers."
- **Good:** "WHEN orders are imported, the shop SHALL give each order a number that differs from the number of every other order."

### "exactly one … for each …" (§5.2)

The phrase can count the matches for each member of the second set, or state that the first set consists of exactly those matches. Write the set and the count together.

- **Bad:** "WHEN a catalog is built, the catalog builder SHALL produce exactly one entry for each product."
- **Good:** "WHEN a catalog is built, the catalog builder SHALL produce entries that correspond one to one with the products."

### "only", "also", and "even" (§5.3)

The word limits the phrase it stands beside, and readers often attach it to the verb instead. Write "exactly" for a whole set and "each" for a property of every member.

- **Bad:** "WHILE a filter is applied, the search SHALL show only results that match the filter."
- **Good:** "WHILE a filter is applied, the search SHALL show exactly the results that match the filter."

### "with" (§5.1)

"Opened with X", "requested with X", or "run with X" leaves open whether other inputs are also present, as an incomplete list does. State the whole input set: state each input.

- **Bad:** "WHEN the linter is run with a configuration file, the linter SHALL check exactly the files that the configuration file lists."
- **Good:** "WHEN the linter is run with exactly one argument, a configuration file, the linter SHALL check exactly the files that the configuration file lists."

### "include" (§5.1)

"Include" can mean "consist of" or "contain among others". Write "exactly" for the whole set, or "contain" for one member.

- **Bad:** "WHEN a check run ends, the report SHALL include the failed checks."
- **Good:** "WHEN a check run ends, the report SHALL list exactly the failed checks."

### Bounds (§5.1)

"Minimum", "maximum", and "up to" leave open whether the bound itself is inside the range. Write "at least" or "at most" for an inclusive bound, and "more than" or "less than" for an exclusive one.

- **Bad:** "WHEN a request asks for up to 100 orders, the API SHALL respond with the requested orders."
- **Good:** "WHEN a request asks for at most 100 orders, the API SHALL respond with the requested orders."

## Logic

### "and" (§5.1)

"And" can join conditions that are true together, events that happen at once, events in order, or the members of a list. Use one meaning per statement, state an order with "before" or "after", and give each behavior that a test can verify separately its own claim.

- **Bad:** "WHEN the editor is closed, the editor SHALL save the draft and close the window."
- **Good:** "WHEN the editor is closed, the editor SHALL save the draft before the editor closes the window."

### "or" (§5.1, §5.4.7)

"Or" can be inclusive or exclusive, and a statement that mixes "and" with "or" leaves their grouping open. Write "either … or …" for the exclusive meaning and "… or … or both" for the inclusive meaning. Move a mixed condition into a term the introduction defines.

- **Bad:** "WHILE an owner or an editor of a shared document has the document open, the editor SHALL show the edit controls."
- **Good:** "WHILE a user who can edit a shared document has the document open, the editor SHALL show the edit controls.", with the introduction "A user *can edit* a document if the user owns the document, is an editor of the document, or both."

### "not" (§5.4.5, §5.4.6)

"Not" can negate the verb, and with it the whole statement, or only the word after it, and "not … because" leaves its scope open. A claim states the system's behavior positively. In a condition or a definition, state what is present, such as "an empty queue" for "a queue with no jobs", or "exactly one argument, a configuration file" for "a configuration file and no other argument".

- **Bad:** "IF an export does not finish because the disk is full, THEN the exporter SHALL show a storage error."
- **Good:** "IF an export fails with a full disk, THEN the exporter SHALL show a storage error."

### "otherwise" and "else" (§5.4.4)

After several conditions, "otherwise" leaves open which condition the alternative answers. Give each condition its own claim.

- **Bad:** "The thermostat SHALL heat the room below 18 degrees, cool the room above 24 degrees, and idle otherwise."
- **Good**, as three claims:
  - "WHILE the room temperature is less than 18 degrees, the thermostat SHALL heat the room."
  - "WHILE the room temperature is more than 24 degrees, the thermostat SHALL cool the room."
  - "WHILE the room temperature is at least 18 degrees and at most 24 degrees, the thermostat SHALL idle.", with the introduction "The thermostat *idles* while the thermostat's heating and cooling are both off."

## Reference

### Pronouns (§5.4.2)

"It", "they", and "its" can refer to any earlier noun. Repeat the noun.

- **Bad:** "WHEN a user uploads a file to a shared folder, the drive SHALL send its owner a link to it."
- **Good:** "WHEN a user uploads a file to a shared folder, the drive SHALL send the owner of the folder a link to the file."

### "this" and "that" for a whole idea (§5.4.3)

A "this" that refers to a previous sentence leaves open which part of the sentence it means. State the noun that "this" refers to.

- **Bad:** the introduction "A *draft* is a document with unsaved changes. This applies to shared documents."
- **Good:** the introduction "A *draft* is a shared document with unsaved changes."

### "after", "before", "next", "previous", and "latest" (§5.1)

Each of these words has a fixed meaning but a reference that changes with context. State the event or the order that the word refers to.

- **Bad:** "WHEN the user undoes an edit, the editor SHALL restore the previous document."
- **Good:** "WHEN the user undoes an edit, the editor SHALL restore the document as the document was before the latest edit."

### Stacked modifiers (§5.4.1)

In a phrase such as "invalid request error", a modifier can attach to either noun. Write the relation with "of" or "for", or define a term.

- **Bad:** "IF the server receives an invalid request, THEN the server SHALL respond with the invalid request error."
- **Good:** "IF the server receives an invalid request, THEN the server SHALL respond with the error for an invalid request."

## Time

### "until", "by", durations, and instants (§5.7)

"Until" and "by" differ in meaning, and both leave open whether the end instant is inside the interval. State inclusion with "before", "at or before", or "within … after".

- **Bad:** "WHILE a lease runs until its end time, WHEN the lease's owner renews the lease, the lease service SHALL extend the lease."
- **Good:** "WHEN the owner of a lease whose end time is after the current time renews the lease, the lease service SHALL extend the lease."

## Comparisons and words

### "than" (§5.5.2)

Both sides of a comparison refer to the same kind of quantity.

- **Bad:** "WHEN a retry is scheduled, the client SHALL use a delay shorter than the server."
- **Good:** "WHEN a retry is scheduled, the client SHALL use a delay shorter than the delay the server requested."

### A word or its meaning (§5.6)

A word can refer to itself or to its meaning. State the meaning that the text conveys.

- **Bad:** "IF the email field is submitted empty, THEN the form SHALL show the message required."
- **Good:** "IF the email field is submitted empty, THEN the form SHALL report the email field as required."

### Vague and uncertain words (§5.1)

Vague words such as "appropriate", "efficient", "immediately", "handle", "process", "support", and "reject", and uncertain words such as "can", "may", "usually", and "etc.", have no single truth value. Write the specific outcome, a measured value, a complete list, or a term the introduction defines.

- **Bad:** "IF a request with an expired token arrives, THEN the API SHALL reject the request."
- **Good:** "IF a request with an expired token arrives, THEN the API SHALL reject the request as unauthenticated."
