from flask import Flask, render_template, request, jsonify, send_file
import google.generativeai as genai
from dotenv import load_dotenv
import os
import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Configure API keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("❌ Error: GEMINI_API_KEY is missing. Set it in the .env file.")

# Expanded food recommendations for vitamins
VITAMIN_FOOD_MAP = {
    "Vitamin A": ["Carrots", "Spinach", "Sweet potatoes", "Egg yolks", "Liver", "Dairy products"],
    "Vitamin B1 (Thiamine)": ["Whole grains", "Pork", "Nuts", "Seeds", "Legumes"],
    "Vitamin B2 (Riboflavin)": ["Milk", "Eggs", "Green leafy vegetables", "Almonds"],
    "Vitamin B3 (Niacin)": ["Chicken", "Turkey", "Fish", "Peanuts", "Mushrooms"],
    "Vitamin B5 (Pantothenic Acid)": ["Avocados", "Sunflower seeds", "Eggs", "Dairy products"],
    "Vitamin B6 (Pyridoxine)": ["Bananas", "Potatoes", "Chicken", "Fish", "Nuts"],
    "Vitamin B7 (Biotin)": ["Eggs", "Almonds", "Whole grains", "Spinach"],
    "Vitamin B9 (Folate/Folic Acid)": ["Leafy greens", "Lentils", "Citrus fruits", "Beets"],
    "Vitamin B12": ["Meat", "Fish", "Dairy products", "Eggs", "Fortified cereals"],
    "Vitamin C": ["Oranges", "Strawberries", "Bell peppers", "Broccoli", "Kiwi"],
    "Vitamin D": ["Salmon", "Egg yolks", "Mushrooms", "Fortified milk"],
    "Vitamin E": ["Almonds", "Sunflower seeds", "Spinach", "Avocado"],
    "Vitamin K": ["Kale", "Spinach", "Broccoli", "Brussels sprouts"],
    "Iron": ["Red meat", "Lentils", "Spinach", "Tofu", "Pumpkin seeds"]
}

# Disease Info API (If you have a structured database/API)
DISEASE_API_URL = "https://disease.sh/v3/covid-19/all"  # Replace with actual API URL

def get_disease_info(disease_name):
    """
    Fetches disease information from an external API.
    If the API fails or returns no data, falls back to Google Gemini API.
    """
    try:
        response = requests.get(DISEASE_API_URL, params={"query": disease_name}, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "name": data.get("name", "Unknown"),
                "symptoms": ", ".join(data.get("symptoms", [])),
                "causes": ", ".join(data.get("causes", [])),
                "treatment": data.get("treatment", "No data available")
            }
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Disease API Error: {e}")

    # If API fails, fall back to Google Gemini AI
    return get_medical_info(disease_name)

def get_medical_info(disease_name):
    """
    Fetches medical information using Google Gemini API.
    """
    if not GEMINI_API_KEY:
        return "❌ Error: Missing Google Gemini API Key."

    prompt = f"Provide a detailed medical summary on {disease_name}. Include causes, symptoms, treatments, and related vitamin deficiencies."

    try:
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        response = model.generate_content(prompt)

        if response and hasattr(response, "text"):
            result = response.text
        else:
            return "❌ Error: Unable to fetch disease details."

        # Check for vitamin mentions and suggest foods
        food_suggestions = ""
        for vitamin, foods in VITAMIN_FOOD_MAP.items():
            if vitamin.lower() in result.lower():
                food_suggestions += f"\n**Recommended Foods for {vitamin}:** " + ", ".join(foods)

        # Append food recommendations if found
        if food_suggestions:
            result += "\n\n**Dietary Recommendations:**" + food_suggestions

        return result

    except Exception as e:
        print(f"⚠️ Gemini API Error: {e}")
        return f"❌ Error: Could not retrieve disease information due to an error: {str(e)}"

def generate_pdf(content, filename="disease_info.pdf"):
    """
    Generates a PDF with the provided content.
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    c.drawString(72, height - 72, "Disease Information")
    c.drawString(72, height - 108, content)
    c.save()
    buffer.seek(0)
    with open(filename, "wb") as f:
        f.write(buffer.read())
    print(f"PDF generated and saved as {filename}")
    return filename

@app.route('/disease_info')
def disease_info():
    disease_query = request.args.get('query')
    disease_info = get_disease_info(disease_query)
    if isinstance(disease_info, str):
        return jsonify({"error": disease_info})
    pdf_filename = generate_pdf(disease_info, filename=f"{disease_query}_info.pdf")
    return jsonify({
        "name": disease_info["name"],
        "symptoms": disease_info["symptoms"],
        "causes": disease_info["causes"],
        "treatment": disease_info["treatment"],
        "pdf_filename": pdf_filename
    })

@app.route('/download/<filename>')
def download(filename):
    return send_file(filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)