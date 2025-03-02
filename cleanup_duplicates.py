from your_flask_app import db
from your_flask_app.models import Appointment

def cleanup_duplicates():
    # Query to find duplicates based on name, email, date, and time
    duplicates = db.session.query(
        Appointment.name,
        Appointment.email,
        Appointment.date,
        Appointment.time,
        db.func.count(Appointment.id).label('count')
    ).group_by(
        Appointment.name,
        Appointment.email,
        Appointment.date,
        Appointment.time
    ).having(db.func.count(Appointment.id) > 1).all()

    for duplicate in duplicates:
        # Find all entries with the same name, email, date, and time
        entries = db.session.query(Appointment).filter_by(
            name=duplicate.name,
            email=duplicate.email,
            date=duplicate.date,
            time=duplicate.time
        ).all()

        # Keep the first entry and delete the rest
        for entry in entries[1:]:
            db.session.delete(entry)

    db.session.commit()

if __name__ == "__main__":
    cleanup_duplicates()
    print("Duplicate entries cleaned up.")
