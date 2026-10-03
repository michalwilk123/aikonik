import { DefaultNav } from "@payloadcms/next/rsc";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps, ServerProps } from "payload";
import {
  formatSubmissionDate,
  inboxURL,
  submissionInboxes,
  submissionStatuses,
} from "@/infrastructure/cms/workflow";

export function StaffNav(props: ServerProps) {
  return (
    <DefaultNav
      {...props}
      visibleEntities={
        props.user?.role === "cms"
          ? { collections: [], globals: [] }
          : props.visibleEntities
      }
    />
  );
}

export function StaffInboxLinks({ user }: ServerProps) {
  if (!user || !["cms", "admin"].includes(user.role)) return null;
  return (
    <nav className="staff-inbox-nav" aria-label="Skrzynki zgłoszeń">
      <Link href="/admin">Pulpit pracownika</Link>
      {submissionInboxes.map((inbox) => (
        <Link
          key={inbox.source}
          href={inboxURL({ source: { equals: inbox.source } })}
        >
          <span aria-hidden="true">{inbox.icon}</span> {inbox.label}
        </Link>
      ))}
    </nav>
  );
}

export async function StaffDashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  if (!req.user || !["cms", "admin"].includes(req.user.role)) return null;
  const { payload } = req;
  const [inboxes, recent, assigned] = await Promise.all([
    Promise.all(
      submissionInboxes.map(async (inbox) => {
        const [total, fresh] = await Promise.all([
          payload.count({
            collection: "submissions",
            where: { source: { equals: inbox.source } },
            req,
            overrideAccess: false,
          }),
          payload.count({
            collection: "submissions",
            where: {
              and: [
                { source: { equals: inbox.source } },
                { status: { equals: "new" } },
              ],
            },
            req,
            overrideAccess: false,
          }),
        ]);
        return { ...inbox, total: total.totalDocs, fresh: fresh.totalDocs };
      }),
    ),
    payload.find({
      collection: "submissions",
      sort: "-submittedAt",
      limit: 8,
      depth: 1,
      req,
      overrideAccess: false,
    }),
    payload.count({
      collection: "submissions",
      where: {
        and: [
          { assignedTo: { equals: req.user.id } },
          { status: { not_in: ["completed", "rejected"] } },
        ],
      },
      req,
      overrideAccess: false,
    }),
  ]);
  return (
    <Gutter className="staff-dashboard">
      <div className="staff-dashboard-heading">
        <div>
          <p className="staff-eyebrow">PANEL PRACOWNIKA · ROPS KRAKÓW</p>
          <h1>Sprawy mieszkańców</h1>
          <p>
            Przejrzyj zgłoszenia, przypisz osobę prowadzącą i zadbaj o kolejny
            krok.
          </p>
        </div>
        <Link
          className="staff-my-cases"
          href={inboxURL({
            and: [
              { assignedTo: { equals: req.user.id } },
              { status: { not_in: ["completed", "rejected"] } },
            ],
          })}
        >
          Moje otwarte sprawy <strong>{assigned.totalDocs}</strong>
        </Link>
      </div>
      <div className="staff-inbox-grid">
        {inboxes.map((inbox) => (
          <Link
            className={`staff-inbox-card staff-inbox-card--${inbox.color}`}
            key={inbox.source}
            href={inboxURL({ source: { equals: inbox.source } })}
          >
            <span className="staff-inbox-icon" aria-hidden="true">
              {inbox.icon}
            </span>
            <span className="staff-inbox-count">Nowe: {inbox.fresh}</span>
            <h2>{inbox.label}</h2>
            <p>{inbox.description}</p>
            <span className="staff-inbox-footer">
              Wszystkie: {inbox.total}{" "}
              <span aria-hidden="true">Otwórz skrzynkę →</span>
            </span>
          </Link>
        ))}
      </div>
      <section className="staff-recent" aria-labelledby="staff-recent-title">
        <div className="staff-section-heading">
          <h2 id="staff-recent-title">Ostatnie zgłoszenia</h2>
          <Link href="/admin/collections/submissions">Zobacz wszystkie →</Link>
        </div>
        {recent.docs.length === 0 ? (
          <div className="staff-empty">
            <h3>Skrzynki są na razie puste</h3>
            <p>
              Wysłane formularze kontaktowe, pomysły i zgłoszenia do testowania
              pojawią się tutaj.
            </p>
          </div>
        ) : (
          <div className="staff-table-scroll">
            <table className="staff-cases-table">
              <thead>
                <tr>
                  <th>Sprawa</th>
                  <th>Status</th>
                  <th>Osoba prowadząca</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recent.docs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <Link
                        href={`/admin/collections/submissions/${encodeURIComponent(doc.id)}`}
                      >
                        {doc.subject}
                      </Link>
                      <small>
                        {
                          submissionInboxes.find(
                            (inbox) => inbox.source === doc.source,
                          )?.label
                        }{" "}
                        · {doc.name}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`staff-status staff-status--${doc.status}`}
                      >
                        {
                          submissionStatuses.find(
                            (status) => status.value === doc.status,
                          )?.label
                        }
                      </span>
                    </td>
                    <td>
                      {typeof doc.assignedTo === "object" && doc.assignedTo
                        ? doc.assignedTo.name
                        : "Nieprzypisana"}
                    </td>
                    <td>{formatSubmissionDate(doc.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Gutter>
  );
}
