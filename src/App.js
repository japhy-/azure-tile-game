import './App.css';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StorageProvider } from './contexts/StorageProvider';

const tileConfig = {
    size: 36,
    border: 3,
    margin: 4,
    colors: new Map([
        [ 'red', 'pink' ],
        [ 'green', 'lime' ],
        [ 'blue', 'cyan' ],
        [ 'yellow', 'orange' ],
        [ 'black', 'silver' ],
    ].map(([color, border], position) => [color, { border, position }])),
};

const scoreConfig = {
    penalties: [-1, -1, -2, -2, -2, -3, -3],
}

const App = () => {
    return (
        <StorageProvider>
            <GameArea>
            </GameArea>
        </StorageProvider>
    );
};

const GameConfigContext = createContext({});

const GameArea = () => {
    const [playing, setPlaying] = useState(false);
    const [config, setConfig] = useState({
        players: 2,
        wall: 'standard',
    });

    const initGame = useCallback(() => {
        // console.log(config);
        setPlaying(true);
    }, [config]);

    return <GameConfigContext.Provider value={{playing, initGame, config, setConfig}}>
        {!playing && <GameConfig/>}
        {playing && <GameBoard/>}
    </GameConfigContext.Provider>
};

const GameConfig = () => {
    return <div className='GameConfig'>
        <PlayersConfig/>
        <WallConfig/>
        <StartGame/>
    </div>;
};

const PlayersConfig = () => {
    const { config, setConfig } = useContext(GameConfigContext);
    const options = [2,3,4];

    return <div className='PlayersConfig'>
        Number of Players:
        {options.map((n) =>
            <label key={n}>
                <input
                    type="radio"
                    name="players"
                    defaultChecked={config.players === n}
                    onClick={() => setConfig((config) => ({...config, players: n}))}
                /> {n}
            </label>
        )}
    </div>
};

const WallConfig = () => {
    const { config, setConfig } = useContext(GameConfigContext);
    const options = ['standard', 'easy', 'medium', 'difficult'];

    return <div className='WallConfig'>
        Wall Rules:
        {options.map((n) =>
            <label key={n}>
                <input
                    type="radio"
                    name="wall"
                    defaultChecked={config.wall === n}
                    onClick={() => setConfig((config) => ({...config, wall: n}))}
                /> {n}
            </label>
        )}
    </div>;
};

const StartGame = () => {
    const { initGame } = useContext(GameConfigContext);

    return <div className='StartGame'>
        <button onClick={initGame}>Start Game</button>
    </div>;
};

const GameBoardContext = createContext({});

const GameBoard = () => {
    const { config } = useContext(GameConfigContext);
    const gameBoard = useGameBoard(config);

    useEffect(() => {
        console.log(gameBoard);
    }, [gameBoard]);

    return <GameBoardContext.Provider value={gameBoard}>
        <div className='GameBoard'>
            <Factory/>
            <Controls/>
            <Players/>
        </div>
    </GameBoardContext.Provider>;
};

const useGameBoard = (config) => {
    const tileBag = useTileBag(tileConfig);
    const factory = useFactory(config);
    const players = usePlayers(config);

    useEffect(() => {
        tileBag.shuffle();
    }, []);

    return {
        tileBag,
        factory,
        players,
    };
};

const useTileBag = ({ colors }) => {
    const [ tiles, setTiles ] = useState([]);
    const [ discarded, setDiscarded ] = useState([]);

    const reset = () => {
        setTiles(Array.prototype.concat(...[...colors].map(([color], c) => [...Array(20)].map((_, n) => ({ id: c*20 + n, color })))));
        setDiscarded([]);
    };

    const _shuffle = () => setTiles((tiles) => shuffle(tiles));

    const draw = (n) => {
        const available = tiles.length;
        const drawn = tiles.slice(0, Math.min(n, available));

        if (drawn.length < n) {
            const needed = n - drawn.length;
            console.log(`repopulating tileBag for ${needed} more tiles`);
            tiles = shuffle(discarded);
            drawn.push(...tiles.slice(0, needed));
            setDiscarded([]);
            setTiles(tiles.slice(needed));
        }
        else {
            setTiles(tiles.slice(n));
        }

        return drawn;
    }

    useEffect(() => {
        reset();
    }, []);

    return {
        tiles,
        shuffle: _shuffle,
        draw,
        reset,
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
};

const arrayReplace = (array, index, value) => [...array.slice(0, index), value, ...array.slice(index+1)];

const useFactory = ({ players }) => {
    const [ displayTiles, setDisplayTiles ] = useState([...Array(players * 2 + 1)].map(() => ([])));
    const [ surplusTiles, setSurplusTiles ] = useState([]);
    const [ firstToken, setFirstToken ] = useState(true);

    const displayDraw = (display) => (color) => {
        const [ tiles, dumped ] = divide(displayTiles[display].tiles, (t) => t.color === color);

        setDisplayTiles((displayTiles) => arrayReplace(displayTiles, display, { ...displayTiles[display], tiles: [] }));
        setSurplusTiles((surplusTiles) => [...surplusTiles, ...dumped]);

        return tiles;
    };

    const surplusDraw = (color) => {
        const [ tiles, remainder ] = divide(surplusTiles, (t) => t.color === color);
        const first = firstToken;

        setSurplusTiles(remainder);
        setFirstToken(false);

        return { tiles, firstToken: first };
    };

    return {
        displays: displayTiles.map((tiles, id) => ({
            id,
            tiles,
            isEmpty: !tiles.length,
            draw: displayDraw(id),
        })),
        surplus: {
            tiles: surplusTiles,
            draw: surplusDraw,
            firstToken,
        },
    };
};

const usePlayers = ({ players: numPlayers }) => {
    const [ players, setPlayers ] = useState([...Array(numPlayers).keys()].map((id) => ({
        id,
        hand: [],
        score: { thisRound: 0, total: 0 },
        workshop: [ [], [], [], [], [] ],
        wall: [ [], [], [], [], [] ],
        floor: [],
    })));

    const draw = (player, hand) => setPlayers((players) => arrayReplace(players, player, { ...players[player], hand }));
    const play = (player, workshopRow) => setPlayers((players) => arrayReplace(players, player, {
        ...players[player],
        hand: players[player].hand.slice(1),
        workshop: arrayReplace(players[player].workshop, workshopRow, )
    }));

    return {
        players,
    };
};


const Factory = () => {
    return null;
};

const Controls = () => {
    return null;
};

const Players = () => {
    return null;
};

export default App;

/*

                <Factory>
                    <Displays>
                        <Display>
                            <Tiles>
                                <Tile></Tile>
                            </Tiles>
                        </Display>
                    </Displays>
                    <Surplus>
                        <Tiles>
                            <Tile></Tile>
                        </Tiles>
                    </Surplus>
                </Factory>
                <Controls>
                    <Undo></Undo>
                    <Confirm></Confirm>
                </Controls>
                <Players>
                    <Player>
                        <Board>
                            <Workshop>
                                <Rows>
                                    <Row>
                                        <Tiles>
                                            <Tile></Tile>
                                        </Tiles>
                                    </Row>
                                </Rows>
                            </Workshop>
                            <Arrows>
                                <Rows>
                                    <Row>
                                        <Arrow></Arrow>
                                    </Row>
                                </Rows>
                            </Arrows>
                            <Wall>
                                <Rows>
                                    <Row>
                                        <Tiles>
                                            <Tile></Tile>
                                        </Tiles>
                                    </Row>
                                </Rows>
                            </Wall>
                        </Board>
                        <Floor>
                            <Tiles>
                                <Tile></Tile>
                            </Tiles>
                        </Floor>
                        <Score></Score>
                    </Player>
                </Players>


*/