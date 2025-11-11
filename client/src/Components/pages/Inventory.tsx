const Inventory = () => {
  return (
    <div className="h-auto xl:px-12 xl:py-6 px-8 py-2 ">
      <div className="head bg-neutral-800 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold hidden md:flex xl:flex">
            Inventory Manager{" "}
          </h1>
          <i
            className="bx bxs-fire-alt text-2xl"
            style={{ color: "#ff6300" }}
          ></i>
        </div>
      </div>

      <div className="body bg-neutral-800 mt-4 py-3">
        <p>jsdk</p>
      </div>
    </div>
  );
};

export default Inventory;
