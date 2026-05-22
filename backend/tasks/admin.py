from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Task, Team, DailyAchievement, Invitation, TeamMembership

class SoftDeleteAdmin(SimpleHistoryAdmin):
    """
    Custom admin class for SoftDeletable models.
    Allows viewing all objects (including soft-deleted ones)
    and provides an action to permanently (hard) delete them.
    """
    def get_queryset(self, request):
        # Allow admins to see EVERYTHING, including soft-deleted items.
        qs = self.model.all_objects.get_queryset()
        ordering = self.get_ordering(request)
        if ordering:
            qs = qs.order_by(*ordering)
        return qs

    actions = ['hard_delete_objects']

    @admin.action(description="Permanently delete selected objects (Hard Delete)")
    def hard_delete_objects(self, request, queryset):
        for obj in queryset:
            obj.hard_delete()
        self.message_user(request, "Selected objects were permanently deleted.")

admin.site.register(Task, SoftDeleteAdmin)
admin.site.register(Team, SoftDeleteAdmin)
admin.site.register(DailyAchievement, SoftDeleteAdmin)
admin.site.register(Invitation, SoftDeleteAdmin)
admin.site.register(TeamMembership, SoftDeleteAdmin)
