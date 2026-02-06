#!/usr/bin/env python3
"""
PDF Processing Script for GSU Strategic Briefs
Extracts text from PDFs, uses Gemini AI to generate metadata, and updates briefs.json
"""

import os
import json
import hashlib
import fitz  # PyMuPDF
import google.generativeai as genai
from pathlib import Path
from datetime import datetime

# Configuration
PDF_DIR = "pdfs"
INSIGHTS_DIR = "insights"
BRIEFS_JSON = "briefs.json"
PROCESSED_LOG = ".processed_pdfs.json"
GEMINI_MODEL = "gemini-2.5-flash"

def get_file_hash(filepath):
    """Generate SHA256 hash of file for tracking"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def load_processed_files():
    """Load list of already processed PDF hashes"""
    if os.path.exists(PROCESSED_LOG):
        with open(PROCESSED_LOG, 'r') as f:
            return json.load(f)
    return {}

def save_processed_files(processed):
    """Save list of processed PDF hashes"""
    with open(PROCESSED_LOG, 'w') as f:
        json.dump(processed, f, indent=2)

def extract_pdf_text(pdf_path, max_pages=2):
    """Extract text from first N pages of PDF"""
    try:
        doc = fitz.open(pdf_path)
        text = ""

        # Extract from first max_pages
        for page_num in range(min(max_pages, len(doc))):
            page = doc[page_num]
            text += page.get_text()

        doc.close()
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return None

def extract_metadata_with_gemini(text, filename):
    """Use Gemini AI to extract structured metadata from PDF text"""

    # Configure Gemini API
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    prompt = f"""You are analyzing a strategic brief document. Extract the following metadata and return ONLY a valid JSON object with no additional text or markdown formatting.

Document text:
{text[:3000]}

Return a JSON object with these exact fields:
- category: A SHORT category tag (e.g., "MARKET ACCESS", "GEOPOLITICAL OUTLOOK", "CRISIS RESPONSE", "SUPPLY CHAIN RISK")
- title: The main title (concise, 2-5 words)
- subtitle: A descriptive subtitle (one sentence)
- author: Author name (if found, otherwise use "GSU Research Team")
- description: A compelling 1-2 sentence description (MAX 150 characters)

Return ONLY the JSON object, no other text:"""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Clean up response - remove markdown code blocks if present
        if result_text.startswith('```'):
            # Remove ```json and ``` markers
            result_text = result_text.replace('```json', '').replace('```', '').strip()

        metadata = json.loads(result_text)

        # Validate required fields
        required_fields = ['category', 'title', 'subtitle', 'author', 'description']
        for field in required_fields:
            if field not in metadata:
                raise ValueError(f"Missing required field: {field}")

        # Ensure description is within limit
        if len(metadata['description']) > 150:
            metadata['description'] = metadata['description'][:147] + "..."

        return metadata

    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response as JSON: {e}")
        print(f"Response was: {result_text}")
        return None
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def load_briefs_json():
    """Load existing briefs.json or create empty structure"""
    if os.path.exists(BRIEFS_JSON):
        with open(BRIEFS_JSON, 'r') as f:
            return json.load(f)
    return {"briefs": []}

def save_briefs_json(data):
    """Save briefs.json with pretty formatting"""
    with open(BRIEFS_JSON, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def process_new_pdfs():
    """Main function to process new PDFs"""

    # Check for pdfs directory
    if not os.path.exists(PDF_DIR):
        print(f"Creating {PDF_DIR} directory...")
        os.makedirs(PDF_DIR)
        return

    # Load tracking data
    processed_files = load_processed_files()
    briefs_data = load_briefs_json()

    # Find all PDFs in pdfs/ directory
    pdf_files = list(Path(PDF_DIR).glob("*.pdf"))

    if not pdf_files:
        print(f"No PDFs found in {PDF_DIR}/")
        return

    new_briefs = []

    for pdf_path in pdf_files:
        filename = pdf_path.name
        file_hash = get_file_hash(pdf_path)

        # Skip if already processed
        if file_hash in processed_files.values():
            print(f"⏭️  Skipping {filename} (already processed)")
            continue

        print(f"\n📄 Processing: {filename}")

        # Extract text from PDF
        text = extract_pdf_text(pdf_path)
        if not text:
            print(f"❌ Failed to extract text from {filename}")
            continue

        print(f"✓ Extracted {len(text)} characters")

        # Get metadata from Gemini
        metadata = extract_metadata_with_gemini(text, filename)
        if not metadata:
            print(f"❌ Failed to extract metadata from {filename}")
            continue

        print(f"✓ Extracted metadata: {metadata['title']}")

        # Create brief entry
        brief_entry = {
            "category": metadata['category'],
            "title": metadata['title'],
            "subtitle": metadata['subtitle'],
            "author": metadata['author'],
            "description": metadata['description'],
            "filename": filename,
            "href": f"pdfs/{filename}",
            "processed_date": datetime.now().isoformat()
        }

        new_briefs.append(brief_entry)

        # Mark as processed
        processed_files[filename] = file_hash

        print(f"✅ Successfully processed {filename}")

    if new_briefs:
        # Prepend new briefs to the array (most recent first)
        briefs_data['briefs'] = new_briefs + briefs_data['briefs']

        # Save updated briefs.json
        save_briefs_json(briefs_data)
        print(f"\n✅ Updated {BRIEFS_JSON} with {len(new_briefs)} new brief(s)")

        # Save processed files log
        save_processed_files(processed_files)
        print(f"✅ Updated {PROCESSED_LOG}")
    else:
        print("\n✓ No new PDFs to process")

if __name__ == "__main__":
    print("=" * 60)
    print("GSU Strategic Briefs - PDF Processor")
    print("=" * 60)
    process_new_pdfs()
    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)
