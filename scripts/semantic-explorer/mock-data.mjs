import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SUBJECTS = [
  {
    path: "src/auth/session",
    title: "Session",
    invariants: [
      [
        "Identity",
        [
          [
            "An accepted session provides its verified identity",
            "WHILE accepted, the session SHALL provide the session's verified identity.",
          ],
          [
            "Session state is separate for each browser context",
            "The session SHALL keep the session state of each browser context separate from the session state of every other browser context.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Protected work",
        [
          [
            "An expired session denies protected work",
            "WHILE expired, WHEN protected work is attempted, the session SHALL deny the work.",
          ],
        ],
      ],
      [
        "Renewal",
        [
          [
            "Renewal retains the verified identity",
            "WHEN an accepted session is renewed, the session SHALL retain the verified identity from before the renewal.",
          ],
          [
            "A renewal after revocation leaves the session revoked",
            "WHEN a renewal completes after the session is revoked, the session SHALL leave the session revoked.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/search/result-publication",
    title: "Search",
    invariants: [
      [
        "Published results",
        [
          [
            "A search in progress shows the latest published result",
            "WHILE a search is in progress, the search SHALL show the latest published result.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Precedence",
        [
          [
            "A superseded search leaves the published result unchanged",
            "WHEN an older search completes after a newer search begins, the search SHALL leave the published result unchanged.",
          ],
          [
            "The current search publishes its result",
            "WHEN the current search completes successfully, the search SHALL publish the current search's result.",
          ],
        ],
      ],
      [
        "Failure",
        [
          [
            "An older failure leaves the newer result published",
            "IF an older search fails after a newer search publishes a result, THEN the search SHALL leave that result published.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/editor/history",
    title: "History",
    invariants: [
      [
        "Undo count",
        [
          [
            "The history shows the number of edits to undo",
            "The history SHALL show the number of edits available to undo.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Undo",
        [
          [
            "Each undo restores a whole document",
            "WHEN an undo is requested, the history SHALL restore the whole document as the document was before the latest edit.",
          ],
        ],
      ],
      [
        "Concurrent input",
        [
          [
            "An undo after a remote change retains the remote change",
            "WHEN a local edit is undone after a remote change arrives, the history SHALL produce a document that contains the remote change and excludes that local edit.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/cache/entries",
    title: "Cache",
    invariants: [
      [
        "Validity",
        [
          [
            "Each stored entry is valid",
            "The cache SHALL contain entries that are each valid.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Freshness",
        [
          [
            "A fresh entry is served",
            "WHEN a fresh entry is requested, the cache SHALL serve the entry.",
          ],
          [
            "An expired entry is reported as a miss",
            "WHEN an entry whose age is at least the entry's time to live is requested, the cache SHALL report a miss.",
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
            "A retry of an accepted delivery leaves the notification count unchanged",
            "WHEN a delivery that the delivery's destination accepted is retried, the notifier SHALL leave the number of notifications unchanged.",
          ],
          [
            "Retry delay grows after consecutive failures",
            "IF a delivery fails after an earlier failed delivery, THEN the notifier SHALL wait longer before the next retry than before the preceding retry.",
            12,
          ],
        ],
      ],
      [
        "Cancellation",
        [
          [
            "A cancelled notification remains undelivered",
            "WHEN the scheduled delivery of a cancelled notification is due, the notifier SHALL leave the notification undelivered.",
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
            "The invoice SHALL show a total equal to the sum of the invoice's accepted line amounts and the invoice's tax.",
          ],
          [
            "Each listed line has a positive amount",
            "The invoice SHALL list lines that each have a positive amount.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/workspaces/membership",
    title: "Workspace",
    invariants: [
      [
        "Authority",
        [
          [
            "Members receive exactly their assigned capabilities",
            "The workspace SHALL grant each member exactly the capabilities of the member's active roles.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Access",
        [
          [
            "A member with zero roles is denied access",
            "WHEN a member with zero roles opens the workspace, the workspace SHALL deny the member access.",
          ],
        ],
      ],
      [
        "Removal",
        [
          [
            "An action of a removed member leaves the workspace unchanged",
            "WHEN a removed member attempts a protected action in an open workspace, the workspace SHALL leave the workspace unchanged.",
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
            "Reconnection combines local and remote edits",
            "WHEN the client reconnects, the document SHALL contain both the locally accepted edits and the remote edits.",
          ],
          [
            "A repeated remote change leaves the document unchanged",
            "WHEN a remote change that the document already incorporated arrives again, the document SHALL remain unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/search/--filtered-search",
    title: "Search Results",
    invariants: [
      [
        "Applied filters",
        [
          [
            "Shown results match the applied filter",
            "WHILE a filter is applied, the search results SHALL show exactly the results that match the filter.",
          ],
          [
            "Every result is shown with zero filters applied",
            "WHILE zero filters are applied, the search results SHALL show every result.",
          ],
        ],
      ],
    ],
  },
  {
    path: "configuration",
    title: "Configuration",
    invariants: [
      [
        "Normalization",
        [
          [
            "An accepted configuration provides normalized settings",
            "WHILE accepted, the configuration SHALL provide each setting in the setting's documented normalized form.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Validation",
        [
          [
            "Missing required settings are listed",
            "WHILE rejected, WHEN the missing settings are requested, the configuration SHALL list exactly the required settings that are unset.",
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
