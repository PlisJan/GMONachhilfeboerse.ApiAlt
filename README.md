# GMONachhilfeboerse.Api

## Env File:

```yml
DB_HOST=myserver.tld
DB_PORT=3306
DB_USERNAME=mydbuser
DB_PASSWORD=mydbuserpassword
DB_SCHEMA=myschema
```

## Use this image:

```bash
docker run --name nachhilfeboerse_api -p 5000:5000 --env-file=/path/to/your/.env ghcr.io/plisjan/gmonachhilfeboerse.api:main
```
