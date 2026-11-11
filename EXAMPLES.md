# Examples

These examples apply the rules in the [reference](./REFERENCE.md). Each **Bad** example breaks the rule in its heading, and the **Good** example after it states the same intended behavior under that rule.

Proof obligations are independent of any language or test framework. [JAVASCRIPT.md](./JAVASCRIPT.md) defines how JavaScript and TypeScript projects link claim documents to executable proofs.

## Claim documents

### An invariant document

`modal.invariants.md`:

```md
# Modal

## §1 Focus

### §1.1 The open modal contains focus

WHILE open, the modal SHALL contain the focused element.
```

**Proof obligation:** Open the modal, move focus with each input the modal supports, and check after each move that the focused element is inside the modal.

**Kind:** The modal contains the focused element at every moment the modal is open, so the claim is an invariant.

### A scenario document

`account-service.scenarios.md`:

```md
# Account service

An email address is *registered* if an account uses the email address.

## §1 Password reset

### §1.1 A reset request sends a reset link

WHEN a password reset is requested for a registered email address, the account service SHALL send a reset link to the email address.
```

**Proof obligation:** Request a password reset for a registered email address, and check that a reset link is sent to that email address.

**Kind:** Sending the link follows the reset request, an event, so the claim is a scenario.

## Kind

### A response to an event is a scenario

- **Bad** (`dictionary.invariants.md`): "The dictionary SHALL respond with the definition of each word that is looked up."
- **Good** (`dictionary.scenarios.md`): "WHEN a word that the dictionary contains is looked up, the dictionary SHALL respond with the word's definition."

A lookup is an event, and the dictionary responds once to each lookup, so the claim is a scenario with the lookup as its trigger. A characteristic that is always true, as in "The dictionary SHALL define each word that the dictionary contains.", is an invariant, and its proof looks up each word to observe the word's definition.

### Creation and failure are triggers

- **Bad** (`pool.invariants.md`): "WHERE created with a capacity of zero connections, the pool SHALL reject the capacity as invalid."
- **Good** (`pool.scenarios.md`): "IF a pool is created with a capacity of zero connections, THEN the pool SHALL reject the capacity as invalid."
- **Bad** (`editor.invariants.md`): "WHILE saving has failed, the editor SHALL show the unsaved changes."
- **Good** (`editor.scenarios.md`): "IF saving fails, THEN the editor SHALL leave the unsaved changes in the document."

The pool rejects the capacity when the pool is created, and saving fails at one moment, so both claims describe events. `IF … THEN` may replace `WHEN` for a failure or another unwanted event. A `WHERE` clause states a configuration that the system was created with, for behavior that is true after creation succeeds.

### Behavior true for as long as a state lasts is an invariant

- **Bad** (`tab-bar.scenarios.md`): "WHEN a tab is selected, the tab bar SHALL underline the newly selected tab."
- **Good** (`tab-bar.invariants.md`): "The tab bar SHALL underline the selected tab."
- **Bad** (`search.scenarios.md`): "WHEN a filter is applied, the search SHALL show exactly the results that match the filter."
- **Good** (`search.invariants.md`): "WHILE a filter is applied, the search SHALL show exactly the results that match the filter."

The selected tab is underlined, and the matching results are shown, for as long as the tab is selected or the filter is applied, so a test reads the response in any state instead of after the change that a trigger states. A response that is true for as long as a present state lasts is an invariant, even when an event, such as a selection, starts that state.

### An invariant states present state, including through defined terms

- **Bad:** "WHILE signed in, the header SHALL show the greeting name.", with the introduction "The *greeting name* is the name entered at the latest sign-in."
- **Good:** "WHILE signed in, the header SHALL show the signed-in user's name."

A term defined by an earlier event makes an invariant refer to that event. The Good statement states what the header shows now.

### An earlier event belongs in the trigger

- **Bad** (`modal.invariants.md`): "The modal SHALL focus the control that was focused before the modal opened."
- **Good** (`modal.scenarios.md`): "WHEN the modal closes, the modal SHALL focus the control that was focused immediately before the modal opened."
- **Bad** (`payment-service.scenarios.md`): "WHILE a payment has been accepted, WHEN a client submits the payment again, the payment service SHALL respond with the accepted outcome."
- **Good** (`payment-service.scenarios.md`): "WHEN a client resubmits a payment that the payment service accepted earlier, the payment service SHALL respond with the outcome of the earlier accepted payment."

An invariant states the present state, and a `WHILE` clause states a condition on the system's present state.

## Statement form

### Keywords are uppercase and in order

- **Bad:** "When a password reset is requested for a registered email address, the account service shall send a reset link to the email address."
- **Good:** "WHEN a password reset is requested for a registered email address, the account service SHALL send a reset link to the email address."
- **Bad:** "WHILE open, WHERE created with a title, the modal SHALL show the title."
- **Good:** "WHERE created with a title, WHILE open, the modal SHALL show the title."

Clauses appear in the order `WHERE`, `WHILE`, then `WHEN` or `IF`.

### Keywords and conditional logic stay out of prose

- **Bad:** "WHEN the user closes the editor, the editor SHALL show a prompt to confirm closing if the draft has unsaved changes."
- **Good:** "WHILE the draft has unsaved changes, WHEN the user closes the editor, the editor SHALL show a prompt to confirm closing."

Each condition belongs in a clause or in a term defined by the introduction.

### One `SHALL` and one behavior

- **Bad:** "IF saving fails, THEN the editor SHALL leave the unsaved changes in the document and SHALL show a retry button."
- **Bad:** "IF saving fails, THEN the editor SHALL leave the unsaved changes in the document and show a retry button."
- **Good**, as two claims:
  - "IF saving fails, THEN the editor SHALL leave the unsaved changes in the document."
  - "IF saving fails, THEN the editor SHALL show a retry button."
- **Good**, as one claim: "IF saving the order fails after a successful payment authorization, THEN the checkout SHALL release the authorization before the checkout reports failure."

A test verifies keeping the unsaved changes and showing a retry button separately, so each is its own claim. The checkout's release and failure report form one behavior, their order, so they form one claim. The system is the subject of each `SHALL`.

### The system name is the document's heading

- **Bad** (heading `# Shop`): "WHEN an order is placed, the shop SHALL confirm the order, and the order SHALL appear in the order history."
- **Bad** (heading `# Shop`): "WHEN an order is placed, the order history SHALL contain the order."
- **Good** (heading `# Shop`): "WHEN an order is placed, the shop SHALL add the order to the shop's order history."

### A condition on an input belongs in the trigger

- **Bad:** "WHILE an order is unpaid, IF the order is marked for shipment, THEN the shop SHALL reject the shipment as unpaid."
- **Good:** "IF an unpaid order is marked for shipment, THEN the shop SHALL reject the shipment as unpaid."
- **Good**, for a state of the system: "WHILE the shop is closed, WHEN an order is placed, the shop SHALL add the order to the shop's waiting list."

A property of the input, including one the system records, describes the triggering event, as in the EARS example "IF an invalid credit card number is entered". A `WHILE` clause states a condition on the system's state, as in the EARS example "WHILE there is no card in the ATM".

### The trigger is an event

- **Bad:** "IF a configuration file contains a key outside the schema, THEN the linter SHALL fail the run."
- **Bad:** "IF the linter finds a key outside the schema, THEN the linter SHALL fail the run."
- **Good:** "IF the linter is run on a configuration file that contains a key outside the schema, THEN the linter SHALL fail the run."

The trigger states the event that starts the behavior, such as a run of the linter, and the input that a test sets up, such as the configuration file. A configuration file that contains a key outside the schema exists while the linter is idle, so that condition alone states no event. A key that the linter finds is the linter's own conclusion, so a trigger that states a finding leaves open which file causes it, and a linter that finds zero keys outside the schema satisfies the claim.

### A count states its interval

- **Bad:** "WHEN a reminder is due, the calendar SHALL notify the user once."
- **Good:** "WHEN a reminder is due, the calendar SHALL notify the user exactly once before the user dismisses the reminder."

A count states the interval it counts over, such as the time before a reminder is dismissed or the whole time a state lasts. A claim such as "leave … unchanged" states the effect of its trigger: the state after the trigger equals the state before it.

### Behavior is stated positively

- **Bad:** "WHEN a reader unsubscribes from the newsletter, the newsletter service SHALL not send issues to the reader."
- **Good:** "WHEN a reader unsubscribes from the newsletter, the newsletter service SHALL stop sending issues to the reader."
- **Bad:** "WHEN a well-formed address is validated, the validator SHALL complete without an error."
- **Good:** "WHEN a well-formed address is validated, the validator SHALL accept the address."

Each claim states what the system does, as in "SHALL stop sending issues", "SHALL accept the address", and "IF a submission is rejected, THEN the form SHALL leave the form's accepted submission unchanged."

### A claim states meaning, and the proof checks implementation mechanics

- **Bad:** "WHEN `canAccess(member)` is called for a member with zero roles, the workspace SHALL return `false`."
- **Good:** "WHEN a member with zero roles opens the workspace, the workspace SHALL deny the member access."

Opening the workspace and denying access are the meaning, and the proof checks the implementation mechanics that represent them, such as a call and the value it returns. A yes-or-no answer, a status code, an error type, a message's wording, or a marker for absence represents a meaning, and the claim states that meaning. Content such as a total or a person's name is stated as itself.
## The introduction

### The introduction defines terms, and claims state behavior

- **Bad:** the introduction "A session *expires* 30 minutes after the user most recently opened a page in the session.", with the claim "WHEN a user in an expired session opens a page, the site SHALL send the user to the sign-in page."
- **Good:** the introduction "A session's *idle time* is the time since the user most recently opened a page in the session.", with the claim "WHEN a user whose session idle time is at least 30 minutes opens a page, the site SHALL send the user to the sign-in page."
- **Bad:** the introduction "The cache stores recent responses to reduce load on the server."
- **Good:** the introduction "A stored response's *age* is the time since the server sent the response.", with the claim "WHEN a stored response whose age is less than 60 seconds is requested by URL, the cache SHALL serve the stored response."
- **Bad:** the claim "WHEN a throttled client sends a request, the gateway SHALL queue the request.", with *throttled* left undefined.
- **Good:** the introduction "A client's *request rate* at a request is the number of requests the client sent within the 60 seconds before that request.", with the claim "WHEN a client whose request rate is more than 100 sends a request, the gateway SHALL queue the request."

A definition states what a term refers to, and each behavior of the system, including a change at a time, is stated in a claim and tested by its proof. If a claim uses a term with a meaning specific to the system, the introduction defines it. A definition may use ordinary conditional words, as in "An email address is *registered* if an account uses the email address.", because the keyword rules apply to claim statements.

### A definition decides every case

- **Bad:** "An *adult* is a customer over 18."
- **Good:** "An *adult* is a customer whose age is at least 18 years."
- **Bad:** "A *recent* order is an order from the last month."
- **Good:** "A *recent* order is an order placed at most 30 days before the current time."

A word with more than one meaning, such as "over" or "month", is replaced by the exact bound or unit.

### Each name has one meaning

- **Bad:** heading `# Cart`, with the introduction "A *cart* is a set of selected products." and the claim "The cart SHALL show the total price of the cart."
- **Good:** heading `# Cart`, with the introduction "The *selection* is the set of products in the cart." and the claim "The cart SHALL show the total price of the selection."

The system name and each defined term have distinct meanings.

### Claims with overlapping conditions agree

- **Bad:** "IF the sign-up form is submitted with an invalid email, THEN the form SHALL focus the email field." beside "IF the sign-up form is submitted with an empty password, THEN the form SHALL focus the password field." A submission with both meets both conditions, and the claims require different fields.
- **Good:** the first claim beside "IF the sign-up form is submitted with a valid email and an empty password, THEN the form SHALL focus the password field."
- **Bad:** the invariant "WHILE a file is selected, the preview SHALL show the selected file's contents." beside the scenario "IF loading the selected file fails, THEN the preview SHALL leave the earlier contents shown." After a failed load, a file is selected and the earlier contents are shown.
- **Good:** the invariant "WHILE the selected file is loaded, the preview SHALL show the selected file's contents." beside the same scenario.

Every state that meets the conditions of two claims satisfies both claims, including a state that a failure leaves.

### A shared condition is defined once

- **Bad:** "IF the linter is run on a project that contains a file with a syntax error, THEN the linter SHALL print the path of the file." beside "WHEN the linter is run on a project with the build directory excluded, the linter SHALL print exactly the paths of the project's files outside the build directory that have errors." A file in the build directory with a syntax error meets both conditions, and the claims require different output.
- **Good:** the introduction "A *checked* file is a file of the project outside each excluded directory.", with "IF the linter is run on a project that contains a checked file with a syntax error, THEN the linter SHALL print the path of the file." beside the same second claim.

When several claims depend on the same selection of input, such as the files a run reads, the introduction defines that selection as a term, and each trigger uses the term.

## Claim count

### Cases of one rule form one claim

- **Bad**, as two claims: "WHEN an order is placed on a Saturday, the shop SHALL schedule delivery for the following Monday." and "WHEN an order is placed on a Sunday, the shop SHALL schedule delivery for the following Monday."
- **Good:** "WHEN an order is placed on a Saturday or a Sunday, the shop SHALL schedule delivery for the following Monday."

Saturday and Sunday follow one rule, so they form one claim, and the proof checks each day.

### Different rules form different claims

- **Bad:** "IF a payment fails, THEN the checkout SHALL retry the payment with a saved card and show the payment error with a new card."
- **Good**, as two claims:
  - "IF a payment with a saved card fails, THEN the checkout SHALL retry the payment."
  - "IF a payment with a new card fails, THEN the checkout SHALL show the payment error."

The rules differ in both the card and the behavior after the failure.

## Proofs

### A proof checks the whole claim

Proof of "WHILE a filter is applied, the search SHALL show exactly the results that match the filter.":

- **Bad** proof: apply a filter, then check that one matching result is shown and one other result is hidden.
- **Good** proof: apply a filter that matches some of the results, then check that the shown results equal the matching results.

A proof of a claim with "exactly" compares the whole set of shown results with the whole set of matching results, so each missing or extra result fails the test.

## Systems

### A coordinator's interactions with its dependencies are local

**Context:** Checkout authorizes the payment and then saves the order. Authorization succeeds, and saving the order fails.

`checkout.scenarios.md`:

```md
# Checkout

## §1 Order save failure

### §1.1 A failed order save releases payment before checkout reports failure

IF saving the order fails after a successful payment authorization, THEN the checkout SHALL release the authorization before the checkout reports failure.
```

**Proof obligation:** Make authorization succeed and saving the order fail, then check that the release precedes the reported checkout failure.

**System:** The failed save is an event into checkout, and the release and the failure report are events out of checkout, so each event in the claim belongs to checkout's interface, and the claim is local to checkout.

### An interaction without a coordinating system is cross-cutting

**Context:** A search filter and a results list are separate local systems, and the page that shows both applies the filter to the results list.

`search/--filtered-search.invariants.md`:

```md
# Search

A result *matches* a filter if the result meets each of the filter's criteria.

## §1 Applied filters

### §1.1 Shown results match the applied filter

WHILE a filter is applied, the search SHALL show exactly the results that match the filter.
```

**Proof obligation:** Connect both systems through the application code, apply a filter that matches some of the results, and check that the shown results equal the matching results.

**System:** The applied filter is a state of the filter, and the shown results are a state of the results list, so the claim belongs to two local systems, and the claim is cross-cutting and is stored in the lowest common ancestor directory of both systems' files.

## Warrant

### A claim states intended behavior

- **Bad:** "The search SHALL show results of equal relevance from newest to oldest.", for an order that no responsible person has specified or accepted.
- **Good:** "The search SHALL show results of equal relevance from newest to oldest.", after the product owner specifies that order.

### A claim uses the interface

- **Bad:** "WHEN a product's price changes, the store SHALL clear the product's entry in the store's private cache."
- **Good:** "The store SHALL show each product's current price on each view of the product."
- **Bad:** "IF a sign-up with an invalid email address is submitted, THEN the service SHALL validate the email address before saving the account."
- **Good:** "IF a sign-up with an invalid email address is submitted, THEN the service SHALL leave the service's accounts unchanged."
- **Bad:** "The service SHALL store accounts in PostgreSQL.", unless a protocol or compatibility contract places the database in the interface.

A protocol, such as HTTP, is part of the interface of a system whose consumers use that protocol, such as an API, and part of the implementation of a system whose consumers are people, such as a website.
