import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-6 overflow-auto gap-4 w-full h-full p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 11, 12, 13, 14, 15, 16, 17, 18].map(
        (item, index) => (
          <div
            key={item}
            className={` h-54 skeleton bg-gray-200 `}
          ></div>
        ),
      )}
    </div>
  );
}
