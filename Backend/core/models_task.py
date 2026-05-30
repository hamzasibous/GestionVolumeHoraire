from django.db import models

class ScheduleTask(models.Model):
    id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=20, default='PENDING') # PENDING, RUNNING, COMPLETED, FAILED
    progress = models.IntegerField(default=0) # 0 to 100
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Task {self.id}: {self.status} ({self.progress}%)"
