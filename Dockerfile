FROM python:3-alpine

WORKDIR /app

COPY . /app


RUN apk update \
    && apk add gcc python3-dev musl-dev mariadb-dev mariadb-connector-c \
    && adduser -D nachhilfeboerse \
    && chown -R nachhilfeboerse:nachhilfeboerse /app \
    && echo export PATH='$PATH:/home/nachhilfeboerse/.local/bin' >> /etc/profile \
    && su - nachhilfeboerse -c 'pip install -r /app/requirements.txt' \ 
    && apk del musl-dev gcc mariadb-dev

ENV PATH="/home/nachhilfeboerse/.local/bin:${PATH}"

USER nachhilfeboerse

EXPOSE 5000

CMD ["gunicorn","--workers","3","--bind","0.0.0.0:5000","-m","007","main:app"]