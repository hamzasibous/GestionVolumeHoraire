from rest_framework import viewsets, serializers, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Utilisateur, Enseignant, Role
from core.models import Departement

class UtilisateurSerializer(serializers.ModelSerializer):
    departement_name = serializers.CharField(source='departement.nom', read_only=True)
    
    class Meta:
        model = Utilisateur
        fields = ['id', 'nom', 'prenom', 'email', 'tel', 'role', 'langue', 'photo', 'departement', 'departement_name', 'is_active', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'departement': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

# EnseignantSerializer kept for backward compatibility if referenced elsewhere by name
class EnseignantSerializer(UtilisateurSerializer):
    pass

class UserViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all().select_related('departement')
    serializer_class = UtilisateurSerializer

    def perform_create(self, serializer):
        role = self.request.data.get('role')
        is_staff = (role in [Role.ADMIN, Role.CHEF_DEPARTEMENT])
        
        # Default department for anyone with teaching role or if explicitly provided
        if role in [Role.ENSEIGNANT, Role.CHEF_DEPARTEMENT] and not serializer.validated_data.get('departement'):
            departement, _ = Departement.objects.get_or_create(nom="Informatique")
            serializer.save(is_staff=is_staff, departement=departement)
        else:
            serializer.save(is_staff=is_staff)

    def perform_update(self, serializer):
        role = self.request.data.get('role')
        if role:
            is_staff = (role in [Role.ADMIN, Role.CHEF_DEPARTEMENT])
            serializer.save(is_staff=is_staff)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in Role.values:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.is_staff = (new_role in [Role.ADMIN, Role.CHEF_DEPARTEMENT])
        user.save()
        return Response({'status': 'role updated'})

class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UtilisateurSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
