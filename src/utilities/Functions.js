export const forN = (a, b=undefined, c=undefined) => (
  (b === undefined && c === undefined) ? [...new Array(a).keys()]
  : (c === undefined) ? [...new Array(b-a + 1).keys()].map(i => i+a)
  : [...new Array((b-a)/c + 1).keys()].map(i => c*i+a)
)

// forN(5) === [0,1,2,3,4]
// forN(0,3) === [0,1,2,3]
// forN(10,12) === [10,11,12]
// forN(0,10,2) === [0,2,4,6,8,10] === 2x[0,1,2,3,4,5]
// forN(10,19,3) === [10,13,16,19] === 10+3x[0,1,2,3]