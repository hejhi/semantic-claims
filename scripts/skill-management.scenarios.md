# Agent Skill Management Scenarios

## §1 Installation

### §1.1 Installation adds the packaged skills without replacing existing entries

**Given** the selected directory has none of the four skill entries or the legacy `semantic-claims` entry,
**When** installation runs,
**Then** the directory receives exact copies of all four packaged skills, and other entries remain unchanged.

If any of those entries already exists, installation fails without changing the selected directory.

## §2 Update

### §2.1 Update replaces only recognized Semantic Claims skills

**Given** the selected directory contains at least one of the four Semantic Claims skills or the legacy `semantic-claims` skill,
**When** update runs,
**Then** all four skills exactly match the packaged skills, any legacy skill is removed, and other entries in the selected directory remain unchanged.

Update fails without changing the selected directory if none of the managed entries exists or any existing managed entry does not identify itself with its expected skill name.

## §3 Removal

### §3.1 Removal deletes only recognized Semantic Claims skills

**Given** the selected directory contains at least one of the four Semantic Claims skills or the legacy `semantic-claims` skill,
**When** removal runs,
**Then** those skills are absent and other entries in the selected directory remain unchanged.

Removal fails without changing the selected directory if none of the managed entries exists or any existing managed entry does not identify itself with its expected skill name.
