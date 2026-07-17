import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Loading() {
  return (
    <div className="w-full flex-col z-20 h-full absolute top-0 left-0 bg-white/40 flex items-center justify-center">
      <DotLottieReact
        className="w-80 z-20 h-80"
        src="assets/animation/Pikachu.json"
        autoplay
        loop
      />
    </div>
  );
}
