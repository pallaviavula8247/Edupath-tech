from django.core.management.base import BaseCommand
from core.models import Goal, RoadmapStep, Scholarship, College, GoalCategory, StandardLevel


GOALS = [
    (GoalCategory.ENGINEERING, 'Engineering & Technology', 'Build, design and innovate — from software to civil infrastructure.', '⚙️'),
    (GoalCategory.MEDICAL, 'Medicine & Healthcare', 'Heal and care for others as a doctor, nurse or allied health professional.', '🩺'),
    (GoalCategory.DATA_SCIENCE, 'Data Science & AI', 'Turn data into insight and build intelligent systems.', '📊'),
    (GoalCategory.COMMERCE, 'Commerce & Finance', 'Master money, markets and business strategy.', '💼'),
    (GoalCategory.ARTS_DESIGN, 'Arts & Design', 'Create, express and design for the world around us.', '🎨'),
    (GoalCategory.LAW, 'Law', 'Understand and argue justice, rights and policy.', '⚖️'),
    (GoalCategory.GOVERNMENT, 'Government / Civil Services', 'Serve the public through administration and policy-making.', '🏛️'),
    (GoalCategory.AGRICULTURE, 'Agriculture & Life Sciences', 'Grow food, protect ecosystems and advance biosciences.', '🌾'),
    (GoalCategory.TEACHING, 'Teaching & Education', 'Shape the next generation as an educator.', '📚'),
]

ROADMAPS = {
    GoalCategory.ENGINEERING: [
        (StandardLevel.CLASS_8, 1, 'Strengthen Math & Science basics', 'Focus on algebra, geometry and physics fundamentals. Join a school science club or Olympiad.', '1-2 years'),
        (StandardLevel.CLASS_10, 1, 'Choose Science (PCM) stream', 'Pick Physics, Chemistry, Mathematics for Class 11-12 to keep engineering open.', '2 years'),
        (StandardLevel.CLASS_10, 2, 'Start entrance-exam foundation', 'Begin JEE/state-CET foundation coaching or self-study alongside board syllabus.', 'Ongoing'),
        (StandardLevel.CLASS_12, 1, 'Prepare for JEE Main/Advanced or state CET', 'Practice previous papers, take mock tests, and target a strong board score too.', '1-2 years'),
        (StandardLevel.CLASS_12, 2, 'Shortlist colleges & apply', 'Research NITs/IITs/state engineering colleges, check cutoffs, and apply via counseling.', '3-6 months'),
        (StandardLevel.UNDERGRAD, 1, 'Pick a specialization (CSE, ECE, Mech, Civil...)', 'Choose based on interest and job market; start building projects and internships.', '4 years'),
        (StandardLevel.UNDERGRAD, 2, 'Internships & certifications', 'Do at least 2 internships and relevant certifications (AWS, coding, CAD, etc.).', '2-3 years'),
        (StandardLevel.POSTGRAD, 1, 'Decide: Job, M.Tech, or MBA', 'Based on interests, prepare for placements, GATE, or management entrance exams.', '1 year'),
    ],
    GoalCategory.MEDICAL: [
        (StandardLevel.CLASS_8, 1, 'Build strong Biology & Chemistry interest', 'Read beyond textbooks, watch science documentaries, volunteer at health camps.', '1-2 years'),
        (StandardLevel.CLASS_10, 1, 'Choose Science (PCB) stream', 'Pick Physics, Chemistry, Biology for Class 11-12 to keep medicine open.', '2 years'),
        (StandardLevel.CLASS_12, 1, 'Prepare for NEET', 'Consistent NCERT-based study, mock tests, and time management practice.', '1-2 years'),
        (StandardLevel.CLASS_12, 2, 'NEET counseling & college selection', 'Understand All-India and state quota, fill choices carefully during counseling.', '2-4 months'),
        (StandardLevel.UNDERGRAD, 1, 'Complete MBBS/BDS/BAMS/Nursing degree', 'Focus on clinical rotations, case studies and building strong fundamentals.', '4.5-5.5 years'),
        (StandardLevel.UNDERGRAD, 2, 'Internship (compulsory rotating internship)', 'Hands-on hospital experience across departments.', '1 year'),
        (StandardLevel.POSTGRAD, 1, 'NEET-PG / specialization', 'Choose a specialty and prepare for postgraduate entrance exams.', '1-3 years'),
    ],
    GoalCategory.DATA_SCIENCE: [
        (StandardLevel.CLASS_8, 1, 'Learn basic logic & math', 'Focus on algebra, statistics basics, and try simple coding puzzles (Scratch/Python).', '1-2 years'),
        (StandardLevel.CLASS_10, 1, 'Pick Science/Math stream', 'MPC or a stream with strong Mathematics keeps Data Science/CS options open.', '2 years'),
        (StandardLevel.CLASS_12, 1, 'Target CS/IT/Statistics degree programs', 'Prepare for engineering entrance exams or statistics-focused UG programs.', '1 year'),
        (StandardLevel.UNDERGRAD, 1, 'Learn Python, SQL & Statistics', 'Build a strong base through free courses (Kaggle, Coursera) alongside your degree.', '1-2 years'),
        (StandardLevel.UNDERGRAD, 2, 'Machine Learning & projects portfolio', 'Do real datasets projects, Kaggle competitions, and an internship.', '1-2 years'),
        (StandardLevel.POSTGRAD, 1, 'Specialize (MS/MTech in AI/DS or jobs)', 'Consider higher studies or apply directly for Data Analyst/ML Engineer roles.', '1-2 years'),
    ],
    GoalCategory.COMMERCE: [
        (StandardLevel.CLASS_10, 1, 'Choose Commerce stream', 'Pick Accountancy, Economics, Business Studies/Maths for Class 11-12.', '2 years'),
        (StandardLevel.CLASS_12, 1, 'Decide: B.Com, BBA, CA, or CS route', 'Research each path — CA/CS have their own entrance and foundation exams.', '6-12 months'),
        (StandardLevel.UNDERGRAD, 1, 'Pursue B.Com/BBA + certifications', 'Add certifications like Tally, Excel, or start CA/CS/CFA alongside your degree.', '3 years'),
        (StandardLevel.POSTGRAD, 1, 'MBA / M.Com / Professional qualification', 'Prepare for CAT/MAT or complete CA/CS/CFA levels for career advancement.', '1-3 years'),
    ],
    GoalCategory.ARTS_DESIGN: [
        (StandardLevel.CLASS_10, 1, 'Build a portfolio & explore mediums', 'Try drawing, digital art, photography or design software basics.', '1-2 years'),
        (StandardLevel.CLASS_12, 1, 'Prepare for design entrance exams', 'NID/NIFT/UCEED style aptitude and design-thinking preparation.', '1 year'),
        (StandardLevel.UNDERGRAD, 1, 'Specialize (Graphic, Fashion, Product, Fine Art)', 'Build a strong portfolio through internships and live projects.', '3-4 years'),
        (StandardLevel.POSTGRAD, 1, 'Advanced specialization or studio practice', 'Pursue M.Des or start freelance/studio work with a public portfolio.', '1-2 years'),
    ],
    GoalCategory.LAW: [
        (StandardLevel.CLASS_10, 1, 'Any stream works — build reading & debate skills', 'Join debate/MUN clubs, read current affairs regularly.', '2 years'),
        (StandardLevel.CLASS_12, 1, 'Prepare for CLAT/LSAT/state law entrance', 'Focus on legal reasoning, English, GK and logical reasoning.', '1 year'),
        (StandardLevel.UNDERGRAD, 1, 'Complete 5-year integrated law (BA LLB) or 3-year LLB', 'Do moot courts, internships with law firms/NGOs.', '3-5 years'),
        (StandardLevel.POSTGRAD, 1, 'Specialize (LLM) or start practice', 'Choose corporate, criminal, or civil law; consider judiciary exams.', '1-2 years'),
    ],
    GoalCategory.GOVERNMENT: [
        (StandardLevel.CLASS_12, 1, 'Pick any bachelor\'s degree', 'UPSC/State PSC exams accept any graduate; focus on strong fundamentals & current affairs.', '3-4 years'),
        (StandardLevel.UNDERGRAD, 1, 'Start UPSC/State PSC foundation', 'Build NCERT base, daily newspaper reading, and answer-writing practice.', '1-2 years'),
        (StandardLevel.UNDERGRAD, 2, 'Prelims + Mains + Interview prep', 'Join structured coaching or self-study groups, take regular mock tests.', '1-2 years'),
        (StandardLevel.POSTGRAD, 1, 'Continue attempts / allied services', 'Consider SSC, banking, or state-level services as parallel options.', 'Ongoing'),
    ],
    GoalCategory.AGRICULTURE: [
        (StandardLevel.CLASS_10, 1, 'Choose Science stream (Biology)', 'Keep options open for B.Sc Agriculture and life-science degrees.', '2 years'),
        (StandardLevel.CLASS_12, 1, 'Prepare for ICAR AIEEA / state agri entrance', 'Focus on Biology, Chemistry and Physics fundamentals.', '1 year'),
        (StandardLevel.UNDERGRAD, 1, 'B.Sc Agriculture / Horticulture / Forestry', 'Get hands-on field training and internships with agri-research bodies.', '4 years'),
        (StandardLevel.POSTGRAD, 1, 'M.Sc / Agri-business / Government roles', 'Consider research, agribusiness management, or ICAR/state agri services.', '1-2 years'),
    ],
    GoalCategory.TEACHING: [
        (StandardLevel.CLASS_12, 1, 'Pick a bachelor\'s degree in your subject of interest', 'Choose the subject you want to teach as your major.', '3-4 years'),
        (StandardLevel.UNDERGRAD, 1, 'Complete B.Ed / Integrated B.Ed', 'Build classroom and pedagogy skills through teaching practice.', '2 years'),
        (StandardLevel.UNDERGRAD, 2, 'Clear TET/CTET', 'Qualify state or central Teacher Eligibility Tests for government schools.', '6-12 months'),
        (StandardLevel.POSTGRAD, 1, 'M.Ed / Subject specialization', 'Pursue higher studies for college-level teaching or leadership roles.', '1-2 years'),
    ],
}

SCHOLARSHIPS = [
    ('National Means-cum-Merit Scholarship', 'Govt. of India', 'For meritorious students from economically weaker sections.', 'CLASS_10', '', 'Up to ₹12,000/year', 'https://scholarships.gov.in'),
    ('Pre-Matric Scholarship for Minorities', 'Govt. of India', 'Support for minority community students in Classes 9-10.', 'CLASS_10', '', 'Varies by state', 'https://scholarships.gov.in'),
    ('Post-Matric Scholarship (SC/ST/OBC)', 'State/Central Govt.', 'Financial aid for post-matriculation studies for reserved categories.', 'CLASS_12,UNDERGRAD', '', 'Tuition + maintenance allowance', 'https://scholarships.gov.in'),
    ('AICTE Pragati Scholarship for Girls', 'AICTE', 'Support for girl students pursuing technical education.', 'UNDERGRAD', 'ENGINEERING', '₹50,000/year', 'https://www.aicte-pragati-saksham-gov.in'),
    ('INSPIRE Scholarship', 'DST, Govt. of India', 'For top science students pursuing B.Sc/M.Sc in natural/basic sciences.', 'UNDERGRAD', 'DATA_SCIENCE,AGRICULTURE', '₹80,000/year', 'https://online-inspire.gov.in'),
    ('National Scholarship for Higher Education (Central Sector Scheme)', 'Govt. of India', 'Merit-based scholarship for Class 12 toppers pursuing UG courses.', 'CLASS_12', '', '₹10,000/year', 'https://scholarships.gov.in'),
    ('ICAR National Talent Scholarship', 'ICAR', 'For meritorious students in agricultural universities.', 'UNDERGRAD', 'AGRICULTURE', 'Full tuition waiver', 'https://icar.org.in'),
    ('AICTE Saksham Scholarship (Differently-Abled)', 'AICTE', 'Support for differently-abled students in technical education.', 'UNDERGRAD', 'ENGINEERING', '₹50,000/year', 'https://www.aicte-pragati-saksham-gov.in'),
    ('State Merit Scholarship (Class 12 Board Toppers)', 'State Govt.', 'Awarded to top rank holders in state board Class 12 exams.', 'CLASS_12', '', 'One-time award', 'https://scholarships.gov.in'),
    ('Ishan Uday Special Scholarship', 'Govt. of India', 'For students from North Eastern Region pursuing general degree courses.', 'UNDERGRAD', '', '₹5,000/month', 'https://scholarships.gov.in'),
]

COLLEGES = [
    ('IIT Madras', 'Chennai', 'Tamil Nadu', 12.9915, 80.2336, 'GOVERNMENT', 'ENGINEERING,DATA_SCIENCE', 4.9, 'https://www.iitm.ac.in'),
    ('NIT Warangal', 'Warangal', 'Telangana', 17.9819, 79.5324, 'GOVERNMENT', 'ENGINEERING', 4.6, 'https://www.nitw.ac.in'),
    ('JNTU Anantapur College of Engineering', 'Anantapur', 'Andhra Pradesh', 14.6819, 77.6006, 'GOVERNMENT', 'ENGINEERING,DATA_SCIENCE', 4.1, 'https://www.jntua.ac.in'),
    ('Sri Venkateswara University', 'Tirupati', 'Andhra Pradesh', 13.6288, 79.4192, 'GOVERNMENT', 'ENGINEERING,COMMERCE,ARTS_DESIGN,TEACHING', 4.2, 'https://svuniversity.edu.in'),
    ('Rajiv Gandhi University of Knowledge Technologies, Kadapa', 'Kadapa', 'Andhra Pradesh', 14.4673, 78.8242, 'GOVERNMENT', 'ENGINEERING,DATA_SCIENCE', 4.0, 'https://www.rgukt.in'),
    ('AIIMS New Delhi', 'New Delhi', 'Delhi', 28.5672, 77.2100, 'GOVERNMENT', 'MEDICAL', 4.9, 'https://www.aiims.edu'),
    ('Sri Venkateswara Institute of Medical Sciences (SVIMS)', 'Tirupati', 'Andhra Pradesh', 13.6350, 79.4045, 'GOVERNMENT', 'MEDICAL', 4.5, 'https://svimstpt.ap.nic.in'),
    ('Kurnool Medical College', 'Kurnool', 'Andhra Pradesh', 15.8281, 78.0373, 'GOVERNMENT', 'MEDICAL', 4.0, 'https://kmckurnool.ac.in'),
    ('Indian Statistical Institute, Bangalore', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 'GOVERNMENT', 'DATA_SCIENCE', 4.7, 'https://www.isibang.ac.in'),
    ('IIM Bangalore', 'Bangalore', 'Karnataka', 12.9105, 77.5978, 'GOVERNMENT', 'COMMERCE', 4.8, 'https://www.iimb.ac.in'),
    ('Sri Padmavati Mahila Visvavidyalayam', 'Tirupati', 'Andhra Pradesh', 13.6500, 79.4200, 'GOVERNMENT', 'COMMERCE,ARTS_DESIGN,TEACHING', 4.0, 'https://spmvv.ac.in'),
    ('National Institute of Design, Ahmedabad', 'Ahmedabad', 'Gujarat', 23.0364, 72.5250, 'GOVERNMENT', 'ARTS_DESIGN', 4.7, 'https://www.nid.edu'),
    ('National Law School of India University, Bangalore', 'Bangalore', 'Karnataka', 12.9081, 77.5831, 'GOVERNMENT', 'LAW', 4.8, 'https://www.nls.ac.in'),
    ('Damodaram Sanjivayya National Law University', 'Visakhapatnam', 'Andhra Pradesh', 17.7231, 83.3013, 'GOVERNMENT', 'LAW', 4.2, 'https://dsnlu.ac.in'),
    ('Lal Bahadur Shastri National Academy of Administration', 'Mussoorie', 'Uttarakhand', 30.4530, 78.0784, 'GOVERNMENT', 'GOVERNMENT', 4.6, 'https://lbsnaa.gov.in'),
    ('Acharya N.G. Ranga Agricultural University', 'Guntur', 'Andhra Pradesh', 16.3067, 80.4365, 'GOVERNMENT', 'AGRICULTURE', 4.1, 'https://angrau.ac.in'),
    ('Regional Institute of Education, Mysuru', 'Mysuru', 'Karnataka', 12.2958, 76.6394, 'GOVERNMENT', 'TEACHING', 4.3, 'https://riemysore.ac.in'),
    ('Vellore Institute of Technology (VIT)', 'Vellore', 'Tamil Nadu', 12.9692, 79.1559, 'PRIVATE', 'ENGINEERING,DATA_SCIENCE', 4.3, 'https://vit.ac.in'),
    ('Manipal Academy of Higher Education', 'Manipal', 'Karnataka', 13.3467, 74.7869, 'PRIVATE', 'MEDICAL,ENGINEERING', 4.4, 'https://manipal.edu'),
    ('Symbiosis International University', 'Pune', 'Maharashtra', 18.5642, 73.8102, 'PRIVATE', 'LAW,COMMERCE,ARTS_DESIGN', 4.2, 'https://www.siu.edu.in'),
]


class Command(BaseCommand):
    help = 'Seed the database with goals, roadmap steps, scholarships and colleges.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding goals...')
        goal_objs = {}
        for category, title, summary, icon in GOALS:
            goal, _ = Goal.objects.update_or_create(
                category=category,
                defaults={'title': title, 'summary': summary, 'icon': icon},
            )
            goal_objs[category] = goal

        self.stdout.write('Seeding roadmap steps...')
        RoadmapStep.objects.all().delete()
        for category, steps in ROADMAPS.items():
            for standard, order, title, description, duration in steps:
                RoadmapStep.objects.create(
                    goal=goal_objs[category], standard=standard, order=order,
                    title=title, description=description, duration=duration,
                )

        self.stdout.write('Seeding scholarships...')
        Scholarship.objects.all().delete()
        for name, provider, description, std, cats, amount, link in SCHOLARSHIPS:
            Scholarship.objects.create(
                name=name, provider=provider, description=description,
                eligible_standards=std, eligible_categories=cats,
                amount=amount, official_link=link,
            )

        self.stdout.write('Seeding colleges...')
        College.objects.all().delete()
        for name, city, state, lat, lng, ctype, cats, rating, website in COLLEGES:
            College.objects.create(
                name=name, city=city, state=state, latitude=lat, longitude=lng,
                college_type=ctype, categories=cats, rating=rating, website=website,
            )

        self.stdout.write(self.style.SUCCESS('Seed data loaded successfully.'))
