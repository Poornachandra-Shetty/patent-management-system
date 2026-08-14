from django.contrib import admin

from apps.workflow.models import WorkflowEvent


@admin.register(WorkflowEvent)
class WorkflowEventAdmin(admin.ModelAdmin):
    list_display = ('application', 'from_status', 'to_status', 'performed_by', 'created_at')
    list_filter = ('from_status', 'to_status', 'created_at')
    search_fields = ('application__patent_id', 'note', 'performed_by__email')
    readonly_fields = (
        'application', 'performed_by', 'from_status', 'to_status', 'note', 'created_at',
    )
    ordering = ('-created_at',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
