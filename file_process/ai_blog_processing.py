import google.generativeai as genai
from google.generativeai import caching
import uuid
import datetime
import time
import asyncio
import os


# Configure the API key
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# Queries for blog and quote generation
BLOG_QUERY = (
    "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs, "
    "and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude "
    "without the need for any prior context, and it should also feel like a blog, not like you are reading an extract "
    "from a book. Organize them creatively."
)

QUOTE_QUERY = (
    "From all the chunks given, generate a quote out of them such that it contains the exact lines, paragraphs, "
    "and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude "
    "without the need for any prior context."
)

async def generate_10_blogs(filepath):
    try:
        # Upload the file
        file = genai.upload_file(path=filepath)
        
        while file.state.name == 'PROCESSING':
            print('Waiting for file to be processed.')
            await asyncio.sleep(2)
            file = genai.get_file(file.name)

        # Create a cache with a 20-minute TTL
        cache = caching.CachedContent.create(
            model='models/gemini-1.5-flash-001',
            display_name=str(uuid.uuid4()),
            system_instruction=(
                'You are going to be given a JSON file that contains random 1000-word chunks from books with their names. '
                'You have to digest all of them and return the response in markdown. Each time you must give a different '
                'response regardless of the query. Be creative.'
            ),
            contents=[file],
            ttl=datetime.timedelta(minutes=20),
        )

        model = genai.GenerativeModel.from_cached_content(cached_content=cache)

        blog_list = []
        quotes_list = []

        # Generate blog content
        async def gen_blog():
            try:
                response_blog = model.generate_content([BLOG_QUERY])
                blog_list.append(response_blog.text)
            except Exception as e:
                print(f"Error generating blog: {e}")

        # Generate quote content
        async def gen_quote():
            try:
                response_quote = model.generate_content([QUOTE_QUERY])
                quotes_list.append(response_quote.text)
            except Exception as e:
                print(f"Error generating quote: {e}")

        # Generate 5 blogs (delaying between calls)
        for _ in range(5):
            await asyncio.sleep(10)
            await gen_blog()

        # Generate 20 quotes (delaying between calls)
        for _ in range(20):
            await asyncio.sleep(10)
            await gen_quote()

        print([blog_list, quotes_list])
        return [blog_list, quotes_list]

    except Exception as e:
        print(f"Error in generating blogs or quotes: {e}")