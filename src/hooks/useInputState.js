import { useState } from 'react';

export const useInputState = (initial) => {
    const [val, setVal] = useState(initial);
    return [val, (ev) => setVal(typeof ev === 'object' ? ev.target.value : ev)];
};