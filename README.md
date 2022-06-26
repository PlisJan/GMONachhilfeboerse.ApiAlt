# GMONachhilfeboerse.Api


## Use this image:

### Docker run

#### Env File:

```yml
DB_HOST=myserver.tld
DB_PORT=3306
DB_USERNAME=mydbuser
DB_PASSWORD=mydbuserpassword
DB_SCHEMA=myschema
```

```bash
docker run --name nachhilfeboerse_api -p 5000:5000 --env-file=/path/to/your/.env ghcr.io/plisjan/gmonachhilfeboerse.api:main
```

### Docker-Compose
```yaml
nhb_api:
    image: ghcr.io/plisjan/gmonachhilfeboerse.api:main
    environment:
        DB_HOST: nhb_database
        DB_PORT: 3306
        DB_USERNAME: <YOUR_DB_USERNAME>
        DB_PASSWORD: <YOUR_DB_PASSWORD>
        DB_SCHEMA: nachhilfeboerse  
```
asdasd
