from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('auth_register')
        self.login_url = reverse('token_obtain_pair')
        self.me_url = reverse('auth_me')
        
        self.user_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'password123'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'testuser@example.com')
        self.assertNotIn('password', response.data)
        
        # Verify db entry
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_user_registration_duplicate_username(self):
        # Register once
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Register again with same username but different email
        duplicate_data = self.user_data.copy()
        duplicate_data['email'] = 'other@example.com'
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_user_registration_duplicate_email(self):
        # Register once
        self.client.post(self.register_url, self.user_data, format='json')
        
        # Register again with different username but same email
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'otheruser'
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login(self):
        # Register the user
        User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Try login
        login_payload = {
            'username': 'testuser',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_me_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_me_authenticated(self):
        user = User.objects.create_user(
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Log in to get token
        login_payload = {'username': 'testuser', 'password': 'password123'}
        login_response = self.client.post(self.login_url, login_payload, format='json')
        token = login_response.data['access']
        
        # Set authorization header and request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'testuser@example.com')
