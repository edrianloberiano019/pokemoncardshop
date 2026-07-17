import React from "react";

const FeaturedProduct = () => {
  return (
    <div className="h-full flex-col text-black flex w-full">
      <div className="flex items-center gap-2">
        <div>Featured Products</div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>
      </div>
      <div className="h-full grid grid-cols-5">
        <div className="flex-1 h-full" >
          <div className="h-full bg-gray-400">dsa</div>
          <div>dsas</div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;
