import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SUBJECTS = [
  {
    path: "src/auth/session",
    title: "User Session",
    invariants: [
      [
        "Accepted identity",
        [
          [
            "Accepted sessions expose their verified identity",
            "An accepted session exposes the identity established by its successful authentication.",
          ],
          [
            "Expired sessions reject protected work",
            "An expired session rejects protected work without extending its lifetime.",
          ],
        ],
      ],
      [
        "Isolation",
        [
          [
            "Session state remains isolated by browser context",
            "Changing one browser context's session leaves every other browser context unchanged.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Renewal",
        [
          [
            "Renewal preserves the active identity",
            "After an accepted session renews, it continues to expose the same verified identity.",
          ],
          [
            "Revocation wins over pending renewal",
            "After revocation begins, completing an earlier renewal cannot restore the session.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/search/result-publication",
    title: "Published Search Results",
    scenarios: [
      [
        "Precedence",
        [
          [
            "Newer searches supersede older results",
            "After a newer search begins, completing an older search leaves the published result unchanged.",
          ],
          [
            "The current search can publish its result",
            "After a search begins, its successful completion publishes its result while it remains current.",
          ],
        ],
      ],
      [
        "Failure",
        [
          [
            "An older failure does not replace newer results",
            "After a newer search publishes a result, failure of an older search leaves that result visible.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/editor/history",
    title: "Document History",
    invariants: [
      [
        "Recorded changes",
        [
          [
            "Undo restores the preceding document state",
            "Undo restores the complete document state that preceded the latest recorded change.",
          ],
          [
            "A new edit clears the redo path",
            "Recording a new edit after undo removes the abandoned redo path.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Concurrent input",
        [
          [
            "Remote changes retain local undo meaning",
            "After a remote change arrives, undoing a local edit reverses that local edit without removing the remote change.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/cache/entries",
    title: "Cached Entries",
    invariants: [
      [
        "Freshness",
        [
          [
            "Fresh entries return their accepted value",
            "A fresh entry returns its accepted value without requesting another copy.",
          ],
          [
            "Expired entries are not presented as fresh",
            "An expired entry is never presented to callers as a fresh value.",
          ],
        ],
      ],
      [
        "Rejection",
        [
          [
            "Rejected updates preserve the accepted entry",
            "Rejecting an update leaves the previously accepted entry unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/notifications/delivery",
    title: "Notification Delivery",
    scenarios: [
      [
        "Retries",
        [
          [
            "A retry does not duplicate an accepted delivery",
            "After a notification is accepted by its destination, retrying the same delivery does not create another notification.",
          ],
          [
            "Retry delay grows after consecutive failures",
            "After consecutive delivery failures, each retry waits longer than the preceding retry until delivery succeeds.",
            12,
          ],
        ],
      ],
      [
        "Cancellation",
        [
          [
            "Cancellation prevents pending delivery",
            "After a pending notification is cancelled, later completion of its scheduled work does not deliver it.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/billing/invoice",
    title: "Invoice Totals",
    invariants: [
      [
        "Amounts",
        [
          [
            "The total equals accepted lines plus tax",
            "An invoice total equals the sum of its accepted line amounts and applicable tax.",
          ],
          [
            "Rejected lines leave the total unchanged",
            "Rejecting an invoice line leaves the accepted lines and total unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/workspaces/membership",
    title: "Workspace Membership",
    invariants: [
      [
        "Authority",
        [
          [
            "Members receive only their assigned capabilities",
            "A workspace member receives exactly the capabilities assigned through active roles.",
          ],
          [
            "Removing the final role removes workspace access",
            "A member without an active role has no access to the workspace.",
          ],
        ],
      ],
    ],
    scenarios: [
      [
        "Removal",
        [
          [
            "Removal invalidates an already-open workspace",
            "After membership is removed, the next protected action in an already-open workspace is rejected.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/synchronization/remote-document-reconciliation",
    title: "Remote Document Reconciliation",
    scenarios: [
      [
        "Offline work",
        [
          [
            "Locally accepted edits survive reconnection",
            "After reconnection, locally accepted edits remain present while remote edits are incorporated.",
          ],
          [
            "Repeated remote delivery has one observable effect",
            "After a remote change is incorporated, receiving the same change again leaves the document unchanged.",
          ],
        ],
      ],
    ],
  },
  {
    path: "src/checkout/--payment-order-consistency",
    title: "Payment and Order Consistency",
    scenarios: [
      [
        "Compensation",
        [
          [
            "Failed order creation releases payment first",
            "After payment authorization succeeds, failed order creation releases the authorization before checkout reports failure.",
          ],
          [
            "Confirmed orders retain their payment authorization",
            "After order creation succeeds, checkout confirms the order without releasing its payment authorization.",
          ],
        ],
      ],
    ],
  },
  {
    path: "configuration",
    title: "Runtime Configuration",
    invariants: [
      [
        "Validation",
        [
          [
            "Missing required values identify every absent key",
            "Rejected configuration identifies every required key that has no value.",
          ],
          [
            "Accepted configuration exposes normalized values",
            "Accepted configuration exposes each value in its documented normalized form.",
          ],
        ],
      ],
    ],
  },
];

function claimDocument(title, kind, sections) {
  const label = kind === "invariants" ? "Invariants" : "Scenarios";
  return `# ${title} ${label}\n\n${sections
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
      await writeFile(claimPath, claimDocument(subject.title, kind, sections));
      await writeFile(proofPath, proofFile(sections));
    }
  }
  return root;
}
