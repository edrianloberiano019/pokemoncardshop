import { NextResponse } from "next/server";

const escapeValue = (value: string) => value.replace(/"/g, '\\"');

function buildQuery(searchParams: URLSearchParams) {
  const types = searchParams.getAll("type");
  const rarities = searchParams.getAll("rarity");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const clauses: string[] = [];

  if (types.length > 0) {
    clauses.push(
      `(${types.map((t) => `types:"${escapeValue(t)}"`).join(" OR ")})`
    );
  }

  if (rarities.length > 0) {
    clauses.push(
      `(${rarities.map((r) => `rarity:"${escapeValue(r)}"`).join(" OR ")})`
    );
  }

  if (minPrice || maxPrice) {
    const min = minPrice || "*";
    const max = maxPrice || "*";
    clauses.push(`cardmarket.prices.trendPrice:[${min} TO ${max}]`);
  }

  return clauses.join(" AND ");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = buildQuery(searchParams);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = 60;

  const url = new URL("https://api.pokemontcg.io/v2/cards");
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  if (query) {
    url.searchParams.set("q", query);
  }

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": process.env.POKEMON_API_KEY!,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch cards." },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json({
    cards: data.data,
    page,
    pageSize,
    totalCount: data.totalCount ?? data.data.length,
  });
}
