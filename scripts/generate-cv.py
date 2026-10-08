"""Generate the public CV from the portfolio's verified content.

Run with Python and reportlab. The PDF is copied into the public asset tree.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import shutil

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
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
    'name': ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=26, leading=31, textColor=INK, spaceAfter=7),
    'subtitle': ParagraphStyle('subtitle', fontName='Helvetica', fontSize=11, leading=16, textColor=TEAL, spaceAfter=11),
    'contact': ParagraphStyle('contact', fontName='Helvetica', fontSize=9.1, leading=14, textColor=BODY, spaceAfter=5),
    'section': ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=TEAL, spaceBefore=17, spaceAfter=9),
    'title': ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=10.6, leading=14.4, textColor=INK),
    'org': ParagraphStyle('org', fontName='Helvetica', fontSize=10, leading=14, textColor=BODY),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=14.4, textColor=BODY, spaceAfter=5),
    'date': ParagraphStyle('date', fontName='Helvetica', fontSize=8.6, leading=14.4, textColor=MUTED, alignment=TA_RIGHT),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=9, leading=13, textColor=MUTED),
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


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(.5)
    canvas.line(54, 36, A4[0] - 54, 36)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(54, 23, PERSON['name'])
    canvas.drawRightString(A4[0] - 54, 23, f'{doc.page:02d} / 02')
    canvas.restoreState()


story = [
    p(PERSON['name'], 'name'),
    p('Business Analyst | CIS Student, Artificial Intelligence', 'subtitle'),
    rich(link(PERSON['email'], 'mailto:' + PERSON['email']) + ' &nbsp; | &nbsp; ' +
         link(PERSON['phone'], 'tel:' + PERSON['phone']) + ' &nbsp; | &nbsp; ' + escape(PERSON['address']), 'contact'),
    rich(' &nbsp; / &nbsp; '.join([link('Portfolio', SITE), link('LinkedIn', PERSON['linkedin']), link('GitHub', PERSON['github'])]), 'contact'),
    Spacer(1, 6),
    HRFlowable(width='100%', thickness=1.5, color=INK),
    section('Profile'),
    p('Business Analyst at Akand Engineering and B.Sc. student in Computing and Information Systems at Daffodil International University, majoring in Artificial Intelligence. Experience in business-process analysis, community leadership, student outreach, and graphic design, with interests in AI, cybersecurity, and the Internet of Things.'),
    section('Experience & Leadership'),
]

# Preserve the portfolio's roles, dates, organizations, and stated responsibilities.
for experience in DATA['experiences'][:5]:
    story.append(KeepTogether([
        heading_row(experience['role'], experience['duration']),
        p(experience['organization'], 'org'),
        p(experience['description']),
        Spacer(1, 7),
    ]))

story.append(section('Education'))
for education in DATA['education']:
    details = education['major'] if education['id'] == 1 else education.get('gpa', '')
    story.append(KeepTogether([
        heading_row(education['degree'], education['year']),
        p(education['institution'], 'org'),
        p(details, 'small'),
        Spacer(1, 9),
    ]))

story.extend([
    PageBreak(),
    p('Projects, skills & activities', 'page2'),
    p('MD Kazi Jawadul Islam | Curriculum Vitae', 'small'),
    Spacer(1, 10),
    HRFlowable(width='100%', thickness=1.5, color=INK),
    section('Selected Projects'),
])

project_details = [
    ('nexora', 'React, TypeScript, Vite, Tailwind CSS',
     'Frontend ERP prototype bringing finance, inventory, procurement, HR, and governance workflows into a shared workspace for multiple businesses.',
     'Explores entity-based access, approvals, intercompany transactions, and hash-chained audit records using browser-local demonstration data.'),
    ('security-system', 'Arduino, ultrasonic and IR sensors, servos, keypad',
     'Educational scale-model simulation combining ultrasonic object sensing and servo feedback with an independent keypad-controlled security subsystem.',
     'Uses LEDs, buzzer feedback, and timed access states to demonstrate sensing, control logic, and perimeter monitoring.'),
    ('flipbook-catalogue', 'React, TypeScript, Vite, CSS 3D transforms',
     'Customizable web catalogue with a book-like page-turn interface, searchable index, thumbnails, zoom, and fullscreen reading.',
     'Supports button, keyboard, and pointer navigation; structured as a static frontend template with configurable branding and page content.'),
]

article_by_id = {article['id']: article for article in DATA['articles']}
for project_id, technologies, overview, detail in project_details:
    article = article_by_id[project_id]
    story.append(KeepTogether([
        rich(link(clean(article['title']), SITE + '/' + article['href']), 'title'),
        p(technologies, 'small'),
        Spacer(1, 5),
        p(overview),
        p(detail),
        Spacer(1, 9),
    ]))

story.append(section('Skills & Tools'))
technical = [item['name'] for item in DATA['technicalSkills'] if item['name'] not in ['Communication', 'Problem Solving']]
strengths = [item['name'] for item in DATA['technicalSkills'] if item['name'] in ['Communication', 'Problem Solving']]
tools = [item['name'] for item in DATA['toolSkills']]
for label, values in [('Technical', technical), ('Tools', tools), ('Professional', strengths)]:
    story.append(rich(f'<b>{label}:</b> ' + escape(', '.join(values))))

story.append(section('Certification & Expos'))
story.append(p(' | '.join(DATA['certifications'])))

story.append(section('Additional Activities'))
for experience in DATA['experiences'][5:]:
    story.append(KeepTogether([
        heading_row(experience['organization'] + ' | ' + experience['role'], experience['duration']),
        Spacer(1, 7),
    ]))

story.append(section('Interests'))
story.append(p(' | '.join(DATA['interests'])))

document = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=48, leftMargin=48,
    topMargin=43, bottomMargin=48, title=PERSON['name'] + ' - Curriculum Vitae',
    author=PERSON['name'], subject='Experience, education, skills, and selected projects',
    pageCompression=1,
)
document.build(story, onFirstPage=footer, onLaterPages=footer)
shutil.copyfile(OUTPUT, PUBLIC)
print(OUTPUT)
print(PUBLIC)
