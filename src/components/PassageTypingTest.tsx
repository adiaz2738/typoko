"use client";

import { Quote } from "@/data/quotes";
import TypingTest from "./TypingTest";

interface Props {
  quote: Quote;
}

export default function PassageTypingTest({ quote }: Props) {
  return (
    <TypingTest
      key={quote.id}
      textMode="quotes"
      timerMode={60}
      flawlessMode={false}
      initialQuote={quote}
    />
  );
}
