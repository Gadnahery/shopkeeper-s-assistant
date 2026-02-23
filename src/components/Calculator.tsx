import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function safeEval(expr: string): string {
  const sanitized = expr.replace(/[^\d+\-*/().\s]/g, "");
  const tokens = sanitized.match(/\d+(\.\d+)?|[()+\-*/]/g);
  if (!tokens || tokens.length === 0) return "Error";

  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const output: string[] = [];
  const ops: string[] = [];

  for (const token of tokens) {
    if (/^\d+(\.\d+)?$/.test(token)) {
      output.push(token);
      continue;
    }
    if (token in precedence) {
      while (
        ops.length &&
        ops[ops.length - 1] in precedence &&
        precedence[ops[ops.length - 1]] >= precedence[token]
      ) {
        output.push(ops.pop()!);
      }
      ops.push(token);
      continue;
    }
    if (token === "(") {
      ops.push(token);
      continue;
    }
    if (token === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop()!);
      }
      if (ops.length === 0 || ops[ops.length - 1] !== "(") return "Error";
      ops.pop();
    }
  }

  while (ops.length) {
    const op = ops.pop()!;
    if (op === "(" || op === ")") return "Error";
    output.push(op);
  }

  const stack: number[] = [];
  for (const token of output) {
    if (/^\d+(\.\d+)?$/.test(token)) {
      stack.push(Number(token));
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) return "Error";
    if (token === "+") stack.push(a + b);
    else if (token === "-") stack.push(a - b);
    else if (token === "*") stack.push(a * b);
    else if (token === "/") stack.push(b === 0 ? NaN : a / b);
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) return "Error";
  return String(stack[0]);
}

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Calculator({ open, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [fullExpr, setFullExpr] = useState("");

  const handleInput = (char: string) => {
    if (char === "C") {
      setDisplay("0");
      setFullExpr("");
      return;
    }
    if (char === "=") {
      if (!fullExpr.trim()) return;
      const result = safeEval(fullExpr);
      setDisplay(result);
      setFullExpr("");
      return;
    }
    const newExpr = fullExpr + char;
    setFullExpr(newExpr);
    setDisplay(newExpr);
  };

  const backspace = () => {
    if (fullExpr.length <= 1) {
      setDisplay("0");
      setFullExpr("");
    } else {
      const next = fullExpr.slice(0, -1);
      setFullExpr(next);
      setDisplay(next);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleInput(key);
        return;
      }
      if (["+", "-", "*", "/", "(", ")"].includes(key)) {
        e.preventDefault();
        handleInput(key);
        return;
      }
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleInput("=");
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (key === "c" || key === "C") {
        e.preventDefault();
        handleInput("C");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, fullExpr]);

  const buttons: { label: string; value: string; className?: string }[] = [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "÷", value: "/" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "×", value: "*" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "−", value: "-" },
    { label: "0", value: "0" },
    { label: "(", value: "(" },
    { label: ")", value: ")" },
    { label: "+", value: "+" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-4 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg border bg-muted/50 px-4 py-3 font-mono text-right text-2xl min-h-[48px] break-all">
            {display || "0"}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" className="col-span-2 h-12" onClick={() => handleInput("C")}>
              Clear
            </Button>
            <Button variant="outline" className="h-12" onClick={backspace}>
              ⌫
            </Button>
            <Button className="h-12" onClick={() => handleInput("=")}>
              =
            </Button>
            {buttons.map((b) => (
              <Button key={b.value} variant="outline" className="h-12 text-lg" onClick={() => handleInput(b.value)}>
                {b.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
