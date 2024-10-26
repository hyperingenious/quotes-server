const BLOG_GENERATION_TIMER = 7000;
const QUOTE_GENERATION_TIMER = 7000;
const BLOG_QUERY =
  "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs, and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively. \
The output should be in markdown format, and the blog title cannot be more than 10 words. It should also be informative, for example: \
'The 10 Best Books of 2024', \
'The 10 Best Books of 2023', \
'The Resume That Got a Software Engineer a $300,000 Job at Google', \
'How Volcanoes Shape the Earth\\'s Landscape', \
'The History and Science Behind Vaccines', \
'Why Quantum Physics Is More Intuitive Than You Think', \
'Inside the World of Sustainable Fashion', \
'Understanding Cryptocurrencies: A Beginner’s Guide', \
'Top Psychological Theories That Explain Human Behavior', \
'How Solar Energy Is Transforming Power Grids', \
'Decoding DNA: How Genes Influence Traits', \
'The Ethics of Artificial Intelligence in Healthcare', \
'A Journey Through Ancient Philosophies and Modern Life'.";

const QUOTE_QUERY =
  "From all the chunks given, generate a quote out of them such that it contains the exact lines, paragraphs,and quotes under the hard constraint of 60 words only. you have to pick them in such a way that they can be understood in solitude without the need for any prior context.";

module.exports = {
  BLOG_GENERATION_TIMER,
  QUOTE_GENERATION_TIMER,
  BLOG_QUERY,
  QUOTE_QUERY,
};
