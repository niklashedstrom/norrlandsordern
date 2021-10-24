# Norrlandsordern
Källkoden till www.norrlandsordern.se!

## Utvecka
### (Första gången) Sätt upp en databas med Docker:
```
docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres
docker exec -it postgres bash
psql -U postgres
CREATE DATABASE norrlandsordern;
\q
exit
```
### Ha node och npm installerat och kör:
```bash
npm install
npm run dev
```

### Ladda ner databasen från Heroku och lägga till den i Docke
Fråga Niklas Hedström om att få access till Heroku

Se till att Docker containern är igång
```
 sh migrations/download_database.sh
```
## Bidra
För att bidra måste du göra en pull request!