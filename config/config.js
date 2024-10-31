const BLOG_GENERATION_TIMER = 7000;
const BLOG_QUERY =
  "Generate a blog out of them such that it contains exact lines, paragraphs, and quotes. At same time, pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively.\ must be in the  markdown format, and the blog title must be under 10 words.example: \ 'Best 10 books of 2023', \ 'Resume that cracked $300,000 Job at Google', \
'See How Volcanoes Shapes Earth', \
'Historical evolution of vaccies', \
'Why Quantum is important?', \
'You may not know this about cryptocurrencies', \
'Top Psychological Theories That Explain Human Behavior', \
'A only solar planet.', \
'Altrusim fundamentally cannot exists?', \
'Why nassim tableb wanted to become a philosopher'";

const CONTENT_DELETION_GAP = 10_000;//10sec
module.exports = {
  BLOG_GENERATION_TIMER,
  BLOG_QUERY,
  CONTENT_DELETION_GAP
};
