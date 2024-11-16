type Operator = '+' | '-' | '*' | '/';
type TokenizedMath = [number, Operator, number];

class MathTokenizer {
  private static readonly validOperators = new Set(['+', '-', '*', '/']);

  tokenize(question: string): TokenizedMath {
    const parts = question.trim().split(/\s+/);
    if (!this.isValidFormat(parts)) {
      throw new Error("Question must be in format 'number operator number'");
    }

    const [left, op, right] = parts;
    if (!this.isValidOperator(op)) {
      throw new Error(`Operator must be one of: ${Array.from(MathTokenizer.validOperators).join(', ')}`);
    }

    const [leftNum, rightNum] = this.parseOperands(left, right);
    return [leftNum, op as Operator, rightNum];
  }

  private isValidFormat(parts: string[]): boolean {
    return parts.length === 3;
  }

  private isValidOperator(op: string): op is Operator {
    return MathTokenizer.validOperators.has(op as Operator);
  }

  private parseOperands(left: string, right: string): [number, number] {
    const leftNum = Number(left);
    const rightNum = Number(right);

    if (isNaN(leftNum) || isNaN(rightNum)) {
      throw new Error('Operands must be valid numbers');
    }

    return [leftNum, rightNum];
  }

  public evaluate(tokens: TokenizedMath): number {
    const [left, op, right] = tokens;

    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) throw new Error('Division by zero');
        return left / right;
    }
  }

  public process(question: string): number {
    const tokens = this.tokenize(question);
    return this.evaluate(tokens);
  }
}
