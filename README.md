# Norrlandsordern
Källkoden till www.norrlandsordern.se!

## Utvecka
### (Första gången) Sätt upp en databas med Docker:
```
docker run --name mongodb -d -p 27017:27017 mongo
```
Skapa filen `.env` i root med:
```
MONGODB_URI=mongodb://localhost:27017
```
### Ha node och npm installerat och kör:
```bash
npm install
npm run dev
```

## Bidra
För att bidra måste du göra en pull request!