from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from src.utils.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False)
    image_url = Column(String, nullable=True)

    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)

    city = relationship("City", backref="hospitals")