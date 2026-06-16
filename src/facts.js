const FACT_MIN = 2;
const FACT_MAX = 12;

const NUMBER_WORDS = new Map([
  [0, "zero"],
  [1, "one"],
  [2, "two"],
  [3, "three"],
  [4, "four"],
  [5, "five"],
  [6, "six"],
  [7, "seven"],
  [8, "eight"],
  [9, "nine"],
  [10, "ten"],
  [11, "eleven"],
  [12, "twelve"],
  [13, "thirteen"],
  [14, "fourteen"],
  [15, "fifteen"],
  [16, "sixteen"],
  [17, "seventeen"],
  [18, "eighteen"],
  [19, "nineteen"],
  [20, "twenty"],
  [30, "thirty"],
  [40, "forty"],
  [50, "fifty"],
  [60, "sixty"],
  [70, "seventy"],
  [80, "eighty"],
  [90, "ninety"],
  [100, "one hundred"]
]);

export const SETS = Array.from(
  { length: FACT_MAX - FACT_MIN + 1 },
  (_, index) => index + FACT_MIN
);

export function numberToWords(value) {
  if (NUMBER_WORDS.has(value)) return NUMBER_WORDS.get(value);

  if (value < 100) {
    const tens = Math.floor(value / 10) * 10;
    const ones = value % 10;
    return `${NUMBER_WORDS.get(tens)}-${NUMBER_WORDS.get(ones)}`;
  }

  const remainder = value - 100;
  return remainder === 0
    ? "one hundred"
    : `one hundred ${numberToWords(remainder)}`;
}

function makeFact(a, b, type, variant) {
  const product = a * b;
  const id = `${type}-${a}-${b}-${variant}`;

  if (type === "multiply") {
    return {
      id,
      set: Math.min(a, b),
      a,
      b,
      product,
      type,
      text: `${capitalize(numberToWords(a))} times ${numberToWords(b)} equals ${numberToWords(product)}.`,
      display: `${a} x ${b} = ${product}`
    };
  }

  return {
    id,
    set: Math.min(a, b),
    a,
    b,
    product,
    type,
    text: `${capitalize(numberToWords(product))} divided by ${numberToWords(a)} equals ${numberToWords(b)}.`,
    display: `${product} / ${a} = ${b}`
  };
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function createFacts() {
  const facts = [];

  for (let a = FACT_MIN; a <= FACT_MAX; a += 1) {
    for (let b = a; b <= FACT_MAX; b += 1) {
      if (a === b) {
        facts.push(makeFact(a, b, "multiply", "forward"));
        facts.push(makeFact(a, b, "multiply", "repeat"));
        facts.push(makeFact(a, b, "divide", "forward"));
        facts.push(makeFact(a, b, "divide", "repeat"));
      } else {
        facts.push(makeFact(a, b, "multiply", "forward"));
        facts.push(makeFact(b, a, "multiply", "reverse"));
        facts.push(makeFact(a, b, "divide", "forward"));
        facts.push(makeFact(b, a, "divide", "reverse"));
      }
    }
  }

  return facts;
}

export const FACTS = createFacts();
