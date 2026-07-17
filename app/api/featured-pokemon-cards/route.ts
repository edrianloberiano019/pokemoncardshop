import { NextResponse } from "next/server";

export async function GET() {
  const query = `
    rarity:"Rare Secret" OR
    rarity:"Rare Rainbow" OR
    rarity:"Rare Ultra" OR
    rarity:"Rare Holo VMAX" OR
    rarity:"Rare Holo GX"
  `;

  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
      query
    )}&pageSize=50`,
    {
      headers: {
        "X-Api-Key": process.env.POKEMON_API_KEY!,
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch cards." },
      { status: res.status }
    );
  }

  const data = await res.json();

  const cards = [...data.data];

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return NextResponse.json(cards.slice(0, 6));
}