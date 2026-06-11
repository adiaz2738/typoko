export interface BlogPost {
  slug: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  excerpt: string;
}

export const posts: BlogPost[] = [
  {
    slug: "best-typing-tests-for-book-lovers",
    title: "The Best Typing Tests for Book Lovers",
    date: "2026-06-11",
    excerpt:
      "Most typing tests throw random words at you. If you'd rather practice on real prose — Orwell, Austen, Poe, Milton — here's why typing literature makes you faster, and where to find it.",
  },
];
