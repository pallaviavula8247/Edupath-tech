from django.contrib import admin
from .models import Goal, RoadmapStep, Scholarship, College


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'category')


@admin.register(RoadmapStep)
class RoadmapStepAdmin(admin.ModelAdmin):
    list_display = ('goal', 'standard', 'order', 'title')
    list_filter = ('goal', 'standard')


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'amount')


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'college_type', 'rating')
    list_filter = ('state', 'college_type')
