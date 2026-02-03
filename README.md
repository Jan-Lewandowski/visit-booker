# VisitBooker

Aplikacja full‑stack do rezerwacji wizyt z aktualizacjami w czasie rzeczywistym, panelem admina i powiadomieniami e‑mail.

## Technologie
- Backend: Node.js, Express, SQLite, WebSocket
- Frontend: Next.js (React)
- Komunikacja: MQTT (powiadomienia)
- E‑mail: Nodemailer (Gmail)

## Wymagania
- Node.js 18+
- Broker MQTT (np. Mosquitto) uruchomiony na `mqtt://localhost:1883`
- Hasło aplikacji Gmail do wysyłki e‑maili

## Uruchomienie

### 1) Backend
```bash
cd backend
npm install
```

Utwórz plik `.env` w katalogu backend:
```
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```
Start backendu:
```bash
npm start
```

Backend działa pod: http://localhost:4000

### 2) Serwis powiadomień MQTT
W osobnym terminalu:
```bash
cd backend/src/mqtt/notificationService
node index.js
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend działa pod: http://localhost:3000

## Dane i seed
Plik bazy SQLite jest domyślnie w `backend/data/visit_booker.sqlite`. Najpierw należy dodać foler data do folderu backend.Jeśli plik nie istnieje, schemat i dane startowe są tworzone automatycznie.

## Funkcje
- Rejestracja/logowanie z sesjami
- Przegląd usług i rezerwacja wizyt
- Aktualizacje w czasie rzeczywistym (WebSocket)
- Panel admina dla kategorii, usług i wizyt
- Prośby o zmianę terminu z akceptacją admina
- Powiadomienia e‑mail przez MQTT + Nodemailer

## Uwagi
- Upewnij się, że broker MQTT działa przed uruchomieniem serwisu powiadomień.
- Jeśli e‑maile nie dochodzą, sprawdź hasło aplikacji Gmail i folder spam.
