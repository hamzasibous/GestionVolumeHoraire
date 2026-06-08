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
            return {"error": "Google API Key not configured or model not initialized"}

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

    def extract_timetable_from_image(self, image_file):
        if not self.model:
            return {"error": "Google API Key not configured or model not initialized"}

        try:
            img = Image.open(image_file)
            
            # Convert to RGB if needed (e.g. PNGs with alpha)
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Do NOT aggressively resize. Dense timetables require high resolution.
            # Only resize if the image is astronomically large (e.g., > 4000px) to avoid payload limits.
            img.thumbnail((3500, 3500), Image.Resampling.LANCZOS)
            
            prompt = """
            You are an expert AI specialized in reading complex, dense university timetables (Emplois du temps) from images.
            Carefully analyze this timetable grid. The columns usually represent days of the week, and the rows represent time slots.
            
            CRITICAL RULES FOR EXTRACTION:
            1. EXTRACT EXACT TEXT: Do NOT translate, summarize, or guess module names. Write the exact letters you see in the cell.
            2. The Day of the week (Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi).
            3. The Start Time: "08:30", "10:45", "14:30", or "16:45".
            4. The Duration: Standard blocks are 2 hours (120).
            5. The Module Name: Write exactly what is written (e.g. "Analyse 1", "M7", "Architecture").
            6. The Teacher Name: Write exactly what is written.
            7. The Room: Write exactly what is written.
            8. The Type: You MUST specify 'CM' (Cours Magistral), 'TD' (Travaux Dirigés), or 'TP' (Travaux Pratiques). If it says 'Gr' or 'Groupe', it is a TD or TP. If it is in an Amphi, it is likely a CM. If you aren't sure, default to 'CM'.

            Return ONLY a valid JSON list of objects. Do not include markdown formatting.
            
            Format exactly like this example:
            [
              {"day": "Lundi", "time": "08:30", "duration": 120, "module_name": "Analyse 1", "teacher_name": "Bourray", "room_name": "Amphi B", "type": "CM"},
              {"day": "Mardi", "time": "14:30", "duration": 120, "module_name": "Algèbre", "teacher_name": "El Alaoui", "room_name": "Salle 10", "type": "TD"}
            ]
            """

            response = self.model.generate_content([prompt, img])
            
            content = response.text.strip()
            
            # Bulletproof JSON extraction: Find the first '[' and last ']'
            import re
            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                json_str = match.group(0)
                return json.loads(json_str)
            else:
                return {"error": "Could not find a valid JSON array in the AI response."}
        except Exception as e:
            return {"error": f"AI Parsing Error: {str(e)}"}
