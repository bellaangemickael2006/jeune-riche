"use client";

import { useState } from "react";

type Row = Record<string, string>;

export default function SizeGuide({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="border-b border-transparent pb-1 text-label text-paper/45 transition-colors duration-300 ease-editorial hover:border-paper/40 hover:text-paper"
      >
        Guide des tailles
      </button>
      {open && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-caption text-paper/70">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border-b border-line py-2 pr-6 text-label text-paper/40">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="border-b border-line/50 py-2.5 pr-6">
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
