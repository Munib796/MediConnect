from sqlalchemy.orm import Session

from src.specializations.models import Specialization


def list_specializations(db: Session) -> list:
    return db.query(Specialization).order_by(Specialization.name).all()