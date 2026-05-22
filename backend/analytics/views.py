from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from tasks.models import Task
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

class UnwrappedAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_commentary(self, timeframe_name, total, completed, stuck, abandoned, overdue):
        if total == 0:
            return "No tasks created. A blank canvas awaits! 🎨"
        
        completion_rate = completed / total
        
        if completion_rate >= 0.8:
            return f"You were an absolute machine {timeframe_name}! 🚀 {int(completion_rate*100)}% completion rate."
        elif stuck > completed and stuck > 3:
            return f"A little bogged down {timeframe_name}? 🌱 You have {stuck} tasks stuck in progress. Time to refocus!"
        elif abandoned > total * 0.4:
            return f"Pivoting hard {timeframe_name}! 🔄 You abandoned {abandoned} tasks. Sometimes less is more."
        elif overdue > 0:
            return f"Running a bit behind {timeframe_name}! ⏰ Let's clear out those {overdue} overdue tasks."
        elif completion_rate > 0.4:
            return f"Steady progress {timeframe_name}! 📈 You completed {completed} out of {total} tasks."
        else:
            return f"Building momentum {timeframe_name}! ⏳ Every big achievement starts with a single step."

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        timeframes = {
            'today': ('today', now.replace(hour=0, minute=0, second=0, microsecond=0)),
            'this_week': ('this week', now - timedelta(days=now.weekday())),
            'this_month': ('this month', now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)),
            'this_quarter': ('this quarter', now.replace(month=(now.month-1)//3*3+1, day=1, hour=0, minute=0, second=0, microsecond=0)),
            'half_year': ('the last 6 months', now - timedelta(days=182)),
            'this_year': ('this year', now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)),
        }

        results = {}

        for key, (name, start_date) in timeframes.items():
            tasks = Task.all_objects.filter(user=user, created_at__gte=start_date)
            total = tasks.count()
            
            # Categories
            completed = tasks.filter(status='completed', is_deleted=False).count()
            stuck = tasks.filter(status='in_progress', is_deleted=False).count()
            overdue = tasks.filter(
                Q(status='overdue') | Q(due_date__lt=now, status__in=['pending', 'in_progress']),
                is_deleted=False
            ).count()
            abandoned = tasks.filter(is_deleted=True).count()

            commentary = self.get_commentary(name, total, completed, stuck, abandoned, overdue)

            results[key] = {
                'title': name.title(),
                'total': total,
                'completed': completed,
                'stuck': stuck,
                'abandoned': abandoned,
                'overdue': overdue,
                'commentary': commentary
            }

        return Response(results)
