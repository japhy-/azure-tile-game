/**
 * forN returns an array
 * @param {number} start
 * @param {number} end
 * @param {number?} step
 */
export const forN = (start, end=undefined, step=undefined) => (
  (end === undefined && step === undefined) ? [...new Array(start).keys()]
  : (step === undefined) ? [...new Array(end-start + 1).keys()].map(i => i+start)
  : [...new Array((end-start)/step + 1).keys()].map(i => step*i+start)
)

// forN(5) === [0,1,2,3,4]
// forN(0,3) === [0,1,2,3]
// forN(10,12) === [10,11,12]
// forN(0,10,2) === [0,2,4,6,8,10] === 2x[0,1,2,3,4,5]
// forN(10,19,3) === [10,13,16,19] === 10+3x[0,1,2,3]