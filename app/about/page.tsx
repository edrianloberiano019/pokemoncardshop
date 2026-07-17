"use client";
import Navbar from "@/components/Navbar";
import { useRef } from "react";

export default function AboutPage() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <Navbar />
      <main className="flex flex-col pb-6 h-full overflow-hidden justify-between items-center px-[15vh] py-[2vh] text-black">
        <div className="flex flex-col items-center">
          <div className="flex h-40">
            <img src="/images/logo.png" />
          </div>
          <div className="max-w-240 font-normal indent-5">
            About KOSMOS Welcome to KOSMOS, your trusted destination for
            authentic Pokémon Trading Card Game products. Based in Germany, we
            bring Trainers and collectors together by offering a carefully
            curated selection of booster packs, elite trainer boxes,
            accessories, and collectible Pokémon cards. Whether you're expanding
            your collection, building a competitive deck, or searching for your
            next rare pull, KOSMOS has something for every Pokémon fan.
            <br />
            <br />
            At KOSMOS, we're committed to providing quality products at
            competitive prices, along with exclusive promotions and special
            offers to make every purchase even more rewarding. We take pride in
            fast order processing, secure packaging, and nationwide delivery,
            ensuring your Pokémon treasures arrive safely at your doorstep. Join
            thousands of Trainers who trust KOSMOS as their go-to Pokémon card
            shop and begin your next collecting adventure today.
          </div>
        </div>
      </main>
    </div>
  );
}
