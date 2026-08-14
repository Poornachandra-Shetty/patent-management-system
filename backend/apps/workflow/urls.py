from django.urls import path

from apps.workflow.views import AllowedTransitionsView, TransitionView, WorkflowHistoryView

urlpatterns = [
    path(
        '<str:patent_id>/transition/',
        TransitionView.as_view(),
        name='workflow-transition',
    ),
    path(
        '<str:patent_id>/allowed/',
        AllowedTransitionsView.as_view(),
        name='workflow-allowed',
    ),
    path(
        '<str:patent_id>/history/',
        WorkflowHistoryView.as_view(),
        name='workflow-history',
    ),
]
