from django.db import models


class GoalCategory(models.TextChoices):
    ENGINEERING = 'ENGINEERING', 'Engineering & Technology'
    MEDICAL = 'MEDICAL', 'Medicine & Healthcare'
    DATA_SCIENCE = 'DATA_SCIENCE', 'Data Science & AI'
    COMMERCE = 'COMMERCE', 'Commerce & Finance'
    ARTS_DESIGN = 'ARTS_DESIGN', 'Arts & Design'
    LAW = 'LAW', 'Law'
    GOVERNMENT = 'GOVERNMENT', 'Government / Civil Services'
    AGRICULTURE = 'AGRICULTURE', 'Agriculture & Life Sciences'
    TEACHING = 'TEACHING', 'Teaching & Education'


class StandardLevel(models.TextChoices):
    CLASS_8 = 'CLASS_8', 'Class 8'
    CLASS_10 = 'CLASS_10', 'Class 10'
    CLASS_12 = 'CLASS_12', 'Class 12'
    UNDERGRAD = 'UNDERGRAD', 'Undergraduate'
    POSTGRAD = 'POSTGRAD', 'Postgraduate / Working Professional'


class Goal(models.Model):
    category = models.CharField(max_length=32, choices=GoalCategory.choices, unique=True)
    title = models.CharField(max_length=120)
    summary = models.TextField(blank=True)
    icon = models.CharField(max_length=8, default='🎯', help_text="Emoji used as a lightweight icon")

    def __str__(self):
        return self.title


class RoadmapStep(models.Model):
    goal = models.ForeignKey(Goal, related_name='roadmap_steps', on_delete=models.CASCADE)
    standard = models.CharField(max_length=16, choices=StandardLevel.choices)
    order = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.CharField(max_length=80, blank=True, help_text="e.g. '6-12 months'")

    class Meta:
        ordering = ['goal', 'standard', 'order']

    def __str__(self):
        return f"{self.goal.title} / {self.standard} / step {self.order}: {self.title}"


class Scholarship(models.Model):
    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    eligible_standards = models.CharField(
        max_length=120,
        help_text="Comma separated StandardLevel codes this scholarship applies to",
    )
    eligible_categories = models.CharField(
        max_length=200, blank=True,
        help_text="Comma separated GoalCategory codes; blank = open to all fields",
    )
    amount = models.CharField(max_length=120, blank=True, help_text="e.g. 'Up to ₹50,000/year'")
    official_link = models.URLField(blank=True)

    def __str__(self):
        return self.name

    def eligible_standards_list(self):
        return [s.strip() for s in self.eligible_standards.split(',') if s.strip()]

    def eligible_categories_list(self):
        return [c.strip() for c in self.eligible_categories.split(',') if c.strip()]


class College(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    college_type = models.CharField(
        max_length=20,
        choices=[('GOVERNMENT', 'Government'), ('PRIVATE', 'Private'), ('DEEMED', 'Deemed University')],
        default='GOVERNMENT',
    )
    categories = models.CharField(
        max_length=250,
        help_text="Comma separated GoalCategory codes offered at this college",
    )
    rating = models.FloatField(default=4.0, help_text="Out of 5")
    website = models.URLField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"

    def categories_list(self):
        return [c.strip() for c in self.categories.split(',') if c.strip()]
