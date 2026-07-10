from sqlalchemy import Column, Integer, String

from src.utils.database import Base


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    province = Column(String, nullable=True)