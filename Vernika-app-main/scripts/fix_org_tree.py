#!/usr/bin/env python3
"""
Fix Organization Tree - Populate sample data for Vernika hierarchy
"""

import os
from pathlib import Path
from database.connection import get_db_session
from database.models import (
    Employee, Department, Position, OrgHierarchy, User, Role, Company
)
from sqlalchemy import func
import bcrypt

BASE_DIR = Path(__file__).parent.parent
PHOTO_PATH = BASE_DIR / "assets/profile_photos/shashank.jpg"


def fix_org_tree():
    db = get_db_session()
    try:
        print("Checking current state...")
        emp_count = db.query(func.count(Employee.id)).scalar()
        hier_count = db.query(func.count(OrgHierarchy.id)).scalar()
        print(f"Employees: {emp_count}, Hierarchy: {hier_count}")

        if emp_count > 0:
            print("Data exists, skipping...")
            return

        print("Creating sample data...")

        # Create Company
        company = db.query(Company).first()
        if not company:
            company = Company(name="Vernika Technologies",
                              email="hr@vernika.com")
            db.add(company)
            db.flush()
            print("Company created")

        # Create Admin Role/User
        admin_role = db.query(Role).filter(Role.name == 'admin').first()
        if not admin_role:
            admin_role = Role(name='admin', display_name='Administrator')
            db.add(admin_role)
            db.flush()

        admin_user = db.query(User).filter(User.username == 'Vernika').first()
        if not admin_user:
            password = bcrypt.hashpw(b'vernika8268', bcrypt.gensalt()).decode()
            admin_user = User(
                username='Vernika',
                email='admin@vernika.com',
                password_hash=password,
                role_id=admin_role.id
            )
            db.add(admin_user)
            db.flush()
            print("Admin user created")

        # Create HR Department & Position
        hr_dept = db.query(Department).filter(Department.code == 'HR').first()
        if not hr_dept:
            hr_dept = Department(name='Human Resources', code='HR')
            db.add(hr_dept)
            db.flush()

        hr_mgr_pos = db.query(Position).filter(
            Position.code == 'HRMGR').first()
        if not hr_mgr_pos:
            hr_mgr_pos = Position(title='HR Manager',
                                  code='HRMGR', department_id=hr_dept.id)
            db.add(hr_mgr_pos)
            db.flush()

        # Create ROOT Employee (Shashank)
        shashank = db.query(Employee).filter(
            Employee.employee_code == 'SH001').first()
        if not shashank:
            shashank = Employee(
                employee_code='SH001',
                user_id=admin_user.id,
                company_id=company.id,
                first_name='Shashank',
                last_name='Rajput',
                email='shashank@vernika.com',
                department_id=hr_dept.id,
                position_id=hr_mgr_pos.id,
                profile_photo='shashank.jpg',
                is_active=True
            )
            db.add(shashank)
            db.flush()
            print("Shashank (Root CEO) created")

        # Create child employee
        dev_pos = db.query(Position).filter(Position.code == 'DEV').first()
        if not dev_pos:
            dev_pos = Position(title='Software Developer',
                               code='DEV', department_id=hr_dept.id)
            db.add(dev_pos)
            db.flush()

        dev_emp = db.query(Employee).filter(
            Employee.employee_code == 'DEV001').first()
        if not dev_emp:
            dev_emp = Employee(
                employee_code='DEV001',
                first_name='Dev',
                last_name='Employee',
                email='dev@vernika.com',
                department_id=hr_dept.id,
                position_id=dev_pos.id,
                profile_photo='shashank.jpg',
                is_active=True
            )
            db.add(dev_emp)
            db.flush()
            print("Dev Employee created")

        # Create Hierarchy
        shashank_hier = OrgHierarchy(
            employee_id=shashank.id,
            hierarchy_level=1,  # CEO
            reports_to_id=None
        )
        db.add(shashank_hier)

        dev_hier = OrgHierarchy(
            employee_id=dev_emp.id,
            hierarchy_level=4,  # Employee
            reports_to_id=shashank.id
        )
        db.add(dev_hier)

        db.commit()
        print("Hierarchy created: Shashank (CEO Root) -> Dev Employee")
        print("Organization Tree ready! Test in app.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == '__main__':
    fix_org_tree()
