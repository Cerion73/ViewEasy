from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Task

User = get_user_model()

class TaskAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.user_a = User.objects.create_user(
            username='usera', email='usera@example.com', password='password123'
        )
        self.user_b = User.objects.create_user(
            username='userb', email='userb@example.com', password='password123'
        )
        
        # Get JWT tokens
        login_url = reverse('token_obtain_pair')
        
        login_a = self.client.post(login_url, {'username': 'usera', 'password': 'password123'}, format='json')
        self.token_a = login_a.data['access']
        
        login_b = self.client.post(login_url, {'username': 'userb', 'password': 'password123'}, format='json')
        self.token_b = login_b.data['access']
        
        # URLs
        self.task_list_url = reverse('task-list')
        self.stats_url = reverse('dashboard_stats')
        self.today_url = reverse('dashboard_today')
        self.reminders_url = reverse('dashboard_reminders')

    def set_auth_token(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_task_crud_operations(self):
        self.set_auth_token(self.token_a)
        
        # Create task
        task_data = {
            'title': 'Test Task',
            'description': 'Test Description',
            'priority': 'HIGH',
            'due_date': (timezone.now() + timedelta(days=2)).isoformat()
        }
        response = self.client.post(self.task_list_url, task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task_id = response.data['id']
        self.assertEqual(response.data['title'], 'Test Task')
        self.assertEqual(response.data['status'], 'pending')
        
        # Read task
        detail_url = reverse('task-detail', kwargs={'pk': task_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Update task (complete it)
        update_data = {'is_completed': True}
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_completed'])
        self.assertEqual(response.data['status'], 'completed')
        self.assertIsNotNone(response.data['completed_at'])
        
        # Delete task
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task_id).exists())

    def test_task_isolation(self):
        # Create task as User A
        task_a = Task.objects.create(
            user=self.user_a,
            title="User A's Task",
            priority="LOW"
        )
        
        # Attempt to access task as User B
        self.set_auth_token(self.token_b)
        detail_url = reverse('task-detail', kwargs={'pk': task_a.id})
        
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Attempt to delete task as User B
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_task_status_calculation(self):
        # Pending task (no due date)
        task_pending_1 = Task.objects.create(user=self.user_a, title="Pending No Due Date")
        self.assertEqual(task_pending_1.status, 'pending')

        # Pending task (future due date)
        task_pending_2 = Task.objects.create(
            user=self.user_a, 
            title="Pending Future", 
            due_date=timezone.now() + timedelta(days=1)
        )
        self.assertEqual(task_pending_2.status, 'pending')

        # Overdue task (past due date)
        task_overdue = Task.objects.create(
            user=self.user_a,
            title="Overdue Task",
            due_date=timezone.now() - timedelta(days=1)
        )
        self.assertEqual(task_overdue.status, 'overdue')

        # Completed task (due date in past, but marked complete)
        task_completed = Task.objects.create(
            user=self.user_a,
            title="Completed Task",
            due_date=timezone.now() - timedelta(days=1),
            is_completed=True
        )
        self.assertEqual(task_completed.status, 'completed')

    def test_task_completed_at_timestamp(self):
        task = Task.objects.create(user=self.user_a, title="Timestamp Task")
        self.assertIsNone(task.completed_at)
        
        # Mark complete
        task.is_completed = True
        task.save()
        self.assertIsNotNone(task.completed_at)
        completed_time = task.completed_at
        
        # Mark incomplete
        task.is_completed = False
        task.save()
        self.assertIsNone(task.completed_at)

    def test_dashboard_stats(self):
        # Setup task portfolio for User A
        Task.objects.create(user=self.user_a, title="T1", is_completed=True)
        Task.objects.create(user=self.user_a, title="T2", priority="HIGH") # Pending
        Task.objects.create(user=self.user_a, title="T3", due_date=timezone.now() - timedelta(hours=2)) # Overdue
        
        self.set_auth_token(self.token_a)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data['total_tasks'], 3)
        self.assertEqual(response.data['completed_tasks'], 1)
        self.assertEqual(response.data['pending_tasks'], 1)
        self.assertEqual(response.data['overdue_tasks'], 1)
        self.assertEqual(response.data['completion_rate_percentage'], 33.33)

    def test_dashboard_today_focus_list(self):
        # Overdue task
        t_overdue = Task.objects.create(
            user=self.user_a, title="Overdue", due_date=timezone.now() - timedelta(days=2)
        )
        # Due today task
        t_today = Task.objects.create(
            user=self.user_a, title="Due Today", due_date=timezone.now() + timedelta(minutes=5)
        )
        # High priority pending task
        t_high_priority = Task.objects.create(
            user=self.user_a, title="High Priority Pending", priority="HIGH"
        )
        # Low priority pending task (should not show in today's focus)
        Task.objects.create(
            user=self.user_a, title="Low Priority", priority="LOW"
        )

        self.set_auth_token(self.token_a)
        response = self.client.get(self.today_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify flat focus list contents
        flat_list = response.data['flat_focus_list']
        self.assertEqual(len(flat_list), 3)
        titles = [task['title'] for task in flat_list]
        self.assertIn("Overdue", titles)
        self.assertIn("Due Today", titles)
        self.assertIn("High Priority Pending", titles)
        self.assertNotIn("Low Priority", titles)

    def test_dashboard_reminders(self):
        # Task due soon (in 2 hours)
        t_soon = Task.objects.create(
            user=self.user_a, title="Due Soon", due_date=timezone.now() + timedelta(hours=2)
        )
        # Task due far (in 3 days)
        t_far = Task.objects.create(
            user=self.user_a, title="Due Far", due_date=timezone.now() + timedelta(days=3)
        )
        # Overdue task
        t_overdue = Task.objects.create(
            user=self.user_a, title="Overdue", due_date=timezone.now() - timedelta(hours=5)
        )

        self.set_auth_token(self.token_a)
        response = self.client.get(self.reminders_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify that only the overdue and soon tasks are returned
        self.assertEqual(len(response.data), 2)
        titles = [task['title'] for task in response.data]
        self.assertIn("Due Soon", titles)
        self.assertIn("Overdue", titles)
        self.assertNotIn("Due Far", titles)
