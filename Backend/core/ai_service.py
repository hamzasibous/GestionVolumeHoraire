import os
import google.generativeai as genai
from PIL import Image
import json

class AIService:
    def __init__(self):
        # Ensure you add GOOGLE_API_KEY to your .env file
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Using gemini-flash-latest which is available in your environment
            self.model = genai.GenerativeModel('gemini-flash-latest')
        else:
            self.model = None

    def extract_vacations_from_image(self, image_file):
        if not self.model:
            return {"error": "Google API Key not configured"}

        try:
            img = Image.open(image_file)
            
            prompt = """
            Analyze this image of a calendar, decree, or holiday list.
            Extract all holidays or vacation periods.
            Return ONLY a JSON list of objects with these keys:
            - titre: (string) name of the holiday
            - date_debut: (string) YYYY-MM-DD
            - date_fin: (string) YYYY-MM-DD
            - type_conge: (string) e.g., 'Public Holiday'
            
            Example format:
            [{"titre": "Summer Break", "date_debut": "2024-07-01", "date_fin": "2024-08-31", "type_conge": "Public Holiday"}]
            """

            response = self.model.generate_content([prompt, img])
            
            # Clean the response to ensure it's valid JSON
            content = response.text.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            return json.loads(content)
        except Exception as e:
            return {"error": str(e)}
