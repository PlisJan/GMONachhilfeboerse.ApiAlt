import datetime
import hashlib
import json
import secrets
import uuid

from flask import Flask, abort, jsonify, make_response, request
from sqlalchemy.sql.functions import user
from werkzeug.security import check_password_hash, generate_password_hash

from database import Session as DB
from db_tables import *
from helper.db_helper import *
from helper.hopcroftkarp import HopcroftKarp
from helper.mail import Operations, mail


def hash_pw(username: str, password: str):
    return hashlib.sha256(bytes(username.lower() + password, "utf-8")).hexdigest()


app = Flask(__name__)

getGiveOffersSql = """
SELECT 
        GiveLessons.id,
        GiveLessons.subject,
        GiveLessons.times,
        GiveLessons.min_class,
        GiveLessons.max_class,
        TakeLessons.allowEmail, 
        TakeLessons.allowTel,
        u1.name, 
        u1.email, 
        u1.phonenumber
    FROM
        Users AS u1
            INNER JOIN
        TakeLessons ON u1.user_id = TakeLessons.user_id
            RIGHT JOIN
        Matches ON TakeLessons.id = Matches.takeLessons_id
            RIGHT JOIN
        GiveLessons ON Matches.giveLessons_id = GiveLessons.id
            INNER JOIN
        Users AS u2 ON GiveLessons.user_id = u2.user_id
    WHERE
        u2.username = '{}'
    ORDER BY GiveLessons.id ASC
    """

getTakeOffersSql = """    
SELECT 
    TakeLessons.id,
    TakeLessons.subject,
    TakeLessons.times,
    GiveLessons.allowEmail,
    GiveLessons.allowTel , 
    u2.name,
    u2.email, 
    u2.phonenumber
FROM
    Users AS u1
        INNER JOIN
    TakeLessons ON u1.user_id = TakeLessons.user_id
        LEFT JOIN
    Matches ON TakeLessons.id = Matches.takeLessons_id
        LEFT JOIN
    GiveLessons ON Matches.giveLessons_id = GiveLessons.id
        LEFT JOIN
    Users AS u2 ON GiveLessons.user_id = u2.user_id
WHERE
    u1.username = '{}'
ORDER BY TakeLessons.id ASC
    """


@app.route('/nachhilfeboerse/api/login', methods=['POST'])
def login():
    requestData = json.loads(request.data)
    dbSession = DB()

    loginData = dbSession.query(Users).filter(
        Users.username == requestData.get("username").lower()).first()
    if loginData is None:
        resp = make_response(jsonify({'status': False}))

    elif (hash_pw(requestData.get("username"), requestData.get("password")) == loginData.password):
        token = secrets.token_urlsafe(256)
        dbSession.query(Users).filter(
            Users.username == loginData.username).update({Users.token: token})
        dbSession.commit()
        resp = make_response(
            jsonify(
                {'status': True,
                 "user": requestData.get("username").lower(),
                 "firstlogin": loginData.firstLogin,
                 'token': token}))
    else:
        resp = make_response(jsonify({'status': False}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/logout', methods=['GET'])
def logout():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        dbSession.query(Users).filter(
            Users.username == username).update({Users.token: None})
        dbSession.commit()
        resp = make_response(
            jsonify(
                {"status": "Logged Out"}))
    else:
        resp = make_response(
            jsonify(
                {"status": "Permissionerror"}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/changePassword', methods=['POST'])
def changePassword():
    data = json.loads(request.data)
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):

        loginData = dbSession.query(Users).filter(
            Users.username == username.lower()).first()
        if(loginData is not None):
            if(hash_pw(username, data.get("oldPassword")) == loginData.password):
                dbSession.query(Users).filter(
                    Users.username == loginData.username).update({Users.password: hash_pw(username, data.get("newPassword"))}).hexdigest()})
                dbSession.commit()
                resp = make_response(jsonify({'status': True, }))
            else:
                resp = make_response(jsonify({'status': False}))
        else:
            resp = make_response(jsonify({'status': False}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/addPeronalData', methods=['POST'])
def addPeronalData():
    username = request.args.get('username')
    token = request.args.get('token')
    data = json.loads(request.data)
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        dbSession.query(Users).filter(
            Users.username == username).update({Users.name: data.get("name"), Users.email: data.get("email"), Users.phonenumber: data.get("phonenumber"), Users.firstLogin: False})
        dbSession.commit()
        resp = make_response(
            jsonify(
                {"status": True}))
    else:
        resp = make_response(
            jsonify(
                {"status": False}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


def isLoggedIn(dbSession, username, token):
    loginData = dbSession.query(Users).filter(
        Users.username == username.lower()).first()
    if(loginData is not None):
        return loginData.token == token
    return False


def isAdminLogin(dbSession, username, token):
    loginData = dbSession.query(Users).filter(
        Users.username == username.lower()).first()
    if(loginData is not None):
        return loginData.token == token and loginData.admin
    return False


@app.route('/nachhilfeboerse/api/getSubjects', methods=['GET'])
def getSubjects():

    dbSession = DB()
    res = {}
    for subject in dbSession.query(Subjects).all():
        res.update({subject.shortcut: subject.long_name})

    resp = make_response(jsonify(res))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


# Give Offers

@app.route('/nachhilfeboerse/api/addGiveOffer', methods=['POST'])
def addGiveOffer():
    username = request.args.get('username')
    token = request.args.get('token')
    data = json.loads(request.data)
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        userID = dbSession.query(Users.user_id).filter(
            Users.username == username).first()[0]
        newOffer = GiveLessons(user_id=userID, subject=data.get("subject"), times=data.get("times"), allowTel=data.get(
            "allowTel"), allowEmail=data.get("allowEmail"), min_class=data.get("minClass"), max_class=data.get("maxClass"))
        dbSession.add(newOffer)
        dbSession.commit()
        resp = make_response(
            jsonify(
                {'status': True}))
    else:
        resp = make_response(
            jsonify(
                {'status': False}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/getGiveOffers', methods=['GET'])
def getGiveOffers():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        giveLessonsData = dbSession.execute(
            getGiveOffersSql.format(username.lower())).fetchall()
        res = []
        for giveLesson in giveLessonsData:
            res.append({
                "matched": giveLesson[7] is not None,
                "subject": giveLesson[1],
                "times": json.loads(giveLesson[2]),
                "minClass": giveLesson[3],
                "maxClass": giveLesson[4],
                "name": giveLesson[7],
                "email": giveLesson[8] if giveLesson[5] == 1 else "",
                "tel": giveLesson[9] if giveLesson[6] == 1 else "",
                "idNum": giveLesson[0]
            })
        resp = make_response(
            jsonify(
                {'status': 'worked', "giveOffers":     res}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route('/nachhilfeboerse/api/delGiveOffer', methods=['POST'])
def delGiveOffer():
    data = json.loads(request.data)
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        if dbSession.query(GiveLessons).join(Users).filter(GiveLessons.id == data.get("idNum")).filter(Users.username == username).first() is not None:
            dbSession.query(GiveLessons).filter(
                GiveLessons.id == data.get("idNum")).delete()
            dbSession.commit()
            resp = make_response(
                jsonify(
                    {'status': True}))
        else:
            resp = make_response(
                jsonify(
                    {'status': False}))
    else:
        resp = make_response(
            jsonify(
                {'status': False}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


# Take Offers

@app.route('/nachhilfeboerse/api/addTakeOffer', methods=['POST'])
def addTakeOffer():
    username = request.args.get('username')
    token = request.args.get('token')
    data = json.loads(request.data)
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        userID = dbSession.query(Users.user_id).filter(
            Users.username == username).first()[0]
        newOffer = TakeLessons(user_id=userID, subject=data.get("subject"), times=data.get("times"), allowTel=data.get(
            "allowTel"), allowEmail=data.get("allowEmail"))
        dbSession.add(newOffer)
        dbSession.commit()
        resp = make_response(
            jsonify(
                {'status': True}))
    else:
        resp = make_response(
            jsonify(
                {'status': False}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/getTakeOffers', methods=['GET'])
def getTakeOffers():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        takeLessonsData = dbSession.execute(
            getTakeOffersSql.format(username.lower())).fetchall()
        res = []
        for takeLesson in takeLessonsData:
            res.append({
                "matched": takeLesson[5] is not None,
                "subject": takeLesson[1],
                "times": json.loads(takeLesson[2]),
                "name": takeLesson[5],
                "email": takeLesson[6] if takeLesson[3] == 1 else "",
                "tel": takeLesson[7] if takeLesson[4] == 1 else "",
                "idNum": takeLesson[0]
            })
        resp = make_response(
            jsonify(
                {'status': 'worked', "takeOffers":     res}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route('/nachhilfeboerse/api/delTakeOffer', methods=['POST'])
def delTakeOffer():
    data = json.loads(request.data)
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        if dbSession.query(TakeLessons).join(Users).filter(TakeLessons.id == data.get("idNum")).filter(Users.username == username).first() is not None:
            dbSession.query(TakeLessons).filter(
                TakeLessons.id == data.get("idNum")).delete()
            dbSession.commit()
            resp = make_response(
                jsonify(
                    {'status': True}))
        else:
            resp = make_response(
                jsonify(
                    {'status': False}))
    else:
        resp = make_response(
            jsonify(
                {'status': False}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp

# User management


@app.route('/nachhilfeboerse/api/getStartPasswords', methods=['GET'])
def getStartPasswords():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    jsonData = {}
    if isAdminLogin(dbSession, username, token):
        startPasswordData = dbSession.query(
            Classes.name, Users.username, Users.startPassword).join(Classes).all()
        for startPasswordUser in startPasswordData:
            if startPasswordUser[0] in jsonData.keys():
                jsonData[startPasswordUser[0]].append(
                    {"username": startPasswordUser[1], "startPassword": startPasswordUser[2]})
            else:
                jsonData[startPasswordUser[0]] = [{
                    "username": startPasswordUser[1], "startPassword": startPasswordUser[2]}]

        resp = make_response(
            jsonify(
                jsonData))
    else:
        resp = make_response(
            jsonify(
                {"status": "Permissionerror"}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/importUsers', methods=['POST'])
def importUsers():
    data = json.loads(request.data)
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isAdminLogin(dbSession, username, token):
        notImported = []
        existingClasses = [v[0] for v in dbSession.query(Classes.name).all()]
        existingUsers = [v[0] for v in dbSession.query(Users.username).all()]
        for k in data.keys():
            if(k not in existingClasses):
                newClass = Classes(name=k.lower())
                dbSession.add(newClass)
                dbSession.commit()
            classId = dbSession.query(Classes.id).filter(
                Classes.name == k).first()[0]
            for user in data[k]:
                if user not in existingUsers:
                    startPassword = secrets.token_urlsafe(16)
                    newUser = Users(
                        username=user.lower(), 
                        startPassword=startPassword, 
                        password=hash_pw(user, startPassword), 
                        firstLogin=True, 
                        class_id=classId
                    )
                    dbSession.add(newUser)
                else:
                    notImported.append(user)
            dbSession.commit()
        resp = make_response(
            jsonify(
                {'status': 'imported', "ignored": notImported}))
    else:
        resp = make_response(
            jsonify(
                {'status': 'Permissionerror'}))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/isAdmin', methods=['GET'])
def isAdmin():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    resp = make_response(
        jsonify(
            {'isAdmin': False}))
    if isAdminLogin(dbSession, username, token):
        resp = make_response(
            jsonify(
                {'isAdmin': True}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/getPersonalData', methods=['GET'])
def getPersonalData():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    resp = make_response(
        jsonify(
            {'error': "Permission missing"}))
    if isLoggedIn(dbSession, username, token):

        personalData: Users = dbSession.query(Users).filter(
            Users.username == username.lower()).first()
        if(personalData is not None):
            resp = make_response(
                jsonify(
                    {'name': personalData.name, "email": personalData.email, "tel": personalData.phonenumber}))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp


@app.route('/nachhilfeboerse/api/changePersonalData', methods=['POST'])
def changePersonalData():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    data = json.loads(request.data)
    resp = make_response(
        jsonify(
            {'error': "Permission missing"}))
    if isLoggedIn(dbSession, username, token):
        if data.get("toChange") == "Email":
            dbSession.query(Users).filter(
                Users.username == username).update({Users.email: data.get("email")})
            resp = make_response(jsonify({'status': True, }))
        elif data.get("toChange") == "Tel":
            dbSession.query(Users).filter(
                Users.username == username).update({Users.phonenumber: data.get("tel")})
            resp = make_response(jsonify({'status': True, }))
        else:
            resp = make_response(jsonify({'error': "toChange needed", }))
        dbSession.commit()

    resp.headers['Access-Control-Allow-Origin'] = '*'
    dbSession.close()
    return resp

# # region match_old
# # TODO: fix
# @ app.route('/nachhilfeboerse/api/match')
# def match():
#     loginstate: LoginStates = getLoginState(request.cookies)
#     if loginstate == LoginStates.ADMIN_LOGIN:
#         graph = generateGraph()
#         dbSession = DB()
#         matchCount = 0
#         matching: dict = dict(
#             sorted(HopcroftKarp(graph).maximum_matching(keys_only=True).items()))
#         dbSession.query(Matches).delete()
#         for key, value in matching.items():
#             match = Matches(giveLessons_id=int(key), takeLessons_id=value)
#             dbSession.add(match)
#             matchCount += 1
#         dbSession.commit()
#         takeLessonsLength = dbSession.query(TakeLessons).count()
#         dbSession.close()
#         return str(matchCount)+"/"+str(takeLessonsLength)+" matched!"
#     else:
#         abort(403)
# # endregion match_old

# region match
# TODO: fix


@ app.route('/nachhilfeboerse/api/match')
def match():
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isAdminLogin(dbSession, username, token):
        graph = generateGraph()
        dbSession = DB()
        matchCount = 0
        matching: dict = dict(
            sorted(HopcroftKarp(graph).maximum_matching(keys_only=True).items()))
        dbSession.query(Matches).delete()
        for key, value in matching.items():
            match = Matches(giveLessons_id=int(key), takeLessons_id=value)
            dbSession.add(match)
            matchCount += 1
        dbSession.commit()
        takeLessonsLength = dbSession.query(TakeLessons).count()
        dbSession.close()
        resp = make_response(
            jsonify(
                {'matchedAmount': matchCount, "totalAmount": takeLessonsLength}))
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    else:
        abort(403)
# endregion match

# @app.route(f"/{app_config.SUB_DIR[:-1]}"+"/einstellungen/email")
# def changeEmail():
#     # region checkLoginState
#     loginstate: LoginStates = getLoginState(request.cookies)
#     if loginstate == LoginStates.LOGGED_OUT:
#         return redirect(url_for("login"))
#     if loginstate == LoginStates.FIRST_LOGIN:
#         return redirect(url_for("additionalData"))
#     # endregion

#     dbSession = DB()
#     operationToken = dbSession.query(Users.operationToken).filter(
#         Users.token == request.cookies.get("SessionToken")).first()
#     if operationToken[0].get("operation") == Operations.CHANGE_EMAIL.value:
#         if request.args.get("operationToken") == operationToken[0].get("token"):
#             if datetime.datetime.strptime(operationToken[0].get("expires"), "%Y-%m-%d %H:%M:%S") > datetime.datetime.now():
#                 dbSession.query(Users).filter(Users.token == request.cookies.get("SessionToken")).update(
#                     {Users.email: encrypt(operationToken[0].get("data"))})
#                 dbSession.commit()
#                 dbSession.close()
#                 return redirect(url_for("settings"))
#     dbSession.close()
#     return "Der Link ist nicht mehr aktuell, bitte fordere einen neuen an!"


@app.route("/nachhilfeboerse/api/einstellungen/email", methods=['POST'])
def changeEmail():
    data = json.loads(request.data)
    username = request.args.get('username')
    token = request.args.get('token')
    dbSession = DB()
    if isLoggedIn(dbSession, username, token):
        dbSession.query(Users).filter(Users.username == username).update(
            {Users.email: data.get("email")})
        dbSession.commit()
        dbSession.close()
        dbSession.close()
    else:
        abort(403)


if __name__ == '__main__':
    app.run()
