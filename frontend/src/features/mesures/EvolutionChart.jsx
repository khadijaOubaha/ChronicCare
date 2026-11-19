
export default function EvolutionChart({
  points = [],
  label = "Évolution",
  unit = "",
}) {
  const validPoints = points
    .map((point) => ({
      ...point,
      v1: Number(point.v1),
      v2: point.v2 != null ? Number(point.v2) : null,
    }))
    .filter((point) => Number.isFinite(point.v1));

  if (!validPoints.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-slate-600">
          Aucune donnée disponible pour cette période.
        </p>
      </div>
    );
  }

  const secondaryPoints = validPoints.filter(
    (point) => point.v2 != null && Number.isFinite(point.v2)
  );

  const hasSecondary = secondaryPoints.length > 0;

  const primaryValues = validPoints.map((point) => point.v1);
  const secondaryValues = secondaryPoints.map((point) => point.v2);
  const allValues = hasSecondary
    ? [...primaryValues, ...secondaryValues]
    : primaryValues;

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const rawRange = maxValue - minValue;
  const range = rawRange || Math.max(Math.abs(maxValue) * 0.2, 1);

  const min = Math.max(0, minValue - range * 0.2);
  const max = maxValue + range * 0.2;
  const adjustedRange = max - min || 1;

  const width = 760;
  const height = 340;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 48;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index) =>
    paddingLeft +
    (index / Math.max(validPoints.length - 1, 1)) * chartWidth;

  const getY = (value) =>
    paddingTop + ((max - value) / adjustedRange) * chartHeight;

  const primaryCoordinates = validPoints.map((point, index) => ({
    x: getX(index),
    y: getY(point.v1),
    value: point.v1,
  }));

  const secondaryCoordinates = validPoints
    .map((point, index) =>
      point.v2 != null && Number.isFinite(point.v2)
        ? {
            x: getX(index),
            y: getY(point.v2),
            value: point.v2,
          }
        : null
    )
    .filter(Boolean);

  const createPath = (coordinates) =>
    coordinates
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

  const primaryPath = createPath(primaryCoordinates);
  const secondaryPath = createPath(secondaryCoordinates);

  const areaPath =
    primaryPath +
    ` L ${primaryCoordinates[primaryCoordinates.length - 1].x} ${
      height - paddingBottom
    } L ${primaryCoordinates[0].x} ${
      height - paddingBottom
    } Z`;

  const formatValue = (value) =>
    Number(value).toLocaleString("fr-FR", {
      maximumFractionDigits: 2,
    });

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const value = max - (index / 4) * adjustedRange;
    const y = paddingTop + (index / 4) * chartHeight;

    return { value, y };
  });

  const renderSummary = (title, values, colorClass) => {
    if (!values.length) return null;

    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-xl font-bold ${colorClass}`}>
            {formatValue(Math.min(...values))}
          </span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Maximum : {formatValue(Math.max(...values))} {unit}
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Légende */}
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-700" />
          <span className="text-xs font-semibold text-slate-600">
            {label}
            {unit ? ` (${unit})` : ""}
          </span>
        </div>

        {hasSecondary && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-600">
              Deuxième valeur
            </span>
          </div>
        )}
      </div>

      {/* Graphique */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[520px] w-full overflow-visible"
          role="img"
          aria-label={`Graphique : ${label}`}
        >
          <defs>
            <linearGradient
              id="mesuresAreaGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#0d8c7c"
                stopOpacity="0.18"
              />
              <stop
                offset="100%"
                stopColor="#0d8c7c"
                stopOpacity="0.01"
              />
            </linearGradient>
          </defs>

          {/* Grille */}
          {gridLines.map((line, index) => (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#e5eaed"
                strokeWidth="1"
                strokeDasharray="4 5"
              />

              <text
                x={paddingLeft - 10}
                y={line.y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {formatValue(line.value)}
              </text>
            </g>
          ))}

          {/* Surface sous la courbe */}
          <path d={areaPath} fill="url(#mesuresAreaGradient)" />

          {/* Courbe principale */}
          <path
            d={primaryPath}
            fill="none"
            stroke="#0d8c7c"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Deuxième courbe */}
          {hasSecondary && (
            <path
              d={secondaryPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points principaux */}
          {primaryCoordinates.map((point, index) => (
            <g key={`primary-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="white"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#0d8c7c"
              />
            </g>
          ))}

          {/* Points secondaires */}
          {secondaryCoordinates.map((point, index) => (
            <g key={`secondary-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="white"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#10b981"
              />
            </g>
          ))}

          {/* Dates */}
          {validPoints.map((point, index) => {
            const showLabel =
              validPoints.length <= 7 ||
              index === 0 ||
              index === validPoints.length - 1 ||
              index % Math.ceil(validPoints.length / 6) === 0;

            if (!showLabel) return null;

            return (
              <text
                key={`date-${index}`}
                x={getX(index)}
                y={height - 15}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Résumé */}
      <div
        className={`mt-5 grid gap-3 ${
          hasSecondary ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {renderSummary(
          hasSecondary ? "Valeur principale" : "Valeurs enregistrées",
          primaryValues,
          "text-teal-800"
        )}

        {hasSecondary &&
          renderSummary(
            "Deuxième valeur",
            secondaryValues,
            "text-emerald-700"
          )}
      </div>
    </div>
  );
}
