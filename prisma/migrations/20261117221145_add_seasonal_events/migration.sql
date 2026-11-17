-- CreateTable
CREATE TABLE "seasonal_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accent" TEXT NOT NULL DEFAULT '#C8102E',
    "bannerText" TEXT,
    "effectSnow" BOOLEAN NOT NULL DEFAULT false,
    "effectLights" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_events_pkey" PRIMARY KEY ("id")
);
