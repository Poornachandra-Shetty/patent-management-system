# Generated migration for Notification model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('patents', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Short notification title', max_length=255)),
                ('message', models.TextField(help_text='Notification message content')),
                ('event_type', models.CharField(choices=[('status_change', 'Patent Status Changed'), ('remark_added', 'Remark Added')], help_text='Type of event that triggered the notification', max_length=30)),
                ('is_read', models.BooleanField(db_index=True, default=False, help_text='Whether the recipient has read this notification')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, help_text='When the notification was created')),
                ('recipient', models.ForeignKey(help_text='User who receives this notification', on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
                ('related_application', models.ForeignKey(blank=True, help_text='Patent application this notification relates to', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='patents.patentapplication')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', '-created_at'], name='notification_recipient_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', 'is_read'], name='notification_recipient_read_idx'),
        ),
    ]
