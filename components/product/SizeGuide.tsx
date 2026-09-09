"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type Row = Record<string, string>;

export default function SizeGuide({ rows }: { rows: Row[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]);

  return (
    <div className="mt-8 border-t border-line pt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
      >
        {t("product.sizeGuide")} {open ? "−" : "+"}
      </button>
      {open && (
        <table className="mt-4 w-full text-left text-xs text-paper/70">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className="border-b border-line py-2 pr-4 uppercase tracking-widest2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} className="border-b border-line/50 py-2 pr-4">
                    {row[c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
