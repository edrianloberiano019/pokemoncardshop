import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://api.pokemontcg.io/v2/cards?q=name:pikachu",
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
  return NextResponse.json(data.data);

  
}


