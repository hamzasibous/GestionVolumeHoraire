from rest_framework import viewsets, serializers, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Utilisateur, Enseignant, Role
from core.models import Departement

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'nom', 'prenom', 'email', 'tel', 'role', 'langue', 'is_active', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class EnseignantSerializer(serializers.ModelSerializer):
    departement_name = serializers.CharField(source='departement.nom', read_only=True)
    
    class Meta:
        model = Enseignant
        fields = ['id', 'nom', 'prenom', 'email', 'tel', 'role', 'langue', 'is_active', 'departement', 'departement_name', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class UserViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_serializer_class(self):
        # Use EnseignantSerializer if the object is an Enseignant (or being created as one)
        if self.action in ['create', 'update', 'partial_update']:
            role = self.request.data.get('role')
            if role == Role.ENSEIGNANT or role == Role.CHEF_DEPARTEMENT:
                return EnseignantSerializer
        
        return UtilisateurSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Optimize by selecting related info for enseignants
        return queryset.select_related('enseignant__departement')

    def list(self, request, *args, **kwargs):
        users = self.get_queryset()
        data = []
        for user in users:
            if hasattr(user, 'enseignant'):
                data.append(EnseignantSerializer(user.enseignant).data)
            else:
                data.append(UtilisateurSerializer(user).data)
        return Response(data)

    def perform_create(self, serializer):
        role = self.request.data.get('role')
        is_staff = (role == Role.ADMIN)
        if role == Role.ENSEIGNANT or role == Role.CHEF_DEPARTEMENT:
            if not self.request.data.get('departement'):
                raise serializers.ValidationError({"departement": "This field is required for teachers."})
        serializer.save(is_staff=is_staff)

    def perform_update(self, serializer):
        role = self.request.data.get('role')
        if role:
            is_staff = (role == Role.ADMIN)
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
        if new_role == Role.ADMIN:
            user.is_staff = True
        else:
            user.is_staff = False
        
        user.save()
        return Response({'status': 'role updated'})

class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if hasattr(user, 'enseignant'):
            serializer = EnseignantSerializer(user.enseignant)
        else:
            serializer = UtilisateurSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        if hasattr(user, 'enseignant'):
            serializer = EnseignantSerializer(user.enseignant, data=request.data, partial=True)
        else:
            serializer = UtilisateurSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
