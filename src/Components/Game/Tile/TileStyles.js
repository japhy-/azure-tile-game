import React from 'react'
import { TILE_SIZE, TILE_BORDER, TILE_MARGIN } from '.'

export const TileStyles = () => {
  return (
    <style type="text/css">{`
      .Tile {
        width: ${TILE_SIZE}px;
        height: ${TILE_SIZE}px;
        border-width: ${TILE_BORDER}px;
        margin: ${TILE_MARGIN}px;
      }

      .Showroom {
        width: ${TILE_SIZE * 3.5}px;
        height: ${TILE_SIZE * 3.5}px;
      }

      .Showroom > .Tiles {
        width: ${TILE_SIZE * 3}px;
        height: ${TILE_SIZE * 3}px;
        padding-left: ${TILE_SIZE / 2}px;
        padding-top: ${TILE_SIZE / 2}px;
      }

      .Hand {
        height: ${TILE_SIZE}px;
      }
    `}</style>
  )
}

export default TileStyles