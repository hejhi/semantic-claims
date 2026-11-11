import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SUBJECTS = [
  {
    path: "src/auth/session",
    title: "Session",
    scenarios: [
      [
        "Accepted identity",
        [
          [
            "Accepted sessions expose their verified identity",
            "WHILE the session is accepted, WHEN the session's identity is requested, the session SHALL provide the session's verified identity.",
          ],
          [
            "Expired sessions reject protected work",
            "WHILE the session is expired, WHEN the session is checked for permission to perform protected work, the session SHALL deny the permission.",
          ],
        ],
      ],
      [
        "Isolation",
        [
          [
            "Session state remains isolated by browser context",
            "WHEN sessions are requested for different browser contexts, the session SHALL provide a distinct session for each browser context.",
          ],
        ],
      ],
      [
        "Renewal",
        [
          [
            "Renewal preserves the active identity",
            "WHEN the identity of an accepted session is requested after the session renews, the session SHALL provide the verified identity from before the renewal.",
          ],
          [
            "Revocation wins over pending renewal",
            "WHEN an earlier renewal completes after revocation begins, the session SHALL remain revoked.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/search/result-publication",
    title: "Search",
    scenarios: [
      [
        "Precedence",
        [
          [
            "Newer searches supersede older results",
            "WHEN an older search completes after a newer search begins, the search SHALL leave the published result unchanged.",
          ],
          [
            "The current search can publish its result",
            "WHEN the current search completes successfully, the search SHALL publish the current search's result.",
          ],
        ],
      ],
      [
        "Failure",
        [
          [
            "An older failure does not replace newer results",
            "WHEN an older search fails after a newer search publishes a result, the search SHALL leave that result visible.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/editor/history",
    title: "History",
    scenarios: [
      [
        "Recorded changes",
        [
          [
            "Each undo restores a whole document",
            "WHEN an undo is requested, the history SHALL restore the whole document as the document was before the latest edit.",
          ],
          [
            "Undoing an edit enables redo",
            "WHEN an edit is undone, the history SHALL offer a redo of the edit.",
          ],
        ],
      ],
      [
        "Concurrent input",
        [
          [
            "Remote changes retain local undo meaning",
            "WHEN a local edit is undone after a remote change arrives, the history SHALL produce a document that contains the remote change and excludes that local edit.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/cache/entries",
    title: "Cache",
    scenarios: [
      [
        "Freshness",
        [
          [
            "Fresh entries are served",
            "WHEN a fresh entry is requested, the cache SHALL serve the entry.",
          ],
          [
            "Expired entries are reported as stale",
            "WHEN an expired entry is checked for freshness, the cache SHALL report the entry as stale.",
          ],
        ],
      ],
      [
        "Rejection",
        [
          [
            "Served entries are each valid",
            "WHEN the cache's entries are requested, the cache SHALL serve entries that are each valid.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/notifications/delivery",
    title: "Notifier",
    scenarios: [
      [
        "Retries",
        [
          [
            "A retry does not duplicate an accepted delivery",
            "WHEN a delivery that the delivery's destination accepted is retried, the notifier SHALL leave the number of notifications unchanged.",
          ],
          [
            "Retry delay grows after consecutive failures",
            "WHEN a delivery fails after an earlier failed delivery, the notifier SHALL wait longer before the next retry than before the preceding retry.",
            12,
          ],
        ],
      ],
      [
        "Cancellation",
        [
          [
            "Cancellation prevents pending delivery",
            "WHEN the scheduled work of a cancelled notification completes, the notifier SHALL leave the notification undelivered.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/billing/invoice",
    title: "Invoice",
    invariants: [
      [
        "Amounts",
        [
          [
            "The total equals accepted lines plus tax",
            "The invoice SHALL show a total equal to the sum of the invoice's accepted line amounts and applicable tax.",
          ],
          [
            "Every accepted line has a positive amount",
            "The invoice SHALL list lines that each have a positive amount.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/workspaces/membership",
    title: "Workspace",
    scenarios: [
      [
        "Authority",
        [
          [
            "Members receive only their assigned capabilities",
            "WHEN a member's capabilities are checked, the workspace SHALL grant exactly the capabilities assigned through the member's active roles.",
          ],
          [
            "Removing the final role removes workspace access",
            "WHEN a member with zero roles requests access, the workspace SHALL deny the member access.",
          ],
        ],
      ],
      [
        "Removal",
        [
          [
            "Removal invalidates an already-open workspace",
            "WHEN a removed member performs a protected action in an already-open workspace, the workspace SHALL leave the workspace unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/synchronization/remote-document-reconciliation",
    title: "Document",
    scenarios: [
      [
        "Offline work",
        [
          [
            "Locally accepted edits survive reconnection",
            "WHEN the client reconnects, the document SHALL contain both the locally accepted edits and the remote edits.",
          ],
          [
            "Repeated remote delivery has one observable effect",
            "WHEN a remote change that the document already incorporated arrives again, the document SHALL remain unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/search/--search-submission",
    title: "Search Results",
    scenarios: [
      [
        "Submitted filters",
        [
          [
            "Shown results match the submitted filter",
            "WHEN a filter is submitted, the search results SHALL show exactly the results that match the submitted filter.",
          ],
          [
            "Clearing the filter shows every result",
            "WHEN the filter is cleared, the search results SHALL show every result.",
          ],
        ],
      ],
    ],
  },
  {
    path: "configuration",
    title: "Configuration",
    scenarios: [
      [
        "Validation",
        [
          [
            "Missing required settings are listed",
            "WHILE the configuration is rejected, WHEN the missing settings are requested, the configuration SHALL list exactly the required settings that are unset.",
          ],
          [
            "Accepted configuration serves normalized settings",
            "WHILE the configuration is accepted, WHEN a setting is requested, the configuration SHALL provide the setting in the setting's documented normalized form.",
          ],
        ],
      ],
    ],
  },
];

function claimDocument(title, sections) {
  return `# ${title}\n\n${sections
    .map(
      ([sectionTitle, claims], sectionIndex) =>
        `## §${sectionIndex + 1} ${sectionTitle}\n\n${claims
          .map(
            ([claimTitle, statement], claimIndex) =>
              `### §${sectionIndex + 1}.${claimIndex + 1} ${claimTitle}\n\n${statement}\n`,
          )
          .join("\n")}`,
    )
    .join("\n")}\n`;
}

function proofFile(sections) {
  return `${sections
    .map(
      ([sectionTitle, claims], sectionIndex) =>
        `describe('§${sectionIndex + 1} ${sectionTitle}', () => {\n${claims
          .map(([claimTitle, , proofCount = 1], claimIndex) =>
            Array.from(
              { length: proofCount },
              () => `  test('§${sectionIndex + 1}.${claimIndex + 1} ${claimTitle}', () => {});`,
            ).join("\n"),
          )
          .join("\n")}\n});`,
    )
    .join("\n\n")}\n`;
}

export async function writeMockRepository() {
  const root = await mkdtemp(path.join(tmpdir(), "semantic-explorer-preview-"));
  for (const subject of SUBJECTS) {
    for (const kind of ["invariants", "scenarios"]) {
      const sections = subject[kind];
      if (!sections) continue;
      const claimPath = path.join(root, `${subject.path}.${kind}.md`);
      const proofPath = path.join(root, `${subject.path}.${kind}.test.ts`);
      await mkdir(path.dirname(claimPath), { recursive: true });
      await writeFile(claimPath, claimDocument(subject.title, sections));
      await writeFile(proofPath, proofFile(sections));
    }
  }
  return root;
}
