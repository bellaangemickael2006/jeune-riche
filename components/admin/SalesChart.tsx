import { formatPrice } from "@/lib/utils";
import type { DayBucket } from "@/lib/orders/stats";

// Histogramme SVG rendu côté serveur : aucune librairie de graphiques ni JS
// envoyé au navigateur. Survol d'une barre → montant et nombre de commandes.

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 8 };

function shortDate(day: string) {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

function compact(value: number) {
  return new Intl.NumberFormat("fr", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function SalesChart({ series }: { series: DayBucket[] }) {
  const max = Math.max(...series.map((d) => d.revenue), 0);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / series.length;
  const barW = Math.max(2, slot * 0.68);
  const labelEvery = series.length <= 7 ? 1 : series.length <= 30 ? 5 : 15;

  if (max === 0) {
    return (
      <div className="flex h-40 items-center justify-center border border-line text-sm text-paper/40">
        Aucune vente sur la période.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full text-paper" role="img" aria-label="Ventes par jour">
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.top + innerH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
            <text x={W - PAD.right} y={y - 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.35}>
              {compact(max * f)}
            </text>
          </g>
        );
      })}
      {series.map((d, i) => {
        const h = (d.revenue / max) * innerH;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        return (
          <g key={d.day}>
            {/* Zone de survol pleine hauteur : les jours à 0 restent survolables. */}
            <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent">
              <title>{`${shortDate(d.day)} — ${formatPrice(d.revenue)} · ${d.orders} commande${d.orders > 1 ? "s" : ""}`}</title>
            </rect>
            <rect
              x={x}
              y={PAD.top + innerH - h}
              width={barW}
              height={Math.max(h, d.revenue > 0 ? 2 : 0)}
              fill="currentColor"
              fillOpacity={i === series.length - 1 ? 1 : 0.75}
              pointerEvents="none"
            />
            {(i % labelEvery === 0 || i === series.length - 1) && (
              <text
                x={PAD.left + i * slot + slot / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.4}
              >
                {shortDate(d.day)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
