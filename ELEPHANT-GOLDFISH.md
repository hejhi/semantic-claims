# Semantic Claims in the Elephant-Goldfish Model (EGM)

In [“Elephants, Goldfish and the New Golden Age of Software Engineering”](https://drensin.medium.com/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874), Dave Rensin describes an iterative process by developing a design in a long-context “Elephant” session, testing it in fresh-context “Goldfish” sessions, and implementing only once a written design spec/proposal stands on its own.

While Semantic Claims was developed independently, it fits naturally into this process. EGM also helps frame what Semantic Claims can help with, but also can't replace. Mainly, Semantic Claims can't replace design discussion or prescribe a complete workflow. Finally, I would argue that Semantic Claims can even help make EGM more efficient, reducing the amount of large specs retained at the end.

Process-wise, Semantic Claims fits between design and implementation:

```text
claim -> proof -> implementation
```

With design included:

```text
design intent -> claim -> proof -> implementation
```

The design covers the problem, decisions, architecture, and proposed work. A design can then be decomosed into subjects, with claims specifying the intended semantics as observable behavior.

The following sections explain where Semantic Claims can fit into EGM (without restating the full EGM process—read the article!).

## Phase 1: helping growing the design context

Semantic Claims can help an agent load context more efficiently by starting with claims located in areas they're going to work in, as well as applicable cross-cutting claim documents to better understand the system, and understand how the user models the system as subjects. It can then read proofs and implementation details as needed.

While the design discussion, no-code constraint, and active challenges to the user's assumptions happen outside of Semantic Claims, they can help an agent have a more informed understanding during this process, and make less assumptions about the current system. The output can help inform what new claims come out of it, and the agent can better align its thinking to terminology and subjects already in the system.

During the first technical proposal, the proposed work can be compared with existing claims. Any deltas between current claimed observable behavior can be scrutinized.

## Phase 2: teaching the design

After the problem and technical approach are understood, but _before_ any detailed implementation plan is finalized, the proposal can be decomposed semantically. For each important observable behavior, a decision can be made on whether it warrants a Semantic Claim and, if so, whether that claim is an invariant or scenario.

As mentioned in other docs, claims precede proofs and implementations. So, as part of the detailed implementation plan created in this step, new and updated claim documents can be enumerated alongside the other work called for by the design.

It can be treated like an iterative review, not a one-way extraction from the plan. While reviewing the proposal, ambiguous behavior can be identified and revised in either the proposal or the candidate claims.

Claims should be derived from intended observable behavior, not from the proposed file list or existing implementation.

## Phase 3: testing with fresh context

The Goldfish reviewer can receive the design and claims together. A fresh agent should be able to distinguish:

- the problem and proposed approach
- the observable behavior specified by the claims
- the evidence required to prove that behavior
- implementation choices that may change without redefining the claims

The review should find missing warranted observable behavior, claims that merely restate the plan, contradictions with existing claims, and proof obligations that can't be observed at the same level of abstraction.

If a fresh agent can interpret the design correctly, the written context no longer depends on the originating conversation. The paired executable proofs still provide the evidence for each claim.

## Phase 4: implementing from the design

Implementation can now follow the semantic order:

```text
claim -> proof -> implementation
```

Once the claims are finalized, their proofs can be written, and it can be confirmed that new proofs fail as expected (as they're missing the implementation). Then the feature can be implemented, and the claim checker run with the relevant project checks to make sure that claims and proofs are still aligned.

The design remains important, but “follow the plan” isn't the final correctness condition anymore. If someone finds a conflict among the plan, the claims, and the observable behavior users need, the design can be returned to and any issues resolved explicitly.

## Existing systems and temporary READMEs

See [EXISTING-SYSTEMS.md](./EXISTING-SYSTEMS.md) for the broader incremental-adoption method, including how to distinguish confirmed intent from behavior merely observed in code and tests.

Rensin proposes recursively generated READMEs as temporary context for systems without enough design documentation. However, Semantic Claims can reduce the amount an agent must infer from code because they contain reviewed statements of observable behavior.

Claim documents specify the semantics of individual subjects, while `--name` claim documents specify distinct cross-cutting behavior that provides system-level context. Neither type needs to inventory files or explain architecture; a good test is to see what an agent can infer from reading solely the claims and proofs without looking at any implementation at all.

In other words, with Semantic Claims, you may not need these temporary READMEs.

## How they relate

Semantic Claims covers observable behavior, executable proofs, local context, and visible semantic changes. EGM covers the larger iterative process of questioning assumptions, developing a design, testing it with fresh agents, and managing implementation work.

They complement each other—EGM helps people reach the understanding needed to write strong claims, and Semantic Claims record meaningful observable behavior that later agents and implementations must respect.
