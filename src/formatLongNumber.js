/**
	Formats long numbers depending on digits  length:
	1-4         -> Not changing
  5 12456     -> 12.4k
  6 123456    -> 123k
  7 1234567   -> 1.23m
  8 12345679  -> 12.3m
  9 123456790 -> 123m
*/
export default function formatLongNumber(longNum) {
    var num = Math.floor(longNum);
    var digitsCount = String(num).length;
    if (digitsCount < 5) {
      return num;
    }
    var tailLen =  digitsCount > 9 ? 0 : (9 - digitsCount) % 3;
    var intLen = digitsCount > 9  ? 6 : digitsCount - (3 - tailLen);
    var scaled = (num / Math.pow(10, intLen)).toFixed(tailLen);
    var literal = digitsCount < 7 ? 'k' : 'm';

    return scaled + literal;
}
