# Agent Skill Management Invariants

Agent skill management installs the packaged Semantic Claims skills into a directory chosen by the user, without identifying or detecting an agent product.

## §1 Destination

### §1.1 Commands manage the skills beneath the selected directory

Each command manages the `semantic-claims-claim`, `semantic-claims-prove`, `semantic-claims-implement`, and `semantic-claims-review` children of its selected directory. The skills share the method guidance and references provided with `semantic-claims-claim`. An explicit directory selects that destination, while an omitted directory selects the command's `.agents/skills` directory.
