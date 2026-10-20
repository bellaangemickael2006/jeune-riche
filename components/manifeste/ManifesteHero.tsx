"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import WordPullUp from "@/components/ui/WordPullUp";

export default function ManifesteHero() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // La vidéo pèse ~11 Mo : on ne la charge pas pour un visiteur qui a
    // activé l'économie de données ou réduit les animations — l'image de
    // repli suffit, et la page reste fluide sur une connexion mobile lente.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative flex h-svh items-center justify-center overflow-hidden">
      {!failed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/badge/badge-black-on-white.png"
          onError={() => setFailed(true)}
        >
          <source src="/video/manifeste-motif.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image src="/images/badge/badge-black-on-white.png" alt="JEUNE RICHE" fill priority sizes="100vw" className="object-cover" />
      )}
      {/* Superposé à une vidéo réelle, pas au fond de page : reste toujours
          sombre pour le titre blanc, quel que soit le thème. */}
      <div className="absolute inset-0 bg-black/50" />
      <WordPullUp
        text={t("navigation.manifesto")}
        as="h1"
        immediate
        className="relative z-10 px-5 text-center font-display text-[16vw] uppercase leading-none text-white md:text-[9vw]"
      />
    </section>
  );
}
