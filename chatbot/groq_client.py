import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()

class GroqClient:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_chat_response(self, message):
        """
        Get response from Groq's API
        """
        if not self.api_key:
            return {"error": "GROQ_API_KEY not found in environment variables"}

        # Payload with the updated model
        payload = {
            "model": "llama-3.3-70b-versatile",  # Updated to the latest stable model
            "messages": [{"role": "user", "content": message}],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        try:
            print("\n=== Sending Request to Groq API ===")
            print("URL:", self.base_url)
            print("Headers:", {k: ('*' * 10 + v[-4:]) if k == 'Authorization' else v 
                            for k, v in self.headers.items()})
            print("Payload:", json.dumps(payload, indent=2))
            
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            print("\n=== Received Response ===")
            print("Status Code:", response.status_code)
            print("Response Body:", response.text)
            
            response.raise_for_status()
            response_data = response.json()
            
            if 'choices' in response_data and len(response_data['choices']) > 0:
                return {"reply": response_data['choices'][0]['message']['content']}
            else:
                return {"error": "Unexpected response format from API"}
                
        except requests.exceptions.HTTPError as http_err:
            error_msg = f"HTTP error occurred: {http_err}"
            if hasattr(http_err, 'response') and hasattr(http_err.response, 'text'):
                error_msg += f"\nResponse: {http_err.response.text}"
            return {"error": error_msg}
        except Exception as e:
            return {"error": f"An error occurred: {str(e)}"}