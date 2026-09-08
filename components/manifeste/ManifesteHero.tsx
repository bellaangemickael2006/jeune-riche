"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import WordPullUp from "@/components/ui/WordPullUp";

export default function ManifesteHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative flex h-[100svh] items-center justify-center overflow-hidden">
      {!failed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/badge/badge-black-on-white.png"
          onError={() => setFailed(true)}
        >
          <source src="/video/manifeste-motif.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image src="/images/badge/badge-black-on-white.png" alt="JEUNE RICHE" fill className="object-cover" />
      )}
      <div className="absolute inset-0 bg-ink/50" />
      <WordPullUp
        text="Manifeste"
        as="h1"
        immediate
        className="relative z-10 px-5 text-center font-display text-[16vw] uppercase leading-none text-paper md:text-[9vw]"
      />
    </section>
  );
}
