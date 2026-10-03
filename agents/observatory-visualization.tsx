"use client";

import { useState } from "react";
import type { ObservatoryVisualization } from "@/domain/observatory";
import {
  COUNTY_PATHS,
  COUNTY_VIEW_BOX,
} from "@/infrastructure/observatory/geometry";

const shades = ["#e1eef7", "#a9cde4", "#6aa8ce", "#357eaf", "#165780"];
const numberFormat = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 3,
});

export function ObservatoryVisualizationCard({
  visualization,
}: {
  visualization: ObservatoryVisualization;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { points, title, year, unit, kind, sourceUrl } = visualization;
  const values = points.flatMap((point) =>
    point.value === null ? [] : [point.value],
  );
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 0;
  const axisMinimum = Math.min(0, minimum);
  const axisMaximum = Math.max(0, maximum);
  const axisRange = axisMaximum - axisMinimum || 1;
  const zeroPosition = (-axisMinimum / axisRange) * 100;
  const activePoint = points.find(
    (point) => point.id === (hoveredId ?? selectedId),
  );
  const formatValue = (value: number | null) =>
    value === null
      ? "Brak danych"
      : `${numberFormat.format(value)}${unit ? ` ${unit}` : ""}`;
  const colorFor = (value: number | null) => {
    if (value === null) return "#e5e7eb";
    const position =
      maximum === minimum
        ? 2
        : Math.floor(((value - minimum) / (maximum - minimum)) * shades.length);
    return shades[Math.min(position, shades.length - 1)];
  };
  // City counties must sit above the counties that surround them.
  const mapPoints = [...points].sort(
    (a, b) =>
      Number(["POW_8", "POW_9", "POW_10"].includes(a.id)) -
      Number(["POW_8", "POW_9", "POW_10"].includes(b.id)),
  );

  return (
    <figure className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-outline-variant bg-white p-4 sm:p-5">
      <figcaption>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Małopolska · {year}
          {unit ? ` · ${unit}` : ""}
        </p>
      </figcaption>

      {kind === "map" ? (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: SVG groups cannot be replaced with HTML fieldsets. */}
          <svg
            viewBox={COUNTY_VIEW_BOX}
            width={482}
            height={429}
            preserveAspectRatio="xMidYMid meet"
            className="mx-auto mt-4 block h-auto w-full max-w-md"
            role="group"
            aria-label={`Mapa: ${title}, ${year}. Wybierz powiat, aby poznać wartość.`}
          >
            {mapPoints.map((point) => (
              // biome-ignore lint/a11y/useSemanticElements: SVG paths need button semantics for keyboard access.
              <path
                key={point.id}
                d={point.path ?? COUNTY_PATHS[point.id]}
                fill={colorFor(point.value)}
                stroke={activePoint?.id === point.id ? "#111827" : "#ffffff"}
                strokeWidth={activePoint?.id === point.id ? 3 : 1.5}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                aria-label={`${point.label}: ${formatValue(point.value)}`}
                aria-pressed={selectedId === point.id}
                className="cursor-pointer transition-colors focus:outline-none focus:stroke-gray-900 focus:stroke-[3px]"
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch") setHoveredId(point.id);
                }}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(point.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => setSelectedId(point.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(point.id);
                  }
                }}
              >
                <title>{`${point.label}: ${formatValue(point.value)}`}</title>
              </path>
            ))}
          </svg>
          <div className="mx-auto mt-3 max-w-sm text-xs text-on-surface-variant">
            <div
              className="h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${shades.join(", ")})`,
              }}
              aria-hidden="true"
            />
            <div className="mt-1 flex justify-between gap-3">
              <span>{formatValue(values.length ? minimum : null)}</span>
              <span>{formatValue(values.length ? maximum : null)}</span>
            </div>
            {points.some((point) => point.value === null) && (
              <p className="mt-2 flex items-center gap-2">
                <span
                  className="size-3 rounded-sm bg-gray-200"
                  aria-hidden="true"
                />
                Brak danych
              </p>
            )}
          </div>
          <label className="mx-auto mt-4 block max-w-sm text-sm text-foreground sm:hidden">
            Wybierz powiat
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-outline-variant bg-white px-3 py-2"
              value={selectedId ?? ""}
              onChange={(event) => {
                setHoveredId(null);
                setSelectedId(event.target.value || null);
              }}
            >
              <option value="">Wybierz obszar…</option>
              {points.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.label}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <fieldset
          className="mt-4 max-h-[520px] space-y-1 overflow-y-auto pr-1"
          aria-label={`Wykres słupkowy: ${title}, ${year}`}
        >
          {points.map((point) => {
            const endpoint =
              point.value === null
                ? zeroPosition
                : ((point.value - axisMinimum) / axisRange) * 100;
            return (
              <button
                key={point.id}
                type="button"
                className={`grid w-full grid-cols-[minmax(90px,1fr)_2fr] items-center gap-3 rounded-lg px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 sm:grid-cols-[minmax(130px,1fr)_2fr] ${activePoint?.id === point.id ? "bg-sky-50" : "hover:bg-gray-50"}`}
                aria-label={`${point.label}: ${formatValue(point.value)}`}
                aria-pressed={selectedId === point.id}
                onClick={() => setSelectedId(point.id)}
                onMouseEnter={() => setHoveredId(point.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(point.id)}
                onBlur={() => setHoveredId(null)}
              >
                <span className="text-xs leading-4 text-foreground">
                  {point.label}
                </span>
                <span className="min-w-0">
                  <span
                    className="relative block h-4 rounded-sm bg-gray-100"
                    aria-hidden="true"
                  >
                    <span
                      className="absolute inset-y-0 w-px bg-gray-400"
                      style={{ left: `${zeroPosition}%` }}
                    />
                    {point.value !== null && (
                      <span
                        className="absolute inset-y-0 rounded-sm bg-sky-700"
                        style={{
                          left: `${Math.min(zeroPosition, endpoint)}%`,
                          width: `${Math.abs(endpoint - zeroPosition)}%`,
                        }}
                      />
                    )}
                  </span>
                  <span className="mt-1 block text-xs tabular-nums text-on-surface-variant">
                    {formatValue(point.value)}
                  </span>
                </span>
              </button>
            );
          })}
        </fieldset>
      )}

      <p
        className="mt-4 min-h-10 rounded-lg bg-gray-50 px-3 py-2 text-sm text-foreground"
        role="status"
        aria-live="polite"
      >
        {activePoint ? (
          <>
            <strong>{activePoint.label}</strong>:{" "}
            {formatValue(activePoint.value)}
          </>
        ) : (
          "Wskaż lub wybierz obszar, aby zobaczyć jego wartość."
        )}
      </p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-on-surface-variant underline underline-offset-2"
      >
        Źródło: Internetowy Obserwator Statystyk Społecznych · ROPS (nowa karta)
      </a>
    </figure>
  );
}
