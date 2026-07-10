from sqlalchemy.orm import Session

from src.cities.models import City


def list_cities(db: Session) -> list:
    return db.query(City).order_by(City.name).all()