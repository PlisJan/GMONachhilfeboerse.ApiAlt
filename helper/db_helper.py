from database import Session as DB
from db_tables import *

MONDAY = "Mo"
TUESDAY = "Di"
WEDNESDAY = "Mi"
THURSDAY = "Do"
FRIDAY = "Fr"
SATURDAY = "Sa"
SUNDAY = "Su"

def generateGraph():
    dbSession = DB()

    selectString = f"""
        SELECT 
            GiveLessons.id,TakeLessons.id
        FROM
            GiveLessons
        INNER JOIN TakeLessons
        ON GiveLessons.subject=TakeLessons.subject
        WHERE JSON_OVERLAPS(GiveLessons.times -> "$.{MONDAY}", TakeLessons.times -> "$.{MONDAY}") 
        OR JSON_OVERLAPS(GiveLessons.times -> "$.{TUESDAY}", TakeLessons.times -> "$.{TUESDAY}")
        OR JSON_OVERLAPS(GiveLessons.times -> "$.{WEDNESDAY}", TakeLessons.times -> "$.{WEDNESDAY}")
        OR JSON_OVERLAPS(GiveLessons.times -> "$.{THURSDAY}", TakeLessons.times -> "$.{THURSDAY}")
        OR JSON_OVERLAPS(GiveLessons.times -> "$.{FRIDAY}", TakeLessons.times -> "$.{FRIDAY}")
    """

    edges = dbSession.execute(selectString).fetchall()
    vertices_give = [value for value, in dbSession.query(GiveLessons.id).all()]
    vertices_take = [value for value, in dbSession.query(TakeLessons.id).all()]
    dbSession.close()
    edgeKeys = [x for x, y in edges]
    edgeValues = [y for x, y in edges]
    graph = {}
    for v in vertices_give:
        edgeList = []
        try:
            index = edgeKeys.index(v)
        except ValueError:
            index = -1
        while index != -1:
            edgeList.append(edgeValues[index])
            try:
                index = edgeKeys.index(v, index+1)
            except ValueError:
                index = -1
        graph.update({str(v): edgeList})
    return graph
