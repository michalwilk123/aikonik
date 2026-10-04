import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { buildConfig, getPayload, type Payload } from "payload";
import catalog from "@/data/rops/catalog.json";
import { makeInnovationTools } from "@/infrastructure/chat/innovation-tools";
import { innovations } from "@/infrastructure/cms/innovations";
import {
  getInnovationVideos,
  resolveInnovationSources,
} from "@/infrastructure/innovations/source";
import { listInnovations } from "@/infrastructure/innovations/store";
import type { User } from "@/payload-types";
import { testDatabase } from "@/tests/helpers/d1";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
let payload: Payload;
let db: D1Database;
const worker = { id: 1, role: "cms" } as User;
const colleague = { id: 2, role: "cms" } as User;
const admin = { id: 3, role: "admin" } as User;

before(async () => {
  fixture = await testDatabase();
  db = fixture.db as unknown as D1Database;
  payload = await getPayload({
    config: buildConfig({
      secret: "innovation-library-integration-secret",
      collections: [innovations],
      db: sqliteD1Adapter({ binding: db, push: false }),
    }),
  });
});
after(async () => {
  await payload?.destroy();
  await fixture?.dispose();
});

test("migration imports every innovation and preserves descriptions, categories, videos and PDF pages", async () => {
  const library = await listInnovations(db);
  assert.equal(library.length, catalog.projects.length);
  for (const original of catalog.projects) {
    const saved = library.find((entry) => entry.id === original.id);
    assert.ok(saved);
    assert.equal(saved.title, original.title);
    assert.equal(saved.description, original.description);
    assert.deepEqual(saved.categories, original.categories);
    assert.deepEqual(saved.videos, original.videos);
    assert.deepEqual(
      saved.pdfs,
      original.pdfs.map((pdf) => ({
        url: pdf.url,
        pages: "pages" in pdf ? pdf.pages : [],
      })),
    );
  }
});

test("workers and admins edit the same global library and assistants read the saved changes", async () => {
  const id = "bawita";
  const original = await payload.findByID({
    collection: "innovations",
    id,
    user: worker,
    overrideAccess: false,
  });
  for (const user of [worker, colleague, admin]) {
    const title = `Wspólna innowacja ${user.id}`;
    await payload.update({
      collection: "innovations",
      id,
      user,
      overrideAccess: false,
      data: {
        title,
        description: "Unikalny opis biblioteki: sąsiedzkie spotkania rodzin.",
        categories: ["Dla dzieci, młodzieży i rodziny"],
        videos: [{ url: "https://www.youtube.com/watch?v=o7UhDlebLJo" }],
        materials: [{ url: "https://example.com/material" }],
        licenses: [{ url: "https://creativecommons.org/licenses/by/4.0/" }],
      },
    });
    const shared = await payload.findByID({
      collection: "innovations",
      id,
      user: colleague,
      overrideAccess: false,
    });
    assert.equal(shared.title, title);
    assert.deepEqual(shared.pdfs, original.pdfs);
    const load = () => listInnovations(db);
    const tools = makeInnovationTools(() => {}, load);
    const options = { toolCallId: "integration", messages: [], context: {} };
    const result = await tools.search_innovations.execute?.(
      { query: title, limit: 1 },
      options,
    );
    assert.ok(result && "candidates" in result);
    assert.equal(result.candidates[0]?.title, title);
    const sources = await resolveInnovationSources(
      [`innovation:${id}:page`],
      load,
    );
    assert.equal(sources[0]?.title, title);
    assert.match(sources[0]?.excerpt ?? "", /Unikalny opis/);
    assert.equal((await getInnovationVideos(sources, load))[0]?.title, title);
  }
});

test("anonymous users cannot read or edit; PDF evidence and original IDs cannot be changed by staff", async () => {
  await assert.rejects(
    payload.find({ collection: "innovations", overrideAccess: false }),
  );
  await assert.rejects(
    payload.update({
      collection: "innovations",
      id: "bawita",
      overrideAccess: false,
      data: { title: "Anonymous edit" },
    }),
  );
  for (const user of [worker, admin]) {
    const original = await payload.findByID({
      collection: "innovations",
      id: "bawita",
    });
    await payload.update({
      collection: "innovations",
      id: "bawita",
      user,
      overrideAccess: false,
      data: { pdfs: [], id: "different-id" },
    });
    const saved = await payload.findByID({
      collection: "innovations",
      id: "bawita",
    });
    assert.deepEqual(saved.pdfs, original.pdfs);
    await assert.rejects(
      payload.delete({
        collection: "innovations",
        id: "bawita",
        user,
        overrideAccess: false,
      }),
    );
    await assert.rejects(
      payload.update({
        collection: "innovations",
        id: "bawita",
        user,
        overrideAccess: false,
        data: { url: "javascript:alert(1)" },
      }),
    );
  }
});
