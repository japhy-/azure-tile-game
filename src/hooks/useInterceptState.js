import { useState } from 'react';

// perform an arbitrary operation on the value before assigning it to state
// e.g. const [ oddLetterWords, setOddLetterWords ] = useInterceptState(words => words.filter(w => w.length % 2), [])

export const useInterceptState = (func, initial, interceptInitial = true) => {
    const [val, setVal] = useState(interceptInitial ? func(initial) : initial);
    return [val, (arg) => setVal(func(typeof arg === 'function' ? arg(val) : arg))];
};