from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({"error": "Username and password are required"}, status=400)
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Invalid username or password"}, status=401)
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=200)
