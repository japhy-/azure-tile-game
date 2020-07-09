import React from 'react';
import { Wall } from "./Wall";
import { Arrows } from "./Arrows";
import { TileTable } from "../Tile/TileTable";

export const Workshop = () => {
  return (
    <div className="Workshop flex columns just-centered centered">
      <h3 className="centered">Workshop</h3>
      <div className="flex just-centered">
        <TileTable />
        <Arrows />
        <Wall />
      </div>
    </div>
  );
};
