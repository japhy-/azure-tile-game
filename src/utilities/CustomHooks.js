import { useState } from 'react'

// perform an arbitrary operation on the value before assigning it to state
// e.g. const [ oddLetterWords, setOddLetterWords ] = useInterceptState(words => words.filter(w => w.length % 2), [])
export const useInterceptState = (f, i, a=true) => {
  const [ v, s ] = useState(a ? f(i) : i)
  return [ v, (a) => s(f(typeof a === 'function' ? a(v) : a)) ]
}
