const BLOG_GENERATION_TIMER = 7000;
const QUOTE_GENERATION_TIMER = 7000;
const BLOG_QUERY =
  "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively. The output should be in markdown format.";

const QUOTE_QUERY =
  "From all the chunks given, generate a quote out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context. and SHould not exceed 420 characters";


module.exports = {
  BLOG_GENERATION_TIMER,
  QUOTE_GENERATION_TIMER,
  BLOG_QUERY,
  QUOTE_QUERY,
};
