"""Generate the public CV from the portfolio's verified content.

Run with Python and reportlab. The PDF is copied into the public asset tree.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import shutil

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
    PageBreak, HRFlowable,
)

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data/portfolio-data.json').read_text(encoding='utf-8'))
PERSON = DATA['personal']
SITE = 'https://kazi-jawad-portfolio.kazihouse123.chatgpt.site'
OUTPUT = ROOT / 'output/pdf/MD_Kazi_Jawadul_Islam_CV.pdf'
PUBLIC = ROOT / 'assets/documents' / OUTPUT.name
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
PUBLIC.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor('#182b3c')
TEAL = colors.HexColor('#167c82')
BODY = colors.HexColor('#374650')
MUTED = colors.HexColor('#647480')
LINE = colors.HexColor('#dce3e7')
# ReportLab's page frame adds 6 points of inner padding on each side.
WIDTH = A4[0] - 108

styles = {
    'name': ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=24, leading=29, textColor=INK, spaceAfter=5),
    'role': ParagraphStyle('role', fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=TEAL, spaceAfter=4),
    'subtitle': ParagraphStyle('subtitle', fontName='Helvetica', fontSize=9.7, leading=14, textColor=BODY, spaceAfter=7),
    'contact': ParagraphStyle('contact', fontName='Helvetica', fontSize=9, leading=13, textColor=BODY, spaceAfter=4),
    'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=TEAL, spaceBefore=12, spaceAfter=7, keepWithNext=True),
    'title': ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=10.2, leading=13.5, textColor=INK),
    'org': ParagraphStyle('org', fontName='Helvetica', fontSize=9.5, leading=13, textColor=BODY),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=BODY, spaceAfter=4),
    'profile': ParagraphStyle('profile', fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=BODY, spaceAfter=7, alignment=TA_JUSTIFY),
    'date': ParagraphStyle('date', fontName='Helvetica', fontSize=8.4, leading=13.5, textColor=MUTED, alignment=TA_RIGHT),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.7, leading=12.5, textColor=MUTED),
    'page2': ParagraphStyle('page2', fontName='Helvetica-Bold', fontSize=18, leading=23, textColor=INK, spaceAfter=5),
}


def clean(value):
    return str(value).replace('\u2013', '-').replace('\u2014', '-').replace('\u2011', '-')


def p(value, style='body'):
    return Paragraph(escape(clean(value)), styles[style])


def rich(value, style='body'):
    return Paragraph(value, styles[style])


def link(label, url):
    return f'<link href="{escape(url, {chr(34): "&quot;"})}" color="#167c82">{escape(label)}</link>'


def section(label):
    return p(label.upper(), 'section')


def heading_row(title, date):
    row = Table([[p(title, 'title'), p(date, 'date')]], colWidths=[WIDTH - 142, 142])
    row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return row


def footer(canvas, total):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(.5)
    canvas.line(54, 36, A4[0] - 54, 36)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(54, 23, PERSON['name'])
    canvas.drawRightString(A4[0] - 54, 23, f'{canvas.getPageNumber():02d} / {total:02d}')
    canvas.restoreState()


class NumberedCanvas(pdfcanvas.Canvas):
    """Write accurate page counts after the complete story has been laid out."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.page_states = []

    def showPage(self):
        self.page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self.page_states)
        for state in self.page_states:
            self.__dict__.update(state)
            footer(self, total)
            super().showPage()
        super().save()


story = [
    p(PERSON['name'], 'name'),
    p('Business Analyst', 'role'),
    rich('B.Sc in Computing and Information System (CIS)<br/>'
         'Daffodil International University | Major in Artificial Intelligence', 'subtitle'),
    rich(link(PERSON['email'], 'mailto:' + PERSON['email']) + ' &nbsp; | &nbsp; ' +
         link(PERSON['phone'], 'tel:' + PERSON['phone']) + ' &nbsp; | &nbsp; ' + escape(PERSON['address']), 'contact'),
    rich(' &nbsp; / &nbsp; '.join([link('Portfolio', SITE), link('LinkedIn', PERSON['linkedin']), link('GitHub', PERSON['github'])]), 'contact'),
    Spacer(1, 6),
    HRFlowable(width='100%', thickness=1.5, color=INK),
    section('About Me'),
]
story.extend(p(paragraph, 'profile') for paragraph in PERSON['about'].split('\n\n') if paragraph.strip())
story.append(section('Experience & Leadership'))

# Preserve the portfolio's roles, dates, organizations, and stated responsibilities.
for experience in DATA['experiences'][:5]:
    story.append(KeepTogether([
        heading_row(experience['role'], experience['duration']),
        p(experience['organization'], 'org'),
        p(experience['description']),
        Spacer(1, 4),
    ]))

story.append(section('Skills & Tools'))
technical = [item['name'] for item in DATA['technicalSkills'] if item['name'] not in ['Communication', 'Problem Solving']]
strengths = [item['name'] for item in DATA['technicalSkills'] if item['name'] in ['Communication', 'Problem Solving']]
tools = [item['name'] for item in DATA['toolSkills']]
for label, values in [('Technical', technical), ('Tools', tools), ('Professional', strengths)]:
    story.append(rich(f'<b>{label}:</b> ' + escape(', '.join(values))))
story.append(section('Interests'))
story.append(p(' | '.join(DATA['interests'])))

story.extend([
    PageBreak(),
    p('Projects, education & activities', 'page2'),
    p('MD Kazi Jawadul Islam | Curriculum Vitae', 'small'),
    Spacer(1, 6),
    HRFlowable(width='100%', thickness=1.5, color=INK),
    section('Selected Projects'),
])

project_details = [
    ('nexora', 'React, TypeScript, Vite, Tailwind CSS',
     'Frontend ERP prototype combining finance, inventory, procurement, HR, and governance for multiple businesses. Features entity-based access, approval workflows, intercompany transactions, and hash-chained audit records with browser-local demonstration data.'),
    ('security-system', 'Arduino, ultrasonic and IR sensors, servos, keypad',
     'Educational scale-model simulation combining ultrasonic object sensing and servo feedback with an independent keypad-controlled security subsystem. LEDs, buzzer feedback, and timed access states demonstrate sensing and control logic.'),
    ('flipbook-catalogue', 'React, TypeScript, Vite, CSS 3D transforms',
     'Customizable web catalogue with a book-like page-turn interface, searchable index, thumbnails, zoom, and fullscreen reading. Supports button, keyboard, and pointer navigation with configurable branding and page content.'),
    ('maison-velour', 'HTML, CSS, JavaScript, Three.js',
     'Fragrance storefront prototype featuring a walkable 3D boutique, seven fragrance houses, a mini-map, and interactive bottle inspection. Includes a live gift builder and demo-bag reward tiers; checkout is not connected.'),
    ('hridita-portfolio', 'HTML, CSS, JavaScript, responsive design',
     'Editorial fashion portfolio with an animated five-look runway, individual collection pages, seven interactive atelier studies, and a cinematic journal. Supports swipe, drag, keyboard navigation, and reduced motion.'),
    ('3d-building-blueprint', 'JavaScript, Three.js, parametric 3D visualization',
     'Interactive building concept configurator with four framing systems, adjustable dimensions, live measurements, and exploded views. Exports a rendered PNG and downloadable design brief; intended for concept visualization, not structural calculation.'),
]

article_by_id = {article['id']: article for article in DATA['articles']}
for project_id, technologies, overview in project_details:
    article = article_by_id[project_id]
    story.append(KeepTogether([
        rich(link(clean(article['title']), SITE + '/' + article['href']), 'title'),
        p(technologies, 'small'),
        Spacer(1, 3),
        p(overview),
        Spacer(1, 3),
    ]))

story.append(section('Education'))
for education in DATA['education']:
    details = education['major'] if education['id'] == 1 else education.get('gpa', '')
    story.append(KeepTogether([
        heading_row(education['degree'], education['year']),
        p(education['institution'] + ' | ' + details, 'org'),
        Spacer(1, 5),
    ]))

story.append(section('Certification & Expos'))
story.append(p(' | '.join(DATA['certifications'])))

activities = '; '.join(
    experience['organization'] + ' - ' + experience['role'] + ' (' + experience['duration'] + ')'
    for experience in DATA['experiences'][5:]
)
story.append(KeepTogether([section('Additional Activities'), p(activities + '.')]))

document = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=48, leftMargin=48,
    topMargin=43, bottomMargin=48, title=PERSON['name'] + ' - Curriculum Vitae',
    author=PERSON['name'], subject='Experience, education, skills, and selected projects',
    pageCompression=1,
)
document.build(story, canvasmaker=NumberedCanvas)
shutil.copyfile(OUTPUT, PUBLIC)
print(OUTPUT)
print(PUBLIC)
