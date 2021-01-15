import { useState } from 'react';

export const useResetState = (initial) => {
    const [val, setVal] = useState(initial);
    return [val, setVal, () => setVal(initial)];
};
