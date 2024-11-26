const BLOG_GENERATION_TIMER = 7000;
const BLOG_QUERY = `Generate a blog post based on the provided text or PDF. The content should be well-structured and engaging, focusing on key themes, ideas, and arguments from the text. Include relevant direct quotes or excerpts from the document to support the main points. Follow these instructions:

1. **Title**: Create a compelling and short title that reflects the main focus of the content. Example: 'Why Flowers are Beautiful?'

2. **Introduction**: Write a brief and captivating introduction that sets the context, introduces the text, and teases the main ideas. Length: 75-150 words.

3. **Sections**: 
   - Divide the blog into logical sections based on key ideas, themes, or chapters from the document.
   - For each section, provide:
     - A descriptive subheading summarizing the section.
     - An overview of the section’s main argument or idea in a few sentences.
     - Direct quotes or excerpts from the source text that are impactful or central to the section’s message (use blockquote style or inline quotes).
     - Analysis: Provide commentary, explanation, or context to enhance reader understanding.

   Example section:
   - **Heading**: 'Faith as a Lever of Human Behavior'
     - Overview: Summarize how deeply-held beliefs influence actions and decision-making.
     - Quotes: 'A belief is a lever that, once pulled, moves almost everything else in a person’s life.' 
     - Analysis: Harris emphasizes that beliefs are powerful forces shaping human behavior, often leading to extreme actions such as martyrdom.

4. **Conclusion**: Write a conclusion that summarizes the key takeaways and discusses the relevance or implications of the ideas presented. Include a final reflection on the impact of the book’s message.

Make your you have to struckete this in such a make that if contains exact lines excact paragraphs from the text you have provided`;

const SYSTEM_INSTRUCTIONS = `1. **Input Type**: The input will be a text or PDF document. You need to process and extract key ideas from this text.
   
2. **Output Format**: The output should be a blog post, which is structured and engaging. It should be easy to read and highlight key points and arguments from the text with proper citation of quotes.

3. **Tone**: The blog should be written in an engaging, reader-friendly, and insightful tone. Avoid overly formal language but maintain a thoughtful and critical perspective.

4. **Voice**: The voice should be neutral but slightly enthusiastic, aiming to convey interest in the subject while keeping the tone informative.

5. **Complexity**: The blog post should be accessible to a general audience. Avoid technical jargon unless it's explained in a simple manner.

6. **Structure**: 
   - Create a **title** that reflects the central theme of the content.
   - Write an **introduction** that sets the stage and teases the key ideas.
   - Organize the blog into **sections**, each with a clear heading and explanation. Each section should focus on a specific theme, providing quotes and analysis.
   - Conclude with a **summary** and final thoughts on the relevance or implications of the book’s message. 

7. **Quotes and Analysis**: Include **direct quotes** from the text that are impactful. Provide analysis that explains the significance of each quote in the context of the section’s theme.`;

// const CONTENT_DELETION_GAP = 10_000; //10sec
const CONTENT_DELETION_GAP = 1000;//10sec

module.exports = {
  BLOG_GENERATION_TIMER,
  BLOG_QUERY,
  CONTENT_DELETION_GAP,
  SYSTEM_INSTRUCTIONS,
};
