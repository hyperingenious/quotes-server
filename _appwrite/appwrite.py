import os
import random
import fitz
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile
from appwrite.services.databases import Databases
from appwrite.id import ID

# Appwrite setup
client = Client()
client.set_endpoint(os.getenv('APPWRITE_CLOUD_URL')) \
      .set_project(os.getenv('APPWRITE_PROJECT_ID')) \
      .set_key(os.getenv('APPWRITE_APP_KEY'))

# Service instances
storage = Storage(client)
databases = Databases(client)

# Constants
DATABASE_ID = os.getenv('DATABASE_ID') 
BOOKS_COLLECTION_ID =os.getenv('BOOKS_COLLECTION_ID') 
CHUNKS_COLLECTION_ID = os.getenv('CHUNKS_COLLECTION_ID') 
BLOGS_COLLECTION_ID = os.getenv('BLOGS_COLLECTION_ID') 
QUOTE_COLLECTION_ID = os.getenv('QUOTE_COLLECTION_ID')
BUCKET_ID =os.getenv('BUCKET_ID') 
IMAGE_EXTRACT_PATH = '../front_page_extract/'

def upload_pdf(pdf_path):
    try:
        result = storage.create_file(
            bucket_id=BUCKET_ID,
            file_id=ID.unique(),
            file=InputFile.from_path(pdf_path),
        )
        print("PDF uploaded successfully.")
        return result
    except Exception as e:
        print(f"Error uploading PDF: {e}")

def upload_pdf_image(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        page = doc.load_page(0)
        images = page.get_images(full=True)
        
        if not images:
            print("No images found on the first page.")
            return

        # Extract image and save
        xref = images[0][0]
        image = doc.extract_image(xref)
        image_bytes = image["image"]
        os.makedirs(IMAGE_EXTRACT_PATH, exist_ok=True)
        output_path = os.path.join(IMAGE_EXTRACT_PATH, f"{ID.unique()}.png")

        with open(output_path, "wb") as img_file:
            img_file.write(image_bytes)

        # Upload image
        result = storage.create_file(
            bucket_id=BUCKET_ID,
            file_id=ID.unique(),
            file=InputFile.from_path(output_path)
        )
        print("PDF image uploaded successfully.")
        return result
    except Exception as e:
        print(f"Error uploading PDF image: {e}")
    finally:
        doc.close()

def add_upload_book_entry(data_obj):
    try:
        response = databases.create_document(
            database_id=DATABASE_ID,
            collection_id=BOOKS_COLLECTION_ID,
            document_id=ID.unique(),
            data=data_obj
        )
        print("Book entry added successfully.")
        return response
    except Exception as e:
        print(f"Error adding book entry: {e}")

def upload_pdf_chunk(chunk_data):
    try:
        databases.create_document(
            database_id=DATABASE_ID,
            collection_id=CHUNKS_COLLECTION_ID,
            document_id=ID.unique(),
            data=chunk_data
        )
    except Exception as e:
        print(f"Error uploading PDF chunk: {e}")

def add_blogs_and_quote(books_and_quote_array, book_id):
    try:
        blogs, quotes = books_and_quote_array
        for blog in blogs:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=BLOGS_COLLECTION_ID,
                document_id=ID.unique(),
                data={
                    'blog_markdown': blog,
                    'books': book_id
                }
            )
        for quote in quotes:
            databases.create_document(
                database_id=DATABASE_ID,
                collection_id=QUOTE_COLLECTION_ID,
                document_id=ID.unique(),
                data={
                    'quote_text': quote,
                    'books': book_id
                }
            )
        print("Blogs and quotes uploaded successfully.")
    except Exception as e:
        print(f"Error uploading blogs and quotes: {e}")