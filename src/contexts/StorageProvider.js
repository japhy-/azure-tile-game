import React, { createContext } from 'react';
import { useInterceptState } from '../hooks/useInterceptState';

const StorageContext = createContext({});

export const StorageProvider = ({source=localStorage, children}) => {
    const [ data, setData ] = useInterceptState((d) => Object.fromEntries(Object.entries(d).map(([k,v]) => [k, JSON.parse(v)])), source);

    return (
        <StorageContext.Provider value={{
            get: (k) => data[k],
            set: (k, v) => { source.setItem(k, JSON.stringify(v)); setData(source); },
            remove: (k) => { source.removeItem(k); setData(source); },
            clear: () => { source.clear(); setData(source); },
            length: () => source.length,
            key: (n) => source.key(n),    
        }}>{children}</StorageContext.Provider>
    );
};

export default StorageProvider;