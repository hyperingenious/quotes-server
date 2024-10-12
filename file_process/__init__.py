import os
import random
import uuid
import json
import asyncio
import traceback

from _appwrite.appwrite import upload_pdf, upload_pdf_image, add_upload_book_entry, upload_pdf_chunk, add_blogs_and_quote
from .chunk_pdf import chunk_pdf
from .ai_blog_processing import generate_10_blogs
import PyPDF2

project_id = os.getenv('APPWRITE_PROJECT_ID') 
bucket_id = os.getenv('APPWRITE_BUCKET_ID') 

def get_pdf_title(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            title = reader.metadata.title if reader.metadata.title else "No title found"
        print("PDF title retrieved.")
        return title
    except Exception as e:
        print(f"Error retrieving PDF title: {str(e)}")
        return "Error retrieving title"

async def file_process(pdf_path):
    try:
        pdf_upload_res = upload_pdf(pdf_path)
        print("PDF uploaded successfully.")
        
        pdf_id = pdf_upload_res['$id']
        pdf_url = f"https://cloud.appwrite.io/v1/storage/buckets/{bucket_id}/files/{pdf_id}/view?project={project_id}&mode=admin"

        pdf_banner_res = upload_pdf_image(pdf_path)
        print("PDF image uploaded successfully.")

        pdf_image_id = pdf_banner_res['$id']
        pdf_image_url = f"https://cloud.appwrite.io/v1/storage/buckets/{bucket_id}/files/{pdf_image_id}/view?project={project_id}&mode=admin"

        title = get_pdf_title(pdf_path)

        data_obj = {
            'book_name': title,
            'book_image': pdf_image_url,
            'pdf_link': pdf_url
        }

        upload_book_entry_res = add_upload_book_entry(data_obj)
        print("Book entry added successfully.")
        upload_book_entry_id = upload_book_entry_res['$id']

        chunks = chunk_pdf(pdf_path)
        print("PDF chunks created successfully.")

        print('Started to upload chunks...')
        for chunk in chunks:
            chunk_data = {
                'chunk_text': chunk,
                'books': upload_book_entry_id
            }
            upload_pdf_chunk(chunk_data)
        print("All chunks uploaded successfully.")

        fifty_percent_chunks_number = len(chunks) * 30 // 100
        fifty_percent_chunks_list = random.sample(chunks, fifty_percent_chunks_number)

        output_dir = os.path.join(os.getcwd(), 'selected_json')
        os.makedirs(output_dir, exist_ok=True)

        filepath = os.path.join(output_dir, f"{uuid.uuid4()}.txt")

        with open(filepath, 'w', encoding='utf-8') as text_file:
            for the_chunk in fifty_percent_chunks_list:
                text_file.write(the_chunk + '\n')
                text_file.write('=' * 80)

        print("50% random chunks saved to file successfully.")

        ai_generated_content = await generate_10_blogs(filepath)
        print("Blog generation completed successfully.")

        add_blogs_and_quote(ai_generated_content, upload_book_entry_id)
        print("Blogs and quotes uploaded successfully.")

        return {
            "message": "File processed successfully",
            "data": {
                "title": title,
                "pdf_url": pdf_url,
                "pdf_image_url": pdf_image_url
            }
        }

    except Exception as e:
        print(f"Error during file processing: {str(e)}")
        print(traceback.format_exc())
        return {
            "error": "File processing failed",
            "details": str(e)
        }