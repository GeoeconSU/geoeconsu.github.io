# Strategic Briefs Automated Pipeline

This repository includes an automated content pipeline that processes PDF strategic briefs and updates the website automatically.

## 🎯 How It Works

1. **Upload PDF** → Drop a PDF file into the `/pdfs/` folder
2. **Auto-Process** → GitHub Actions extracts text and generates metadata using Gemini AI
3. **Auto-Update** → `briefs.json` is updated with the new brief
4. **Auto-Display** → Website automatically shows the new brief (no code changes needed!)

## 📁 Directory Structure

```
/pdfs/               - Upload new PDF briefs here
/insights/           - Legacy PDF location (for existing briefs)
briefs.json          - Metadata file (auto-generated, don't edit manually)
.processed_pdfs.json - Tracking file (auto-generated, gitignored)
process_pdf.py       - Python script that processes PDFs
load-briefs.js       - Frontend loader that displays briefs
```

## 🚀 Setup Instructions

### 1. GitHub Secret Configuration

The pipeline uses Gemini AI for metadata extraction. You need to add your API key as a GitHub secret:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `GEMINI_API_KEY`
5. Value: Your Gemini API key
6. Click **"Add secret"**

### 2. Local Testing (Optional)

To test the script locally before pushing:

```bash
# Install dependencies
pip install -r requirements.txt

# Set your API key
export GEMINI_API_KEY="your-api-key-here"

# Run the script
python process_pdf.py
```

## 📝 Usage

### Adding a New Strategic Brief

1. **Prepare your PDF**
   - Ensure the PDF has clear text on the first 2 pages
   - Include title, author, and description in the content
   - Name the file descriptively (e.g., `market-analysis-2026.pdf`)

2. **Upload the PDF**
   ```bash
   # Add your PDF to the pdfs folder
   cp /path/to/your-brief.pdf pdfs/

   # Commit and push
   git add pdfs/your-brief.pdf
   git commit -m "Add new strategic brief: Your Title"
   git push
   ```

3. **Automatic Processing**
   - GitHub Actions triggers automatically
   - PDF text is extracted
   - Gemini AI generates metadata
   - `briefs.json` is updated
   - Changes are auto-committed

4. **Verify**
   - Visit your website
   - The new brief appears in the Strategic Briefs section
   - No manual HTML editing required!

## 🔧 How the AI Extraction Works

The Gemini AI model analyzes the first 2 pages of your PDF and extracts:

- **Category**: A short tag (e.g., "MARKET ACCESS", "GEOPOLITICAL OUTLOOK")
- **Title**: Main title (2-5 words)
- **Subtitle**: Descriptive subtitle
- **Author**: Author name (defaults to "GSU Research Team" if not found)
- **Description**: Compelling 1-2 sentence summary (max 150 characters)

## 📊 Data Format

The `briefs.json` file has this structure:

```json
{
  "briefs": [
    {
      "category": "MARKET ACCESS",
      "title": "Saudi Market Opening",
      "subtitle": "Foreign Investment & Vision 2030 Reforms",
      "author": "Niamh Allen",
      "description": "Saudi Arabia removes key barriers to foreign investment...",
      "filename": "market-analysis.pdf",
      "href": "pdfs/market-analysis.pdf",
      "processed_date": "2026-02-06T20:30:00.000000"
    }
  ]
}
```

## 🎨 Frontend Integration

The `load-briefs.js` script:
- Fetches `briefs.json` on page load
- Generates HTML cards matching the existing UI design
- Uses the same styling as manual cards
- Handles errors gracefully

## 🔄 Workflow Details

**GitHub Action:** `.github/workflows/update_briefs.yml`

**Triggers:**
- Push to `pdfs/*.pdf`
- Manual trigger via Actions tab

**Steps:**
1. Checkout repository
2. Install Python dependencies
3. Run `process_pdf.py`
4. Auto-commit changes to `briefs.json`

## 🐛 Troubleshooting

### PDF not processing?
- Check GitHub Actions tab for errors
- Verify `GEMINI_API_KEY` secret is set
- Ensure PDF has readable text (not scanned images)

### Metadata incorrect?
- The AI extraction may need tuning
- Edit `briefs.json` manually if needed
- Consider improving PDF formatting for better extraction

### Brief not showing on website?
- Check browser console for errors
- Verify `briefs.json` is valid JSON
- Check that `load-briefs.js` is loaded

## 🔐 Security Notes

- `GEMINI_API_KEY` is stored as a GitHub secret (never in code)
- `.processed_pdfs.json` is gitignored (tracks local state only)
- API calls are made securely from GitHub Actions

## 📚 File Reference

| File | Purpose |
|------|---------|
| `process_pdf.py` | Main processing script |
| `briefs.json` | Metadata database (auto-generated) |
| `load-briefs.js` | Frontend loader |
| `.github/workflows/update_briefs.yml` | GitHub Actions workflow |
| `requirements.txt` | Python dependencies |
| `.processed_pdfs.json` | Tracks processed files (gitignored) |

## 🎓 Advanced Usage

### Manual Processing

```bash
# Process specific PDF
python process_pdf.py

# The script automatically finds new PDFs in pdfs/ folder
# and skips already-processed files
```

### Reprocessing All PDFs

```bash
# Delete the tracking file
rm .processed_pdfs.json

# Run the script
python process_pdf.py

# All PDFs will be reprocessed
```

### Customizing AI Prompts

Edit the `extract_metadata_with_gemini()` function in `process_pdf.py` to customize:
- Prompt text
- Field extraction
- Description length limits
- Category options

---

**Questions?** Contact the GSU tech team or open an issue in the repository.
