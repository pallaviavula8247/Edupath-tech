from math import radians, sin, cos, sqrt, atan2

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Goal, RoadmapStep, Scholarship, College, GoalCategory, StandardLevel
from .serializers import (
    GoalSerializer, RoadmapStepSerializer, ScholarshipSerializer, CollegeSerializer,
)


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


@api_view(['GET'])
def list_goals(request):
    goals = Goal.objects.all().order_by('title')
    return Response(GoalSerializer(goals, many=True).data)


@api_view(['GET'])
def list_standards(request):
    return Response([{'code': code, 'label': label} for code, label in StandardLevel.choices])


@api_view(['POST'])
def recommend(request):
    goal_code = request.data.get('goal')
    standard_code = request.data.get('standard')
    state = (request.data.get('state') or '').strip()
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    if not goal_code or goal_code not in GoalCategory.values:
        return Response({'error': 'A valid "goal" is required.'}, status=400)
    if not standard_code or standard_code not in StandardLevel.values:
        return Response({'error': 'A valid "standard" is required.'}, status=400)

    try:
        goal = Goal.objects.get(category=goal_code)
    except Goal.DoesNotExist:
        return Response({'error': 'Goal not found.'}, status=404)

    # --- Roadmap: this goal's steps at-and-after the learner's current standard
    order_index = list(StandardLevel.values).index(standard_code)
    relevant_standards = list(StandardLevel.values)[order_index:]
    roadmap = RoadmapStep.objects.filter(goal=goal, standard__in=relevant_standards).order_by(
        'standard', 'order'
    )

    # --- Scholarships: matching standard, open-to-all or matching category
    scholarships = [
        s for s in Scholarship.objects.all()
        if standard_code in s.eligible_standards_list()
        and (not s.eligible_categories_list() or goal_code in s.eligible_categories_list())
    ]

    # --- Colleges offering this field of study
    colleges_qs = list(College.objects.filter(categories__icontains=goal_code))
    if state:
        state_matches = [c for c in colleges_qs if c.state.lower() == state.lower()]
        colleges = state_matches or colleges_qs
    else:
        colleges = colleges_qs
    colleges = sorted(colleges, key=lambda c: -c.rating)[:8]

    # --- Nearby colleges (needs lat/lng from the browser's geolocation)
    nearby = []
    if lat is not None and lng is not None:
        try:
            lat, lng = float(lat), float(lng)
            with_coords = [c for c in colleges_qs if c.latitude is not None and c.longitude is not None]
            for c in with_coords:
                c.distance_km = round(haversine_km(lat, lng, c.latitude, c.longitude), 1)
            nearby = sorted(with_coords, key=lambda c: c.distance_km)[:6]
        except (TypeError, ValueError):
            nearby = []

    return Response({
        'goal': GoalSerializer(goal).data,
        'standard': standard_code,
        'roadmap': RoadmapStepSerializer(roadmap, many=True).data,
        'scholarships': ScholarshipSerializer(scholarships, many=True).data,
        'colleges': CollegeSerializer(colleges, many=True).data,
        'nearby_colleges': CollegeSerializer(nearby, many=True).data,
    })
