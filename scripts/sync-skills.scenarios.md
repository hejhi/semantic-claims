# Skill Synchronization

The *method documents* are the reference, the examples, the JavaScript conventions, and the ambiguity checklist in the repository root. The *reference* is the method document of claim rules, and the *referenced documents* are the other method documents. The *skill file* is the skill's main instruction file. The *marker* is the line in the skill file that states that the text after it is generated from the reference.

A link target relative to the repository root is *converted* as follows: a target in the reference becomes the same target in the skill file, and a target in a referenced document becomes the same target in the skill's references directory, each as a path relative to the generated file, or as the anchor alone for a target in the generated file itself. Every other such target becomes the target's address in the repository's main branch on GitHub.

## §1 Generated skill files

### §1.1 Generated method references match the method documents

WHEN skill synchronization is run, the skill synchronization SHALL leave the references directory of the skill containing exactly a copy of each referenced document, with every link target converted.

### §1.2 The skill contains the reference after the marker

WHEN skill synchronization is run, the skill synchronization SHALL leave the skill file containing the earlier text of the skill file through the marker, followed by a blank line and the content of the reference without the reference's first heading line and the blank lines after that heading line, with every link target converted.
