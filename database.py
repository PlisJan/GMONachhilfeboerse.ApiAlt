# import os

# from sqlalchemy.engine import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm.session import sessionmaker

# DBhost = "127.0.0.1"  # os.environ.get("dbHost")
# engine = create_engine(
#     'mysql://nachhilfeboerse:Nachhilfeboerse@{}:3306/nachhilfeboerse'.format(DBhost))  # TODO: Store in env var
# Base = declarative_base()
# Session = sessionmaker(engine)

import os

from sqlalchemy.engine import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.session import sessionmaker

DBhost = "v2202110158863166299.supersrv.de"  # os.environ.get("dbHost")
engine = create_engine(
    'mysql://nachhilfeboerse:Nachhilfeboerse@{}:3306/nachhilfeboerse'.format(DBhost))  # TODO: Store in env var
Base = declarative_base()
Session = sessionmaker(engine)
