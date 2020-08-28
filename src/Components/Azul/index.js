import React, { useState, useEffect } from 'react';
import { forN } from '../../utilities/Functions'

export const Azul = ({host, code, nplayers}) => {
  const game = useGame(nplayers);
  
  if (game.activePlayer === -1) return null;

  return (
    <div>
      <div className="Factory">
        <div className="Showrooms">
          {game.factory.showrooms.map((s, idx) => (
            <div className="Showroom" key={idx}>
              {s.map((t, idx) => (
                <div class="Tile" key={idx} onClick={() => game.players.draw(game.activePlayer, game.factory.showrooms.takeTiles(idx, t))}>
                  {t}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="Surplus">
          {game.factory.surplus.hasPenalty && (
            <div className="Tile PenaltyTile">-1</div>
          )}
          {game.factory.surplus.tiles.map((t, idx) => (
            <div className="Tile" key={idx}>
              {t}
            </div>
          ))}
        </div>
      </div>
      <div className="Players">
        {game.players.players.map((p, idx) => (
          <div className={`Player ${game.activePlayer === idx && 'ActivePlayer'}`} key={idx}>
            <b>Player {idx} {idx === game.activePlayer && 'active player'}</b>
            <div className="Hand">
              {p.hand.map((t, idx) => (
                <div className="Tile" key={idx}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const useGameX = (n) => {
}


const useGame = (n) => {
  const tiles = useTiles();
  const factory = useFactory(n);
  const players = usePlayers(n);
  const [ activePlayer, setActivePlayer ] = useState(-1);

  const init = () => {
    setActivePlayer((p) => (p + 1) % n);

    // distribute tiles to the factories
    factory.startRound(tiles.bag);
  };

  useEffect(() => {
    init();
  }, []);

  return {
    init,
    tiles,
    factory,
    players,
    activePlayer,
  };
};


const useTiles = () => {
  const tiles_per = 20;
  const types = forN(5);

  const [bag, setBag] = useState([]);
  const [discarded, setDiscarded] = useState([]);

  const init = () => {
    console.log('tiles init');
    setBag(shuffle(Array.prototype.concat(
      ...forN(tiles_per).map(_ => types.map((t) => t))
    )));
    setDiscarded([]);
  };

  const remaining = bag.length;
  
  useEffect(() => {
    console.log(remaining);
  }, [bag]);

  const draw = (n) => {
    const tiles = bag.slice(0, n);

    if (tiles.length < n) {
      const bag = shuffle(discarded);
      const needed = n - tiles.length;
      tiles.concat(bag.slice(0, needed));
      setBag(bag.slice(needed));
      setDiscarded([]);
    }
    else {
      setBag(bag.slice(n));
    }
    return tiles;
  };


  useEffect(() => {
    init();
  }, []);

  return {
    bag: {
      tiles: bag,
      remaining,
      draw,
    },
    discard: {
      tiles: discarded,
    },
  };
};


const shuffle = (array) => {
  array = [...array];
  for (let i = array.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    if (j !== i) [ array[j], array[i] ] = [ array[i], array[j] ];
  }
  return array;
};


const divide = (array, filter) => {
  const partitions = [ [], [] ];
  array.forEach(elem => partitions[filter(elem) ? 0 : 1].push(elem));
  return partitions;
}


const useFactory = (n) => {
  const [ showrooms, setShowrooms ] = useState([]);
  const [ surplus, setSurplus ] = useState([]);
  const [ penalty, setPenalty ] = useState(true);

  const init = (n) => {
    console.log('factory init');
    setShowrooms(forN(2*n + 1).map(_ => []));
    setSurplus([]);
    setPenalty(true);
  };

  showrooms.takeTiles = (showroomId, tileColor) => {
    const [ taken, rejected ] = divide(showrooms[showroomId], (t) => t === tileColor);
    setSurplus((s) => [...s, ...rejected]);
    setShowrooms((showrooms) => {
      showrooms[showroomId] = [];
      return [...showrooms];
    });
    return taken;
  };

  useEffect(() => {
    init(n);
  }, []);

  return {
    init,
    startRound: (tiles) => {
      console.log('starting round');
      setShowrooms(showrooms => showrooms.map(() => tiles.draw(4)));
      setSurplus([]);
      setPenalty(true);
    },
    showrooms,
    surplus: { hasPenalty: penalty, tiles: surplus },
  };
};


const usePlayers = (n) => {
  const [ hands, setHands ] = useState([]);
  const [ totalScores, setTotalScores ] = useState([]);
  const [ roundScores, setRoundScores ] = useState([]);
  const [ tables, setTables ] = useState([]);
  const [ walls, setWalls ] = useState([]);
  const [ floors, setFloors ] = useState([]);
  const players = forN(n).map(_ => ({}));

  const init = (n) => {
    console.log('players init');
    const hands = [], totalScores = [], roundScores = [], tables = [], walls = [], floors = [];
    console.log(`creating ${n} players`);

    for (let i = 0; i < n; i++) {
      hands[i] = [];
      totalScores[i] = 0;
      roundScores[i] = [0];
      tables[i] = forN(5).map(_ => []);
      walls[i] = forN(5).map(_ => forN(5).map(_ => forN(5).map(_ => 31)));
      floors[i] = [];
    }

    setHands(hands);
    setTotalScores(totalScores);
    setRoundScores(roundScores);
    setTables(tables);
    setWalls(walls);
    setFloors(floors);
  };

  useEffect(() => {
    init(n);
  }, []);

  const draw = (n, tiles) => {
    setHands(hands => {
      hands[n] = tiles;
      setHands([...hands]);
    });
  };
  
  for (let i = 0; i < n; i++) players[i] = {
    id: i,
    hand: hands[i],
    score: { total: totalScores[i], round: roundScores[i] },
    table: tables[i],
    wall: walls[i],
    floor: floors[i],
  };

  return {
    init,
    players,
    draw,
  };
};





/*
general
  round
  end-game
*/