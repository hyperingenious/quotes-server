import pdfplumber

def chunk_pdf(pdf_path, chunk_size=1000):
    chunks = []
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
    words = full_text.split()
    for i in range(0, len(words), chunk_size):
        chunk = words[i:i + chunk_size]
        chunks.append(' '.join(chunk))  
    return chunks