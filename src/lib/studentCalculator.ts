export type CalculatorAngleMode = "DEG" | "RAD";

type OperatorToken = "+" | "-" | "*" | "/" | "^" | "%" | "u-";
type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: OperatorToken }
  | { type: "function"; value: string }
  | { type: "paren"; value: "(" | ")" };

const FUNCTION_NAMES = new Set(["sqrt", "sin", "cos", "tan", "log", "ln", "abs"]);
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const PRECEDENCE: Record<OperatorToken, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
  "u-": 4,
  "%": 5,
};

const RIGHT_ASSOCIATIVE = new Set<OperatorToken>(["^", "u-"]);

const isDigit = (char: string) => /[0-9]/.test(char);
const isIdentifierStart = (char: string) => /[a-z]/i.test(char);

export const formatCalculatorValue = (value: number) => {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid calculation result");
  }

  return Number(value.toFixed(12)).toString();
};

const tokenizeExpression = (expression: string) => {
  const cleanedExpression = expression.replace(/\s+/g, "").toLowerCase();
  if (!cleanedExpression) {
    throw new Error("Expression is empty");
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < cleanedExpression.length) {
    const currentChar = cleanedExpression[index];

    if (isDigit(currentChar) || currentChar === ".") {
      let value = currentChar;
      index += 1;
      while (index < cleanedExpression.length) {
        const nextChar = cleanedExpression[index];
        if (!isDigit(nextChar) && nextChar !== ".") break;
        value += nextChar;
        index += 1;
      }
      const parsedNumber = Number(value);
      if (!Number.isFinite(parsedNumber)) {
        throw new Error("Invalid number");
      }
      tokens.push({ type: "number", value: parsedNumber });
      continue;
    }

    if (isIdentifierStart(currentChar)) {
      let identifier = currentChar;
      index += 1;
      while (index < cleanedExpression.length && /[a-z]/i.test(cleanedExpression[index])) {
        identifier += cleanedExpression[index];
        index += 1;
      }

      if (identifier in CONSTANTS) {
        tokens.push({ type: "number", value: CONSTANTS[identifier] });
        continue;
      }

      if (FUNCTION_NAMES.has(identifier)) {
        tokens.push({ type: "function", value: identifier });
        continue;
      }

      throw new Error(`Unsupported token: ${identifier}`);
    }

    if (currentChar === "(" || currentChar === ")") {
      tokens.push({ type: "paren", value: currentChar });
      index += 1;
      continue;
    }

    if ("+-*/^%".includes(currentChar)) {
      const previousToken = tokens[tokens.length - 1];
      const isUnaryMinus =
        currentChar === "-" &&
        (!previousToken ||
          (previousToken.type === "operator" && previousToken.value !== "%") ||
          (previousToken.type === "paren" && previousToken.value === "("));

      tokens.push({
        type: "operator",
        value: isUnaryMinus ? "u-" : (currentChar as OperatorToken),
      });
      index += 1;
      continue;
    }

    throw new Error(`Unsupported character: ${currentChar}`);
  }

  return tokens;
};

const toReversePolishNotation = (tokens: Token[]) => {
  const output: Token[] = [];
  const operators: Token[] = [];

  tokens.forEach((token) => {
    if (token.type === "number") {
      output.push(token);
      return;
    }

    if (token.type === "function") {
      operators.push(token);
      return;
    }

    if (token.type === "operator") {
      while (operators.length > 0) {
        const lastOperator = operators[operators.length - 1];
        if (lastOperator.type === "paren" && lastOperator.value === "(") break;

        if (
          lastOperator.type === "function" ||
          (lastOperator.type === "operator" &&
            (PRECEDENCE[lastOperator.value] > PRECEDENCE[token.value] ||
              (PRECEDENCE[lastOperator.value] === PRECEDENCE[token.value] &&
                !RIGHT_ASSOCIATIVE.has(token.value))))
        ) {
          output.push(operators.pop() as Token);
          continue;
        }
        break;
      }

      operators.push(token);
      return;
    }

    if (token.type === "paren" && token.value === "(") {
      operators.push(token);
      return;
    }

    if (token.type === "paren" && token.value === ")") {
      while (operators.length > 0) {
        const popped = operators.pop() as Token;
        if (popped.type === "paren" && popped.value === "(") break;
        output.push(popped);
      }

      if (!operators.every((item) => !(item.type === "paren" && item.value === ")"))) {
        throw new Error("Invalid parentheses");
      }

      const nextOperator = operators[operators.length - 1];
      if (nextOperator?.type === "function") {
        output.push(operators.pop() as Token);
      }
    }
  });

  while (operators.length > 0) {
    const operator = operators.pop() as Token;
    if (operator.type === "paren") {
      throw new Error("Unbalanced parentheses");
    }
    output.push(operator);
  }

  return output;
};

const evaluateFunction = (fnName: string, input: number, angleMode: CalculatorAngleMode) => {
  switch (fnName) {
    case "sqrt":
      return Math.sqrt(input);
    case "sin":
      return Math.sin(angleMode === "DEG" ? (input * Math.PI) / 180 : input);
    case "cos":
      return Math.cos(angleMode === "DEG" ? (input * Math.PI) / 180 : input);
    case "tan":
      return Math.tan(angleMode === "DEG" ? (input * Math.PI) / 180 : input);
    case "log":
      return Math.log10(input);
    case "ln":
      return Math.log(input);
    case "abs":
      return Math.abs(input);
    default:
      throw new Error(`Unsupported function: ${fnName}`);
  }
};

const evaluateReversePolishNotation = (tokens: Token[], angleMode: CalculatorAngleMode) => {
  const stack: number[] = [];

  tokens.forEach((token) => {
    if (token.type === "number") {
      stack.push(token.value);
      return;
    }

    if (token.type === "function") {
      const input = stack.pop();
      if (input === undefined) throw new Error("Malformed expression");
      stack.push(evaluateFunction(token.value, input, angleMode));
      return;
    }

    if (token.type === "operator") {
      if (token.value === "u-") {
        const input = stack.pop();
        if (input === undefined) throw new Error("Malformed expression");
        stack.push(-input);
        return;
      }

      if (token.value === "%") {
        const input = stack.pop();
        if (input === undefined) throw new Error("Malformed expression");
        stack.push(input / 100);
        return;
      }

      const right = stack.pop();
      const left = stack.pop();
      if (left === undefined || right === undefined) throw new Error("Malformed expression");

      switch (token.value) {
        case "+":
          stack.push(left + right);
          break;
        case "-":
          stack.push(left - right);
          break;
        case "*":
          stack.push(left * right);
          break;
        case "/":
          stack.push(left / right);
          break;
        case "^":
          stack.push(left ** right);
          break;
        default:
          throw new Error("Unsupported operation");
      }
    }
  });

  if (stack.length !== 1) {
    throw new Error("Malformed expression");
  }

  return stack[0];
};

export const evaluateCalculatorExpression = (
  expression: string,
  options?: { angleMode?: CalculatorAngleMode }
) => {
  const angleMode = options?.angleMode || "DEG";
  const tokens = tokenizeExpression(expression);
  const rpnTokens = toReversePolishNotation(tokens);
  const result = evaluateReversePolishNotation(rpnTokens, angleMode);

  if (!Number.isFinite(result)) {
    throw new Error("Invalid calculation result");
  }

  return Number(formatCalculatorValue(result));
};
