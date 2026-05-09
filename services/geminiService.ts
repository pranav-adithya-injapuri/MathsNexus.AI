
import { GoogleGenAI } from "@google/genai";

// Initialize with named parameter as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const chatWithTutor = async (messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: messages,
    config: {
      systemInstruction: `You are the Lead AI Tutor at MathNexus. Your background is senior engineering at Netflix. You provide high-density, organized, and visually clean math explanations.

STRICT FORMATTING RULES:
1. **NO RAW LATEX**: Do NOT use "$$", "\\dots", "\\begin", or "\\end". Use standard characters like (^, *, /, -, +, ∞, ≈).
2. **MODULAR STRUCTURE**: Always follow this exact structure:
   - **💡 Concept Summary**: Explain the idea in 2 sentences with relevant emojis.
   - **📝 Step-by-Step Breakdown**: Use a numbered list to explain the logic or formula.
   - **📊 Comparison / Cheat Sheet**: Use a Markdown Table to compare concepts or list core formulas.
   - **✅ Key Takeaways**: A bulleted list of 3 final points.
3. **TONE**: Be the "cool lead engineer" — helpful, concise, and professional.
4. **EMOJIS**: Use emojis proactively (🚀, 🧮, 💡, 📝, 📊, ✅, ⚠️).
5. **TABLES**: Use Markdown tables (e.g., | Term | Definition | Formula |).`,
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text;
};

export const checkIfSimplifiable = async (expression: string): Promise<boolean> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Is the following mathematical expression for 'n' already in its simplest algebraic form? 
    If it can be significantly simplified (e.g., canceling factorials like (n+1)!/n!, combining terms, reducing fractions), respond with 'YES'. 
    If it is already in its simplest possible form (like 'n + 1' or '2*n'), respond with 'NO'.
    Return ONLY 'YES' or 'NO'.
    Expression: ${expression}`,
    config: { temperature: 0.1 }
  });
  const text = response.text?.trim().toUpperCase();
  return text === 'YES';
};

export const simplifyMathExpression = async (expression: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simplify this mathematical sequence formula for 'n' into its simplest algebraic form. 
    Return ONLY the simplified expression string for JavaScript (e.g., "n + 1"). No explanations.
    Expression: ${expression}`,
    config: { temperature: 0.1 }
  });
  return response.text?.trim() || expression;
};

const factorial = (num: number): number => {
  const n = Math.floor(num);
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

/**
 * Robust 5-Step Mathematical Expression Parser
 * 1. Normalization & Implied Multiplication
 * 2. Power Operator Sanitization (Grouped Exponents)
 * 3. Symbolic Injection (Math namespace mapping)
 * 4. Recurrence Detection (Factorials)
 * 5. Secure Scoped Evaluation with Specific Error Categorization
 */
export const parseMathExpression = (expr: string, n: number): number => {
  try {
    // Step 1: Normalization & Implied Multiplication
    let s = expr.toLowerCase().replace(/\s+/g, '');
    s = s.replace(/(\d+)(n|[a-z\(])/g, '$1*$2');
    s = s.replace(/n([a-z\(])/g, 'n*$1');
    s = s.replace(/\)(n|\d|[a-z\(])/g, ')*$1');

    // Step 2: Power Operator Sanitization
    s = s.replace(/\^/g, '**');
    // Ensure negative signs before power terms are parenthesized for JS parser
    s = s.replace(/(^|[\+\-\*\/\(])-(\d+|n|\([^\)]+\))\*\*/g, '$1(-$2)**');

    // Step 3: Symbolic Injection
    const mathMap: Record<string, string> = {
      'sin': 'Math.sin', 'cos': 'Math.cos', 'tan': 'Math.tan',
      'asin': 'Math.asin', 'acos': 'Math.acos', 'atan': 'Math.atan',
      'sqrt': 'Math.sqrt', 'abs': 'Math.abs', 'exp': 'Math.exp',
      'log': 'Math.log', 'ln': 'Math.log', 'log10': 'Math.log10',
      'pi': 'Math.PI', 'e': 'Math.E', 'pow': 'Math.pow'
    };

    Object.entries(mathMap).forEach(([key, val]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      s = s.replace(regex, val);
    });

    // Step 4: Recurrence Detection (Factorials)
    s = s.replace(/(\d+|n|i|k)!/g, 'factorial($1)');

    // Step 5: Secure Scoped Evaluation
    let fn;
    try {
      fn = new Function('n', 'factorial', `return ${s};`);
    } catch (e) {
      throw new Error("Syntax Error: Check brackets or operators.");
    }

    const result = fn(n, factorial);
    
    if (typeof result !== 'number') throw new Error("Result is not a numeric value.");
    if (isNaN(result)) throw new Error("Undefined result (likely square root of negative).");
    if (!isFinite(result)) throw new Error("Division by zero or infinite growth.");
    
    return result;
  } catch (e: any) {
    throw e;
  }
};
