from flask import Flask, request, Blueprint, jsonify
from werkzeug.utils import secure_filename
import os
import asyncio
from file_process import file_process
from concurrent.futures import ThreadPoolExecutor
import traceback

def handle_file_process_result(future):
    try:
        result = future.result()
        print(f"File processed successfully: {result}")
    except Exception as e:
        print(f"Error in file processing: {str(e)}")
        print(traceback.format_exc())

UPLOAD_FOLDER = 'uploads/'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

upload = Blueprint('upload', __name__)

executor = ThreadPoolExecutor()

@upload.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    if request.method == 'POST':
        try:
            if 'file' not in request.files:
                return jsonify({"error": "No file part"}), 400
            file = request.files['file']

            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400

            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)

                tasks = [file_process(file_path)]
                results = loop.run_until_complete(asyncio.gather(*tasks))
                
                return jsonify({"results": results}), 202
            
            return jsonify({"error": "File type not allowed"}), 400
        
        except Exception as e:
            error_response = {
                "error": "An error occurred during file upload or processing.",
                "details": str(e),
                "trace": traceback.format_exc()
            }
            return jsonify(error_response), 500

    return jsonify({"error": "Invalid request method"}), 405