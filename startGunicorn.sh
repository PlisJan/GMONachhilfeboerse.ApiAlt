#/bin/bash

nohup gunicorn --bind 0.0.0.0:8000 --daemon  main:app &
