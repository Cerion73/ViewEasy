import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from tasks.models import Team
from team_rooms.models import TeamRoom

count = 0
for team in Team.objects.all():
    _, created = TeamRoom.objects.get_or_create(team=team)
    if created: count += 1
print(f"Created {count} missing TeamRooms.")
