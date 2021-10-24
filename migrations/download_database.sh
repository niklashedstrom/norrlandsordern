#!/bin/bash

heroku login
heroku pg:backups:download -a norrlandsordern
echo Copying database to docker container
docker cp latest.dump postgres:/var/lib/postgresql/data
echo Populating docker database with latest heroku database backup
docker exec postgres pg_restore -c -U postgres -d norrlandsordern /var/lib/postgresql/data/latest.dump
rm latest.dump
heroku logout