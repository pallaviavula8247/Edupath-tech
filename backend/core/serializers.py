from rest_framework import serializers
from .models import Goal, RoadmapStep, Scholarship, College


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['id', 'category', 'title', 'summary', 'icon']


class RoadmapStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapStep
        fields = ['id', 'order', 'title', 'description', 'duration', 'standard']


class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = ['id', 'name', 'provider', 'description', 'amount', 'official_link']


class CollegeSerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = College
        fields = [
            'id', 'name', 'city', 'state', 'college_type',
            'rating', 'website', 'latitude', 'longitude', 'distance_km',
        ]

    def get_distance_km(self, obj):
        return getattr(obj, 'distance_km', None)
