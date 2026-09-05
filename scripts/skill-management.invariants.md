# Agent Skill Management Invariants

Agent skill management installs the packaged Semantic Claims skill into a directory chosen by the user, without identifying or detecting an agent product.

## §1 Destination

### §1.1 Commands manage the skill beneath the selected directory

Each command manages the `semantic-claims` child of its selected directory. An explicit directory selects that destination, while an omitted directory selects the command's working directory.
