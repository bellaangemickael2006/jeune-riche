"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import WordPullUp from "@/components/ui/WordPullUp";
import TextScramble from "@/components/ui/TextScramble";
import Magnetic from "@/components/ui/Magnetic";
import FadeIn from "@/components/ui/FadeIn";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // autoplay bloqué par le navigateur — le poster statique reste affiché
    });
  }, []);

  return (
    <section className="relative flex h-[100svh] w-full items-end overflow-hidden bg-ink">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/badge/badge-white-on-black.png"
          onError={() => setVideoFailed(true)}
        >
          <source src="/video/hero-production.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/images/badge/badge-white-on-black.png"
          alt="JEUNE RICHE"
          fill
          priority
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/40" />

      <div className="relative z-10 flex w-full flex-col gap-8 px-5 pb-14 md:px-10 md:pb-20">
        <TextScramble
          text="LUXE STREETWEAR — IDENTITÉ TRIBALE"
          immediate
          className="font-body text-xs uppercase tracking-widest2 text-paper/70"
        />
        <WordPullUp
          text="Jeune Riche"
          as="h1"
          immediate
          className="font-display max-w-3xl text-[13vw] uppercase leading-[0.92] text-paper md:text-[7vw]"
        />
        <FadeIn delay={0.5} immediate className="flex flex-wrap items-center gap-6">
          <Magnetic strength={0.4}>
            <Link
              href="/catalogue"
              className="inline-block bg-paper px-8 py-4 text-xs uppercase tracking-widest2 text-ink transition-transform duration-300 ease-editorial hover:scale-[1.02]"
            >
              Voir le catalogue
            </Link>
          </Magnetic>
          <Link
            href="/manifeste"
            className="text-xs uppercase tracking-widest2 text-paper/80 underline underline-offset-4 transition-colors hover:text-paper"
          >
            Le manifeste
          </Link>
        </FadeIn>
      </div>

      <div className="absolute bottom-6 right-6 hidden flex-col items-center gap-2 text-paper/50 md:flex">
        <span className="text-[10px] uppercase tracking-widest2 [writing-mode:vertical-rl]">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-paper/40" />
      </div>
    </section>
  );
}
