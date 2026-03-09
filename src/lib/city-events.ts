import "server-only";

import type { CityEventUI } from "@/types";

const API_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";
const DEFAULT_CITY = "Vitoria da Conquista";
const DEFAULT_COUNTRY = "BR";

type TicketmasterImage = {
  url?: string;
  ratio?: string;
  width?: number;
};

type TicketmasterVenue = {
  name?: string;
  city?: { name?: string };
  state?: { stateCode?: string; name?: string };
};

type TicketmasterEvent = {
  id: string;
  name?: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  images?: TicketmasterImage[];
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
};

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
};

function pickBestImage(images: TicketmasterImage[] | undefined): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  const preferred = images.find((image) => image.ratio === "16_9" && (image.width ?? 0) >= 400);
  return preferred?.url || images[0]?.url;
}

function toExcerpt(event: TicketmasterEvent): string {
  const venue = event._embedded?.venues?.[0];
  const date = event.dates?.start?.localDate;
  const time = event.dates?.start?.localTime;
  const parts = [date, time, venue?.name].filter(Boolean);
  return parts.length ? parts.join(" - ") : "Evento em Vitoria da Conquista";
}

function normalizeEvent(event: TicketmasterEvent): CityEventUI | null {
  if (!event.id || !event.name || !event.url) {
    return null;
  }

  return {
    id: event.id,
    title: event.name,
    excerpt: toExcerpt(event),
    imageUrl: pickBestImage(event.images),
    href: event.url,
  };
}

export async function getCityEvents(limit = 6): Promise<CityEventUI[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY?.trim();
  if (!apiKey || apiKey.toLowerCase().includes("coloque_sua_chave")) {
    return [];
  }

  const city = process.env.CITY_EVENTS_CITY?.trim() || DEFAULT_CITY;
  const countryCode = process.env.CITY_EVENTS_COUNTRY?.trim() || DEFAULT_COUNTRY;

  const url = new URL(API_BASE);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", city);
  url.searchParams.set("countryCode", countryCode);
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("size", String(Math.min(Math.max(Math.floor(limit), 1), 20)));
  url.searchParams.set("startDateTime", new Date().toISOString());
  url.searchParams.set("locale", "*");

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      if (response.status !== 401 && response.status !== 403) {
        console.error(`[city-events] request failed status=${response.status}`);
      }
      return [];
    }

    const data = (await response.json()) as TicketmasterResponse;
    const events = data._embedded?.events ?? [];

    return events.map(normalizeEvent).filter((event): event is CityEventUI => Boolean(event));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[city-events] request exception message=\"${message}\"`);
    return [];
  }
}
