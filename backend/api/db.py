import os
import urllib.parse
import ssl
import pg8000.dbapi
# pyrefly: ignore [missing-import]
from datetime import datetime
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load .env file for local development
load_dotenv()


DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Please create a .env file with your Neon connection string.")

class DictCursor:
    def __init__(self, cursor):
        self._cursor = cursor
    def execute(self, query, args=None):
        if args is None:
            return self._cursor.execute(query)
        return self._cursor.execute(query, args)
    def fetchone(self):
        row = self._cursor.fetchone()
        if not row: return None
        cols = [col[0] for col in self._cursor.description]
        return dict(zip(cols, row))
    def fetchall(self):
        rows = self._cursor.fetchall()
        cols = [col[0] for col in self._cursor.description]
        return [dict(zip(cols, row)) for row in rows]
    @property
    def rowcount(self):
        return self._cursor.rowcount

def get_db_connection():
    parsed = urllib.parse.urlparse(DATABASE_URL)
    conn = pg8000.dbapi.connect(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip('/'),
        ssl_context=ssl.create_default_context()
    )
    orig_cursor = conn.cursor
    conn.cursor = lambda: DictCursor(orig_cursor())
    return conn

def init_db():
    print("init_db: get_db_connection...")
    conn = get_db_connection()
    print("init_db: got conn")
    cursor = conn.cursor()

    print("init_db: creating tables...")
    # Create tables (PostgreSQL syntax)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            client TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            completion_percentage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            health_status TEXT NOT NULL DEFAULT 'On Track',
            contract_value DOUBLE PRECISION NOT NULL,
            amount_received DOUBLE PRECISION NOT NULL DEFAULT 0.0
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS milestones (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            due_date TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            author TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            date TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            payment_mode TEXT NOT NULL,
            reference_id TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            location TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            generated_by TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Published'
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open',
            reported_by TEXT NOT NULL,
            assigned_to TEXT NOT NULL,
            date_reported TEXT NOT NULL,
            date_resolved TEXT
        )
    ''')

    print("init_db: tables created. Committing...")
    conn.commit()
    print("init_db: committed tables.")

    # Check if we need to seed projects
    cursor.execute("SELECT COUNT(*) as count FROM projects")
    count = cursor.fetchone()['count']

    if count == 0:
        # Seed Projects
        projects_data = [
            ("Gachibowli Commercial Build-out", "Aurobindo Realty", "2026-01-10", "2026-12-15", 65.0, "On Track", 15000000.0, 10500000.0),
            ("Miyapur Multi-storey Complex", "Cybercity Builders", "2025-08-20", "2026-10-30", 82.0, "On Track", 42000000.0, 36000000.0),
            ("Banjara Hills Premium Retail Mall", "Vasavi Group", "2026-02-01", "2027-04-15", 28.0, "At Risk", 85000000.0, 45000000.0),
            ("Jubilee Hills Luxury Villa Enclave", "Private Owner", "2025-11-15", "2026-08-30", 45.0, "Delayed", 18000000.0, 10000000.0),
            ("Madhapur Co-working Hub", "WeWork India", "2026-03-15", "2026-09-30", 50.0, "On Track", 12000000.0, 8000000.0)
        ]

        for p in projects_data:
            cursor.execute('''
                INSERT INTO projects (name, client, start_date, end_date, completion_percentage, health_status, contract_value, amount_received)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', p)

        conn.commit()

        # Get projects IDs
        cursor.execute("SELECT id, name FROM projects")
        projects = {row['name']: row['id'] for row in cursor.fetchall()}

        # Seed Milestones
        milestones_data = [
            # Gachibowli
            (projects["Gachibowli Commercial Build-out"], "Foundation & Excavation", "2026-02-28", 1),
            (projects["Gachibowli Commercial Build-out"], "RCC Frame & Columns", "2026-05-15", 1),
            (projects["Gachibowli Commercial Build-out"], "Brickwork & Plastering", "2026-08-30", 0),
            (projects["Gachibowli Commercial Build-out"], "Electrical & Plumbing", "2026-10-15", 0),
            (projects["Gachibowli Commercial Build-out"], "Finishing & Handover", "2026-12-15", 0),

            # Miyapur
            (projects["Miyapur Multi-storey Complex"], "Structure Complete", "2025-12-20", 1),
            (projects["Miyapur Multi-storey Complex"], "Masonry & Wall Putty", "2026-03-15", 1),
            (projects["Miyapur Multi-storey Complex"], "Flooring & Tiling", "2026-05-30", 1),
            (projects["Miyapur Multi-storey Complex"], "MEP Fitting", "2026-08-15", 0),
            (projects["Miyapur Multi-storey Complex"], "Exterior Cladding", "2026-09-30", 0),
            (projects["Miyapur Multi-storey Complex"], "Final Handover", "2026-10-30", 0),

            # Banjara Hills
            (projects["Banjara Hills Premium Retail Mall"], "Excavation & Shoring", "2026-03-31", 1),
            (projects["Banjara Hills Premium Retail Mall"], "Basement Slabs Casting", "2026-06-30", 0),
            (projects["Banjara Hills Premium Retail Mall"], "Ground Floor Framing", "2026-09-15", 0),
            (projects["Banjara Hills Premium Retail Mall"], "Structure Completion", "2027-01-15", 0),

            # Jubilee Hills
            (projects["Jubilee Hills Luxury Villa Enclave"], "Excavation & Foundation", "2025-12-15", 1),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Ground Floor Slab", "2026-02-28", 1),
            (projects["Jubilee Hills Luxury Villa Enclave"], "First Floor & Roofing", "2026-05-15", 1),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Interior Drywalls & Electrical", "2026-07-15", 0),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Finishes & Landscaping", "2026-08-30", 0),

            # Madhapur
            (projects["Madhapur Co-working Hub"], "Demolition & Core Structural Changes", "2026-04-15", 1),
            (projects["Madhapur Co-working Hub"], "HVAC & Electrical Rough-ins", "2026-05-30", 1),
            (projects["Madhapur Co-working Hub"], "Drywall Framing & Glass Partitions", "2026-07-15", 0),
            (projects["Madhapur Co-working Hub"], "Furniture & Acoustical Paneling", "2026-08-30", 0),
            (projects["Madhapur Co-working Hub"], "Final Handover", "2026-09-30", 0)
        ]

        for m in milestones_data:
            cursor.execute('''
                INSERT INTO milestones (project_id, name, due_date, completed)
                VALUES (%s, %s, %s, %s)
            ''', m)

        # Seed Notes
        notes_data = [
            (projects["Gachibowli Commercial Build-out"], "RCC structure completed ahead of schedule. Quality team approved strength tests.", "2026-05-16T10:30:00Z", "Rajesh Kumar"),
            (projects["Gachibowli Commercial Build-out"], "Brickwork commenced on Block A. Material delivery received.", "2026-05-28T14:45:00Z", "Rajesh Kumar"),

            (projects["Miyapur Multi-storey Complex"], "Tiling completed for all floors in Wing B.", "2026-05-31T11:15:00Z", "Priya Sharma"),
            (projects["Miyapur Multi-storey Complex"], "HVAC ducting in common areas started. Progressing well.", "2026-06-12T09:00:00Z", "Priya Sharma"),

            (projects["Banjara Hills Premium Retail Mall"], "Heavy rains delayed excavation by 2 weeks in March.", "2026-04-02T16:20:00Z", "Vikram Reddy"),
            (projects["Banjara Hills Premium Retail Mall"], "Subcontractor resource constraints resolved. Basement casting underway.", "2026-06-10T10:00:00Z", "Vikram Reddy"),

            (projects["Jubilee Hills Luxury Villa Enclave"], "Custom Italian marble shipment delayed, pushing interior works back.", "2026-05-20T15:30:00Z", "Ananya Desai"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Owner requested design changes to kitchen layout, causing additional delay.", "2026-06-05T13:00:00Z", "Ananya Desai"),

            (projects["Madhapur Co-working Hub"], "HVAC rough-in approved by landlord's engineer.", "2026-05-29T10:00:00Z", "Suresh Patel"),
            (projects["Madhapur Co-working Hub"], "Glass partition frames delivered and installation started.", "2026-06-11T12:30:00Z", "Suresh Patel")
        ]

        for n in notes_data:
            cursor.execute('''
                INSERT INTO notes (project_id, text, timestamp, author)
                VALUES (%s, %s, %s, %s)
            ''', n)

        # Seed Payments
        payments_data = [
            (projects["Gachibowli Commercial Build-out"], "2026-01-15", 3000000.0, "Online", "TXN1029381"),
            (projects["Gachibowli Commercial Build-out"], "2026-04-10", 4000000.0, "Cheque", "CHQ8829182"),
            (projects["Gachibowli Commercial Build-out"], "2026-05-20", 3500000.0, "Online", "TXN9928172"),

            (projects["Miyapur Multi-storey Complex"], "2025-09-01", 10000000.0, "Online", "TXN3029102"),
            (projects["Miyapur Multi-storey Complex"], "2025-12-15", 15000000.0, "Online", "TXN5529182"),
            (projects["Miyapur Multi-storey Complex"], "2026-03-20", 11000000.0, "Cheque", "CHQ9029112"),

            (projects["Banjara Hills Premium Retail Mall"], "2026-02-10", 25000000.0, "Online", "TXN4029192"),
            (projects["Banjara Hills Premium Retail Mall"], "2026-05-05", 20000000.0, "Online", "TXN6629191"),

            (projects["Jubilee Hills Luxury Villa Enclave"], "2025-11-20", 5000000.0, "Online", "TXN2093819"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "2026-03-10", 5000000.0, "Cheque", "CHQ4401928"),

            (projects["Madhapur Co-working Hub"], "2026-03-20", 4000000.0, "Online", "TXN8829103"),
            (projects["Madhapur Co-working Hub"], "2026-05-18", 4000000.0, "Online", "TXN9028192")
        ]

        for p in payments_data:
            cursor.execute('''
                INSERT INTO payments (project_id, date, amount, payment_mode, reference_id)
                VALUES (%s, %s, %s, %s, %s)
            ''', p)

        # Seed Expenses
        expenses_data = [
            # Gachibowli
            (projects["Gachibowli Commercial Build-out"], "Labour", 2500000.0, "2026-02-15", "Wages for excavation and structural labour"),
            (projects["Gachibowli Commercial Build-out"], "Materials", 3800000.0, "2026-03-10", "Cement, TMT Steel reinforcement bar supplies"),
            (projects["Gachibowli Commercial Build-out"], "Machinery", 1200000.0, "2026-04-05", "Tower crane and transit mixer rentals"),
            (projects["Gachibowli Commercial Build-out"], "Subcontractor", 500000.0, "2026-05-12", "Electrical conduits rough-in piping contract"),
            (projects["Gachibowli Commercial Build-out"], "Miscellaneous", 200000.0, "2026-05-25", "Water tankers, safety PPE kits, and permits"),

            # Miyapur
            (projects["Miyapur Multi-storey Complex"], "Labour", 9000000.0, "2025-10-15", "Wages for RCC structural work phase 1"),
            (projects["Miyapur Multi-storey Complex"], "Materials", 14000000.0, "2025-11-20", "Steel, ready-mix concrete, masonry blocks"),
            (projects["Miyapur Multi-storey Complex"], "Machinery", 4000000.0, "2025-12-05", "Heavy excavation equipment and piling rigs"),
            (projects["Miyapur Multi-storey Complex"], "Subcontractor", 200000.0, "2026-02-10", "Plumbing rough-in subcontractors payment"),
            (projects["Miyapur Multi-storey Complex"], "Miscellaneous", 500000.0, "2026-04-18", "Site office utilities and licensing renewals"),

            # Banjara Hills
            (projects["Banjara Hills Premium Retail Mall"], "Labour", 12000000.0, "2026-02-25", "Wages for initial site clearing and basement casting"),
            (projects["Banjara Hills Premium Retail Mall"], "Materials", 18000000.0, "2026-03-20", "Piling steel, structural concrete, shoring items"),
            (projects["Banjara Hills Premium Retail Mall"], "Machinery", 6000000.0, "2026-04-12", "Excavator rental, fuel expenses, dewatering pumps"),
            (projects["Banjara Hills Premium Retail Mall"], "Subcontractor", 1500000.0, "2026-05-18", "Soil testing and structural engineering consulting"),
            (projects["Banjara Hills Premium Retail Mall"], "Miscellaneous", 500000.0, "2026-06-01", "Boundary wall fencing, safety nets, security personnel"),

            # Jubilee Hills
            (projects["Jubilee Hills Luxury Villa Enclave"], "Labour", 4000000.0, "2025-12-05", "Wages for brick masonry and plastering teams"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Materials", 5500000.0, "2026-02-12", "Premium finishes, bricks, teak wood framework"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Machinery", 1000000.0, "2026-03-05", "Concrete mixers, scaffold systems, hoist equipment"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Subcontractor", 500000.0, "2026-04-22", "Interior drywall framing team payment"),
            (projects["Jubilee Hills Luxury Villa Enclave"], "Miscellaneous", 200000.0, "2026-05-10", "Landscape designer advance, utility installations"),

            # Madhapur
            (projects["Madhapur Co-working Hub"], "Labour", 2000000.0, "2026-04-05", "Demolition crew wages, masonry partition labour"),
            (projects["Madhapur Co-working Hub"], "Materials", 3200000.0, "2026-04-28", "Drywall channels, glass sheets, wiring cable coils"),
            (projects["Madhapur Co-working Hub"], "Machinery", 500000.0, "2026-05-02", "Scaffolding towers and electric cutter tool rentals"),
            (projects["Madhapur Co-working Hub"], "Subcontractor", 500000.0, "2026-05-15", "HVAC ducting installation team"),
            (projects["Madhapur Co-working Hub"], "Miscellaneous", 300000.0, "2026-05-28", "Disposal skips, landlord approval charges, fire safety signs")
        ]

        for e in expenses_data:
            cursor.execute('''
                INSERT INTO expenses (project_id, category, amount, date, description)
                VALUES (%s, %s, %s, %s, %s)
            ''', e)

        conn.commit()

    # Check if we need to seed users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()['count'] == 0:
        import hashlib
        def hp(p):
            return hashlib.sha256(p.encode('utf-8')).hexdigest()
        users_data = [
            ("admin", hp("admin123"), "Manas Abhishek", "Admin", "Hyderabad"),
            ("manager", hp("manager123"), "Rajesh Kumar", "Site Manager", "Gachibowli Site"),
            ("client", hp("client123"), "Aurobindo Rep", "Client", "Aurobindo Head Office")
        ]
        for u in users_data:
            cursor.execute('''
                INSERT INTO users (username, password_hash, full_name, role, location)
                VALUES (%s, %s, %s, %s, %s)
            ''', u)
        conn.commit()

    # Get project IDs (re-fetch to be safe)
    cursor.execute("SELECT id, name FROM projects")
    projects_dict = {row['name']: row['id'] for row in cursor.fetchall()}

    # Check if we need to seed reports
    cursor.execute("SELECT COUNT(*) as count FROM reports")
    if cursor.fetchone()['count'] == 0 and projects_dict:
        reports_data = [
            (projects_dict["Gachibowli Commercial Build-out"], "Q1 Progress Report", "Progress", "The project is currently on track. RCC frame is completed for the first three floors. Material supplies are steady.", "Rajesh Kumar", "2026-03-31", "Published"),
            (projects_dict["Gachibowli Commercial Build-out"], "Safety Audit Report - May 2026", "Safety", "Routine safety audit conducted on 15th May. Minor violations regarding PPE usage were identified and corrected. Overall compliance is 95%.", "Suresh Patel", "2026-05-18", "Published"),
            (projects_dict["Miyapur Multi-storey Complex"], "Monthly Financial Review", "Financial", "Expenditures are within the projected budget. Cumulative expenses stand at 27.7M against 36M received.", "Priya Sharma", "2026-04-30", "Published"),
            (projects_dict["Banjara Hills Premium Retail Mall"], "Geotechnical Investigation & Excavation Compliance", "Compliance", "Soil bearing capacity tests approved by municipal structural engineer. Excavation has proceeded to the basement-2 level.", "Vikram Reddy", "2026-03-15", "Published"),
            (projects_dict["Banjara Hills Premium Retail Mall"], "Monsoon Preparedness Draft", "Safety", "Dewatering pumps and site retaining walls inspected for upcoming rainy season. Temporary shelters for workforce have been reinforced.", "Vikram Reddy", "2026-06-12", "Draft"),
            (projects_dict["Jubilee Hills Luxury Villa Enclave"], "Schedule Delay & Recovery Plan", "Progress", "The project is currently 45 days behind schedule due to custom marble shipment delays and design alterations in the kitchen layouts requested by the client.", "Ananya Desai", "2026-05-25", "Published"),
            (projects_dict["Madhapur Co-working Hub"], "HVAC Installation Milestone Progress", "Progress", "HVAC ducting is 90% completed. Pressure testing has been successful on the east wing. Furniture fit-outs scheduled for next week.", "Suresh Patel", "2026-06-05", "Published"),
            (projects_dict["Madhapur Co-working Hub"], "Safety Standards Inspection", "Safety", "Fire extinguisher installation completed and certified by vendor. Fire exits demarcated and smoke detectors tested.", "Suresh Patel", "2026-06-10", "Published")
        ]
        for r in reports_data:
            cursor.execute('''
                INSERT INTO reports (project_id, title, type, content, generated_by, date, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', r)
        conn.commit()

    # Check if we need to seed issues
    cursor.execute("SELECT COUNT(*) as count FROM issues")
    if cursor.fetchone()['count'] == 0 and projects_dict:
        issues_data = [
            (projects_dict["Banjara Hills Premium Retail Mall"], "Excavation Dewatering Pump Failure", "One of the primary diesel dewatering pumps broke down, causing water accumulation in basement level 2.", "High", "Resolved", "Vikram Reddy", "Subcontractor Mechanic", "2026-05-10", "2026-05-12"),
            (projects_dict["Banjara Hills Premium Retail Mall"], "Subcontractor Labour Shortage", "Fewer masonry workers reported on site, slowing down the boundary wall construction.", "Medium", "In Progress", "Vikram Reddy", "Labour Agency Co", "2026-06-08", None),
            (projects_dict["Gachibowli Commercial Build-out"], "Delayed Cement Delivery", "Supplier delayed the delivery of 500 bags of OPC cement by 3 days, postponing structural columns casting.", "Medium", "Resolved", "Rajesh Kumar", "UltraTech Logistics", "2026-04-12", "2026-04-15"),
            (projects_dict["Gachibowli Commercial Build-out"], "Worker PPE Non-Compliance", "Safety inspector observed three scaffolding workers without safety harnesses.", "Critical", "Resolved", "Suresh Patel", "Rajesh Kumar", "2026-05-15", "2026-05-15"),
            (projects_dict["Jubilee Hills Luxury Villa Enclave"], "Italian Marble Customs Hold", "Shipment of custom marble is currently stuck at Chennai port customs for clearance, delaying villa floor finishes.", "High", "Open", "Ananya Desai", "Logistics Manager", "2026-05-20", None),
            (projects_dict["Jubilee Hills Luxury Villa Enclave"], "Electrical Layout Revamp Request", "Client requested relocation of all smart switches and power outlets in the master bedroom suite.", "Low", "In Progress", "Ananya Desai", "Lead Electrician", "2026-06-02", None),
            (projects_dict["Miyapur Multi-storey Complex"], "Water Supply Line Leakage", "Temporary connection line to the curing tank developed a crack, wasting water and creating a muddy puddle.", "Low", "Resolved", "Priya Sharma", "Plumbing Lead", "2026-06-11", "2026-06-12"),
            (projects_dict["Madhapur Co-working Hub"], "Acoustical Panel Delivery Discrepancy", "Delivered panels are of a lighter shade of grey than specified in the design contract.", "Medium", "Open", "Suresh Patel", "Procurement Executive", "2026-06-14", None)
        ]
        for i in issues_data:
            cursor.execute('''
                INSERT INTO issues (project_id, title, description, severity, status, reported_by, assigned_to, date_reported, date_resolved)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', i)
        conn.commit()

    print("init_db: finishing up.")
    conn.close()
    print("init_db: closed conn.")

# Initialize Database Schema & Seed Data
# init_db()  # Commented out to prevent module-level execution blocking

