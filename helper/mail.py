from flask_mail import Mail
from enum import Enum

class Operations(Enum):
    DELETE_ACCOUNT="deleteAccount"
    CHANGE_EMAIL="changeEmail"

mail = Mail()