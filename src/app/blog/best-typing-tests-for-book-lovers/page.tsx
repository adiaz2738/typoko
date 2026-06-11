import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { posts } from "@/data/posts";

const post = posts.find((p) => p.slug === "best-typing-tests-for-book-lovers")!;

export const metadata: Metadata = {
  title: `${post.title} | Typoko`,
  description: post.excerpt,
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BestTypingTestsForBookLoversPost() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <article className="w-full max-w-2xl flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Link
              href="/blog"
              className="font-mono text-xs text-muted hover:text-subtle transition-colors w-fit"
            >
              ← back to blog
            </Link>
            <p className="font-mono text-xs text-muted">{formatDate(post.date)}</p>
            <h1 className="font-mono text-2xl sm:text-3xl text-text font-bold leading-tight">
              {post.title}
            </h1>
          </div>

          <div className="flex flex-col gap-6 font-mono text-base text-subtle leading-8">
            <p>
              Most typing tests give you the same thing: random common words, shuffled into
              meaningless sentences, over and over. It works fine if all you care about is a WPM
              number. But if you actually like to read, typing the same forty filler words on
              repeat gets old fast — and it doesn&apos;t teach you much about typing the way
              real writing actually flows.
            </p>

            <h2 className="font-mono text-xl text-text font-bold pt-2">
              Why typing real prose is better practice
            </h2>

            <p>
              Literature is full of the things random word generators leave out: long sentences
              with subordinate clauses, dialogue with quotation marks and em dashes, varied
              punctuation, capitalization patterns, and rhythm. Typing a passage from{" "}
              <em>Pride and Prejudice</em> or <em>1984</em> forces your fingers to handle commas,
              semicolons, and contractions in context — not as isolated drills, but as part of
              sentences your brain is actually trying to read and understand at the same time.
            </p>

            <p>
              That combination — reading for meaning while typing for accuracy — is closer to
              real-world typing than a word list will ever be. It&apos;s also just more
              enjoyable. A minute of <em>The Raven</em> or the opening of{" "}
              <em>Frankenstein</em> is a minute well spent, even if your WPM doesn&apos;t move at
              all.
            </p>

            <h2 className="font-mono text-xl text-text font-bold pt-2">
              What to look for in a literary typing test
            </h2>

            <p>
              Not every site that offers &ldquo;quote mode&rdquo; is built for readers. A few
              things make a real difference:
            </p>

            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>
                <strong className="text-text">Real, attributed passages.</strong> Excerpts from
                actual books and authors — not generic inspirational quotes — with the title and
                author shown so you know what you&apos;re typing.
              </li>
              <li>
                <strong className="text-text">Long-form text, not just one-liners.</strong> Short
                quotes end before you find a rhythm. Full paragraphs let you settle in.
              </li>
              <li>
                <strong className="text-text">A way to find more from authors you like.</strong>{" "}
                If you enjoyed typing a passage from Orwell, you should be able to find more
                Orwell easily.
              </li>
              <li>
                <strong className="text-text">No interruptions mid-sentence.</strong> The text
                should keep flowing for longer or untimed sessions instead of cutting off
                arbitrarily.
              </li>
            </ul>

            <h2 className="font-mono text-xl text-text font-bold pt-2">
              Typing real books on Typoko
            </h2>

            <p>
              This is exactly what we built Typoko around. Every quote in our{" "}
              <Link href="/library" className="text-accent hover:opacity-75 transition-opacity">
                library
              </Link>{" "}
              is a real excerpt — Milton, Poe, Austen, Orwell, Homer, and more — tagged with its
              author and source so you can browse by writer or just stumble onto something new.
              Switch to quotes mode from the home page and you&apos;ll get a full passage instead
              of a word salad, and for untimed or 5-minute sessions, the next passage loads in
              seamlessly so your reading never has to stop.
            </p>

            <p>
              If you want a quick daily habit, the{" "}
              <Link href="/daily" className="text-accent hover:opacity-75 transition-opacity">
                Today&apos;s Passage
              </Link>{" "}
              challenge gives everyone the same 60-second excerpt each day, with a leaderboard if
              you&apos;re feeling competitive. And if you&apos;re working on accuracy rather than
              speed,{" "}
              <Link href="/focus" className="text-accent hover:opacity-75 transition-opacity">
                Focus Mode
              </Link>{" "}
              slows things down and tracks the specific mistakes you make as you type.
            </p>

            <p>
              Either way, the goal is the same: spend your typing practice with sentences worth
              reading. Your WPM will catch up.
            </p>
          </div>

          <Link
            href="/blog"
            className="font-mono text-xs text-muted hover:text-subtle transition-colors w-fit"
          >
            ← back to blog
          </Link>
        </article>
      </main>

      <footer className="py-4 text-center text-xs text-muted font-mono border-t border-border">
        typoko &copy; {new Date().getFullYear()} &nbsp;·&nbsp; real literature. real challenge.
      </footer>
    </div>
  );
}
