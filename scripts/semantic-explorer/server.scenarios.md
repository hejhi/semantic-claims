# Explorer

A project is *valid* if the checker, run in the project with no arguments, reports success.

## §1 Local read-only operation

### §1.2 Exploring leaves the repository unchanged

WHEN the explorer stops after the explorer has started and served requests, the explorer SHALL leave each file of the explored repository as the file was before the explorer started.

### §1.3 The explorer prints its local URL

WHEN the explorer is started in a valid project, the explorer SHALL write the explorer's local URL on the first line of the explorer's output.
