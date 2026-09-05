# Agent Skill Management Scenarios

## §1 Installation

### §1.1 Installation adds the packaged skill without replacing an existing entry

**Given** the selected directory has no `semantic-claims` entry,
**When** installation runs,
**Then** the directory receives an exact copy of the packaged skill.

If the entry already exists, installation fails and leaves it unchanged.

## §2 Update

### §2.1 Update replaces only an existing Semantic Claims skill

**Given** the selected directory contains a Semantic Claims skill,
**When** update runs,
**Then** its contents exactly match the packaged skill and other entries in the selected directory remain unchanged.

Update fails without changing the selected directory when its `semantic-claims` entry is absent or does not identify itself as the Semantic Claims skill.

## §3 Removal

### §3.1 Removal deletes only an existing Semantic Claims skill

**Given** the selected directory contains a Semantic Claims skill,
**When** removal runs,
**Then** that skill is absent and other entries in the selected directory remain unchanged.

Removal fails without changing the selected directory when its `semantic-claims` entry is absent or does not identify itself as the Semantic Claims skill.
