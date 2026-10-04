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
      <Link href="/admin/collections/innovations">Innowacje społeczne</Link>
      <Link href={`/admin/collections/users/${user.id}`}>Moje ustawienia</Link>
      <Link href={inboxURL({ assignedTo: { equals: user.id } })}>
        Moje rozmowy
      </Link>
      {user.role === "admin" && (
        <>
          <Link href="/admin/collections/submissions">Wszystkie rozmowy</Link>
          <Link href={inboxURL({ assignedTo: { exists: false } })}>
            Przypisz klienta do pracownika
          </Link>
        </>
      )}
      {submissionInboxes.map((inbox) => (
        <Link
          key={inbox.source}
          href={inboxURL({ source: { equals: inbox.source } })}
        >
          {inbox.label}
        </Link>
      ))}
    </nav>
  );
}

export async function StaffDashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  if (!req.user || !["cms", "admin"].includes(req.user.role)) return null;
  const { payload } = req;
  const [inboxes, recent] = await Promise.all([
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
  ]);
  return (
    <Gutter className="staff-dashboard">
      <h1>
        {req.user.role === "admin" ? "Wszystkie rozmowy" : "Moje rozmowy"}
      </h1>
      <p>
        <Link href="/admin/collections/innovations">Innowacje społeczne</Link>
        {" — wspólna biblioteka wiedzy do edycji przez zespół."}
      </p>
      {req.user.role === "admin" && (
        <p>
          Nowe sprawy czekają na przypisanie osoby prowadzącej.{" "}
          <Link href={inboxURL({ assignedTo: { exists: false } })}>
            Przypisz klienta do pracownika
          </Link>
        </p>
      )}
      <div className="staff-inbox-grid">
        {inboxes.map((inbox) => (
          <Link
            className={`staff-inbox-card staff-inbox-card--${inbox.color}`}
            key={inbox.source}
            href={inboxURL({ source: { equals: inbox.source } })}
          >
            <span className="staff-inbox-count">{inbox.fresh}</span>
            <span className="staff-inbox-label">
              <strong>{inbox.label}</strong>
              <small>nowe z {inbox.total}</small>
            </span>
          </Link>
        ))}
      </div>
      <section className="staff-recent" aria-labelledby="staff-recent-title">
        <div className="staff-section-heading">
          <h2 id="staff-recent-title">Ostatnie zgłoszenia</h2>
          <Link href="/admin/collections/submissions">
            {req.user.role === "admin" ? "Wszystkie rozmowy" : "Moje rozmowy"}
          </Link>
        </div>
        {recent.docs.length === 0 ? (
          <div className="staff-empty">
            <h3>Skrzynki są na razie puste</h3>
            <p>
              {req.user.role === "admin"
                ? "Wnioski grantowe i zgłoszenia mieszkańców pojawią się tutaj."
                : "Rozmowy pojawią się tutaj, gdy administrator przypisze Ci sprawę."}
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
