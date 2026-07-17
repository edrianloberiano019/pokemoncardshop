export default function AdminConfigurationPage() {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <h1 className="text-4xl font-medium mb-2">Configuration</h1>
      <p className="text-black/70 mb-4">
        Store-wide settings and integrations.
      </p>
      <div className="w-full flex flex-row gap-2 h-full">
        <div className="border rounded-md w-full h-full overflow-hidden">
          <div className="text-white bg-black py-2 text-center">Categories</div>

          <div className="p-4 flex flex-col w-full gap-4">
            <div className="gap-2 w-full flex ">
              <input
                className="border w-full rounded-md p-2 px-4"
                placeholder="Eg. Jacket"
              />

              <div className="bg-green-600 text-white py-2 px-4 rounded-md cursor-pointer text-center hover:bg-green-700 transition-all">
                Create
              </div>
            </div>
            <div className="border rounded-md w-full">
              <div className="text-center font-semibold border-b p-2">
                Existing
              </div>
              <div className="p-4 flex text-sm">
                <div className="border p-2 font-medium items-center rounded-sm flex gap-2">
                  <div>Men's Apparell</div>
                  <div className="text-red-600 cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border rounded-md w-full overflow-hidden">
          <div className="text-white bg-black py-2 text-center">
            Search Filter
          </div>

          <div className="p-4 flex gap-4">
            <div className="gap-2 w-full flex flex-col">
              <input
                className="border rounded-md p-2 px-4"
                placeholder="Eg. Overseas"
              />

              <div className="bg-green-600 text-white py-2 px-4 rounded-md cursor-pointer text-center hover:bg-green-700 transition-all">
                Create
              </div>
            </div>
            <div className="border rounded-md w-1/2">
              <div className="text-center border-b p-2">Existing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
