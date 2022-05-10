from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.dialects.mysql import BINARY, BLOB, INTEGER, TINYINT, VARCHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.types import JSON

from database import Base


class Users(Base):
    # Name of the Table
    __tablename__ = "Users"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    user_id = Column(INTEGER(unsigned=True), primary_key=True, nullable=False)
    username = Column(VARCHAR(32))
    password = Column(VARCHAR(512))
    startPassword = Column(VARCHAR(512))
    firstLogin = Column(Boolean)
    name = Column(VARCHAR(128))
    admin = Column(Boolean)
    email = Column(VARCHAR(256))
    phonenumber = Column(VARCHAR(128))
    class_id = Column(INTEGER(unsigned=True), ForeignKey('Classes.id'))
    token = Column(VARCHAR(512))
    token_expire = Column(DateTime)
    operationToken = Column(JSON)

    # ForeignKeys
    giveLessons = relationship("GiveLessons")

    def __repr__(self):
        return '<Users %r>' % self.username


class GiveLessons(Base):
    # Name of the Table
    __tablename__ = "GiveLessons"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    id = Column(INTEGER(unsigned=True), primary_key=True,
                index=True, nullable=False)
    user_id = Column(INTEGER(unsigned=True), ForeignKey(
        'Users.user_id'), nullable=False)
    subject = Column(String(4), ForeignKey('Subjects.shortcut',
                                           onupdate="cascade", ondelete="cascade"), nullable=False)
    times = Column(JSON, nullable=False)
    min_class = Column(Integer, nullable=False)
    max_class = Column(Integer, nullable=False)
    allowTel = Column(Boolean)
    allowEmail = Column(Boolean)

    # ForeignKeys
    matches = relationship("Matches")


class TakeLessons(Base):
    # Name of the Table
    __tablename__ = "TakeLessons"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    id = Column(INTEGER(unsigned=True), primary_key=True,
                index=True, nullable=False)
    user_id = Column(INTEGER(unsigned=True), ForeignKey(
        'Users.user_id'), nullable=False)
    subject = Column(String(4), ForeignKey('Subjects.shortcut',
                                           onupdate="cascade", ondelete="cascade"), nullable=False)
    times = Column(JSON, nullable=False)
    allowTel = Column(Boolean)
    allowEmail = Column(Boolean)

    # ForeignKeys
    matches = relationship("Matches")


class Subjects(Base):
    # Name of the Table
    __tablename__ = "Subjects"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    shortcut = Column(String(4), primary_key=True, index=True, nullable=False)
    long_name = Column(String(30), nullable=False)

    # ForeignKeys
    giveLessons = relationship("GiveLessons")


class Teacher(Base):
    # Name of the Table
    __tablename__ = "Teacher"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    shortcut = Column(String(4), primary_key=True, index=True, nullable=False)
    name = Column(String(32), nullable=False)
    email = Column(String(64), nullable=False)


class Classes(Base):
    # Name of the Table
    __tablename__ = "Classes"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    id = Column(INTEGER(unsigned=True), primary_key=True,
                index=True, nullable=False)
    name = Column(String(10), nullable=False)

    # ForeignKeys
    userClasses = relationship("Users")


class ConfigData(Base):
    # Name of the Table
    __tablename__ = "_ConfigData"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    id = Column(String(20), primary_key=True)
    content = Column(String(256))


class Matches(Base):
    # Name of the Table
    __tablename__ = "Matches"
    # Use existing table if possible
    __table_args__ = {'extend_existing': True}

    # Column Declaration
    giveLessons_id = Column(INTEGER(unsigned=True), ForeignKey(
        'GiveLessons.id'), primary_key=True)
    takeLessons_id = Column(INTEGER(unsigned=True),
                            ForeignKey('TakeLessons.id'), primary_key=True)
