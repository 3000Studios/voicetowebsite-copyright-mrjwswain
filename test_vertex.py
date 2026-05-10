import vertexai
from vertexai.generative_models import GenerativeModel

# Try us-central1 (the most common region for Gemini)
vertexai.init(project="halogen-valve-495112-c1", location="us-central1")

# Using the specific stable version
model = GenerativeModel("gemini-1.5-flash-002")

print("Sending request to Vertex AI...")

try:
    response = model.generate_content("Hello! Are you working?")
    print("-" * 30)
    print(f"VERTEX AI RESPONSE: {response.text}")
    print("-" * 30)
except Exception as e:
    print(f"Still getting an error: {e}")
