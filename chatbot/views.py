from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import render
import json
from .groq_client import GroqClient

@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return JsonResponse(
                {"error": "Message is required"}, 
                status=400
            )
        
        groq_client = GroqClient()
        response = groq_client.get_chat_response(user_message)
        
        if 'error' in response:
            return JsonResponse(
                {"error": response['error']}, 
                status=500
            )
            
        return JsonResponse({"reply": response['reply']})
        
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"}, 
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)}, 
            status=500
        )

def chat_view(request):
    """Render the main chat interface"""
    return render(request, 'chatbot/index.html')
