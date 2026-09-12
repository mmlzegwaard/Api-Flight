# API Flight

Simpele website + API die:
1. een SQLite database/tabel initialiseert,
2. records opslaat via `columnName` + `value` (string),
3. records uitleest met standaard API calls.

## Installeren

```bash
npm install
npm start
```

Open daarna: `http://localhost:3000`

## API endpoints

### `POST /api/init`
Maakt de tabel `records` aan (als die nog niet bestaat).

### `POST /api/record`
Body:
```json
{
  "columnName": "naam",
  "value": "Jan"
}
```

- `columnName`: alleen letters/cijfers/underscore (veiligheidscheck)
- `value`: string

### `GET /api/records`
Geeft alle records terug.