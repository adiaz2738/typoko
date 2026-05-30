"use client";

import { Quote } from "@/data/quotes";
import TypingTest from "./TypingTest";

interface Props {
  quote: Quote;
  resultsNote?: string;
}

export default function PassageTypingTest({ quote, resultsNote }: Props) {
  return (
    <TypingTest
      key={quote.id}
      textMode="quotes"
      timerMode={60}
      flawlessMode={false}
      initialQuote={quote}
      resultsNote={resultsNote}
    />
  );
}
