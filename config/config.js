const BLOG_GENERATION_TIMER = 7000;
const QUOTE_GENERATION_TIMER = 7000;
const BLOG_QUERY =
  "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs, and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively. \
The output should be in markdown format, and the blog title cannot be more than 10 words. It should also be informative, for example: \
'Best 10 books of 2023', \
'Resume that cracked $300,000 Job at Google', \
'See How Volcanoes Shapes Earth', \
'Historical evolution of vaccies', \
'Why Quantum is important?', \
'You may not know this about cryptocurrencies', \
'Top Psychological Theories That Explain Human Behavior', \
'A only solar planet.', \
'Altrusim fundamentally cannot exists?', \
'Why nassim tableb wanted to become a philosopher'";

module.exports = {
  BLOG_GENERATION_TIMER,
  QUOTE_GENERATION_TIMER,
  BLOG_QUERY,
  QUOTE_QUERY,
};
