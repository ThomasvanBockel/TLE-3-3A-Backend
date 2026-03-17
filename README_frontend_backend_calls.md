# Frontend → Backend API README

Deze README beschrijft hoe de frontend requests kan maken naar de backend, welke headers nodig zijn, welke velden
verplicht zijn en welke endpoints beschikbaar zijn op basis van de huidige routerbestanden.

## Server

Base URL:

```text
http://145.24.237.215:8000
```

API base URL:

```text
http://145.24.237.215:8000/api/v2
```

Voorbeeld in frontend:

```js
const API_BASE_URL = "http://145.24.237.215:8000/api/v2";
```

---

## Headers en authenticatie

De backend gebruikt op sommige routes een API key en op sommige routes een JWT bearer token.

### 1. JSON requests

Gebruik voor `POST`, `PUT` en `PATCH` meestal:

```http
Content-Type: application/json
Accept: application/json
```

### 2. API key

Routes met `publicApiKey` verwachten:

```http
x-api-key: JOUW_API_KEY
```

### 3. JWT Bearer token

Routes met `auth` verwachten:

```http
Authorization: Bearer JOUW_JWT_TOKEN
```

### 4. Belangrijk

De huidige codebase is niet overal consistent. Sommige routers zijn al beveiligd met `publicApiKey` en `auth`, andere
nog niet. In deze README staat per endpoint hoe de route **nu** volgens de huidige routerbestanden werkt.

---

## Algemene fetch voorbeelden

### GET

```js
const response = await fetch(`${API_BASE_URL}/categories`);
const data = await response.json();
console.log(data);
```

### POST

```js
const response = await fetch(`${API_BASE_URL}/some-route`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### PUT

```js
const response = await fetch(`${API_BASE_URL}/some-route/ID`, {
    method: "PUT",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### DELETE

```js
const response = await fetch(`${API_BASE_URL}/some-route/ID`, {
    method: "DELETE"
});
```

---

# Endpoints

---

## Users

Router mount:

```text
/api/user
```

### GET /api/user

Haalt alle users van de eigen client op.

Huidige beveiliging:

- `auth`
- `adminOnly`

Verplichte headers:

- `Authorization: Bearer ...`

```js
const response = await fetch(`${API_BASE_URL}/user`, {
    headers: {
        Authorization: `Bearer ${token}`
    }
});

const data = await response.json();
console.log(data);
```

### GET /api/user/:id

Haalt één user op. Alleen eigen profiel of admin.

Headers:

- `Authorization: Bearer ...`

```js
const userId = "USER_ID";
const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
    headers: {
        Authorization: `Bearer ${token}`
    }
});

const data = await response.json();
console.log(data);
```

### POST /api/user/register

Registreert een gewone gebruiker.

Huidige beveiliging:

- `publicApiKey`

Verplichte headers:

- `Content-Type: application/json`
- `x-api-key: ...`

Verplichte velden:

- `first_name`
- `last_name`
- `email`
- `password`

Optionele velden:

- `gender`
- `bsn`
- `birth_date`
- `phone_number`
- `personalization_enabled`

Body:

```json
{
  "first_name": "Ali",
  "last_name": "Yilmaz",
  "gender": "male",
  "email": "ali@example.com",
  "password": "Test1234!",
  "birth_date": "2000-05-10",
  "phone_number": "0612345678",
  "personalization_enabled": true,
  "bsn": "123456789"
}
```

Frontend call:

```js
const payload = {
    first_name: "Ali",
    last_name: "Yilmaz",
    gender: "male",
    email: "ali@example.com",
    password: "Test1234!",
    birth_date: "2000-05-10",
    phone_number: "0612345678",
    personalization_enabled: true,
    bsn: "123456789"
};

const response = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### POST /api/user/login

Logt een user in en geeft een JWT token terug.

Huidige beveiliging:

- `publicApiKey`
- `loginLimiter`

Verplichte velden:

- `email`
- `password`

Headers:

- `Accept: application/json`
- `Content-Type: application/json`
- `x-api-key: ...`

Body:

```json
{
  "email": "ali@example.com",
  "password": "Test1234!"
}
```

Frontend call:

```js
const payload = {
    email: "ali@example.com",
    password: "Test1234!"
};

const response = await fetch(`${API_BASE_URL}/user/login`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### POST /api/user/admin

Maakt de **eerste admin** voor een client aan.

Huidige beveiliging:

- `publicApiKey`
- alleen mogelijk als er nog geen admin bestaat binnen die client

Headers:

- `Accept: application/json`
- `Content-Type: application/json`
- `x-api-key: ...`

Verplichte velden:

- `first_name`
- `last_name`
- `email`
- `password`

Body:

```json
{
  "first_name": "Admin",
  "last_name": "TeamA",
  "gender": "male",
  "bsn": "123456789",
  "email": "admin@teama.nl",
  "password": "Test1234!",
  "birth_date": "1998-01-01",
  "phone_number": "0612345678",
  "personalization_enabled": true
}
```

Frontend call:

```js
const payload = {
    first_name: "Admin",
    last_name: "TeamA",
    gender: "male",
    bsn: "123456789",
    email: "admin@teama.nl",
    password: "Test1234!",
    birth_date: "1998-01-01",
    phone_number: "0612345678",
    personalization_enabled: true
};

const response = await fetch(`${API_BASE_URL}/user/admin`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### PUT /api/user/edit/:id

Bewerkt eigen profiel.

Headers:

- `Authorization: Bearer ...`

Mogelijke velden:

- `first_name`
- `last_name`
- `gender`
- `bsn`
- `email`
- `birth_date`
- `phone_number`
- `personalization_enabled`

```js
const payload = {
    phone_number: "0611111111",
    personalization_enabled: false
};

await fetch(`${API_BASE_URL}/user/edit/${userId}`, {
    method: "PUT",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
});
```

### PUT /api/user/admin/edit/:id

Admin bewerkt user binnen eigen client.

Headers:

- `Authorization: Bearer ...`

Mogelijke velden:

- `first_name`
- `last_name`
- `gender`
- `bsn`
- `email`
- `birth_date`
- `phone_number`
- `is_admin`
- `personalization_enabled`

### DELETE /api/user/delete/:id

Verwijdert eigen account of als admin een andere user binnen eigen client.

Headers:

- `Authorization: Bearer ...`

---

## Categories

Router mount:

```text
/api/categories
```

### GET /api/categories

Haal alle categorieën op.

Let op: deze router is in de huidige codebase nog niet volledig uitgelijnd met de nieuwere beveiligingsaanpak. Gebruik
de implementatie die in jouw runtime actief staat.

Minimale frontend call:

```js
const response = await fetch(`${API_BASE_URL}/categories`);
const categories = await response.json();
console.log(categories);
```

### POST /api/categories

Maak een categorie aan.

Veelgebruikte body:

```json
{
  "name": "Aanvragen"
}
```

### POST /api/categories/seed

Seed categorieën.

Headers in de nieuwere variant:

- `AdminOnly`
- `x-api-key`
- `Authorization: Bearer ...`

Geen body nodig.

---

## Content items

Router mount:

```text
/api/content-items
```

### GET /api/content-items

Haalt alle content items op.

Ondersteunde query parameters:

- `page`
- `limit`

Voorbeeld:

```js
const page = 1;
const limit = 10;
const response = await fetch(`${API_BASE_URL}/content-items?page=${page}&limit=${limit}`);
const data = await response.json();
console.log(data);
```

### GET /api/content-items/:id

Haalt één content item op.

```js
const contentItemId = "CONTENT_ITEM_ID";
const response = await fetch(`${API_BASE_URL}/content-items/${contentItemId}`);
const data = await response.json();
console.log(data);
```

### POST /api/content-items

Maakt een content item aan.

Op basis van het huidige routerbestand worden deze velden gebruikt:

- `title`
- `body`
- `content_type` (let op: in sommige nieuwere modelversies is dit vervangen door `category_ids`)
- `is_urgent`
- `is_mandatory`
- `starts_at`
- `ends_at`
- `status`
- `created_by`
- `image`

Voorbeeld volgens huidige router:

```json
{
  "title": "Ondersteuning aanvragen via de Wmo",
  "body": "De Wet maatschappelijke ondersteuning (Wmo) is bedoeld voor inwoners die hulp nodig hebben om zelfstandig te kunnen blijven wonen.",
  "content_type": "wmo",
  "is_urgent": false,
  "is_mandatory": false,
  "starts_at": "2026-03-11T08:00:00.000Z",
  "ends_at": "2026-12-31T23:59:00.000Z",
  "status": "published",
  "created_by": "USER_ID",
  "image": null
}
```

Frontend call:

```js
const payload = {
    title: "Ondersteuning aanvragen via de Wmo",
    body: "De Wet maatschappelijke ondersteuning (Wmo) is bedoeld voor inwoners die hulp nodig hebben om zelfstandig te kunnen blijven wonen.",
    content_type: "wmo",
    is_urgent: false,
    is_mandatory: false,
    starts_at: "2026-03-11T08:00:00.000Z",
    ends_at: "2026-12-31T23:59:00.000Z",
    status: "published",
    created_by: "USER_ID",
    image: null
};

const response = await fetch(`${API_BASE_URL}/content-items`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### PUT /api/content-items/:id

Update een content item.

Body gebruikt dezelfde velden als bij POST.

### DELETE /api/content-items/:id

Verwijdert een content item.

---

## Inquiry types

Router mount:

```text
/api/inquiry-types
```

### GET /api/inquiry-types

Haalt alle inquiry types op.

Headers in nieuwere beveiligde variant:

- vaak `x-api-key`

Minimaal voorbeeld:

```js
const response = await fetch(`${API_BASE_URL}/inquiry-types`);
const inquiryTypes = await response.json();
console.log(inquiryTypes);
```

### POST /api/inquiry-types

Maakt een inquiry type aan.

Velden:

- `name` (verplicht)
- `description` (optioneel)

Body:

```json
{
  "name": "Vervoer",
  "description": "Vragen over vervoer en vervoersvoorzieningen"
}
```

### GET /api/inquiry-types/:id

Haalt één inquiry type op.

### PUT /api/inquiry-types/:id

Update een inquiry type.

### DELETE /api/inquiry-types/:id

Verwijdert een inquiry type.

---

## Inquiries

Router mount:

```text
/api/inquiry
```

### GET /api/inquiry

Haalt inquiries op.

Ondersteunde query parameters in huidige code:

- `status`
- `type`
- `token`

Voorbeeld:

```js
const response = await fetch(`${API_BASE_URL}/inquiry?status=OPEN`);
const inquiries = await response.json();
console.log(inquiries);
```

### GET /api/inquiry/:id

Haalt één inquiry op via id.

### GET /api/inquiry/token/:token

Haalt één inquiry op via token.

### POST /api/inquiry

Maakt een inquiry aan.

Volgens de huidige router zijn deze velden verplicht:

- `user_id`
- `type_id`
- `created_at`
- `content`
- `status`
- `question`

Body:

```json
{
  "user_id": "69b157e7c5851af11eca54de",
  "type_id": "69b13bb457baa6b789f6d784",
  "created_at": "2026-03-11T10:00:00.000Z",
  "content": {
    "onderwerp": "Vervoer",
    "beschrijving": "Ik wil graag weten of ik ondersteuning kan krijgen voor vervoer."
  },
  "status": "OPEN",
  "question": "Kan ik ondersteuning aanvragen voor vervoer via de gemeente?"
}
```

Frontend call:

```js
const payload = {
    user_id: "69b157e7c5851af11eca54de",
    type_id: "69b13bb457baa6b789f6d784",
    created_at: new Date().toISOString(),
    content: {
        onderwerp: "Vervoer",
        beschrijving: "Ik wil graag weten of ik ondersteuning kan krijgen voor vervoer."
    },
    status: "OPEN",
    question: "Kan ik ondersteuning aanvragen voor vervoer via de gemeente?"
};

const response = await fetch(`${API_BASE_URL}/inquiry`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### PUT /api/inquiry/:id

Update een inquiry.

Toegestane velden in huidige code:

- `type_id`
- `created_at`
- `content`
- `token`
- `status`
- `question`
- `user_id`

### PATCH /api/inquiry/:id/status

Update alleen de status.

Body:

```json
{
  "status": "IN_PROGRESS"
}
```

### DELETE /api/inquiry/:id

Verwijdert een inquiry.

---

## Document types

Router mount:

```text
/api/document-types
```

### GET /api/document-types

Haalt alle document types op.

In de nieuwere routerversie:

- vaak `publicApiKey`

Minimaal voorbeeld:

```js
const response = await fetch(`${API_BASE_URL}/document-types`);
const documentTypes = await response.json();
console.log(documentTypes);
```

### POST /api/document-types

Maakt een document type aan.

Velden:

- `name`
- `description`

### POST /api/document-types/seed

Seed vooraf ingestelde document types.

Nieuwere variant verwacht:

- `x-api-key`
- `Authorization: Bearer ...`

Geen body nodig.

### GET /api/document-types/:id

Haalt één document type op.

### PUT /api/document-types/:id

Update een document type.

### DELETE /api/document-types/:id

Verwijdert een document type.

---

## Documents

Router mount:

```text
/api/documents
```

### GET /api/documents

Haalt documenten op.

In de huidige router:

- `publicLimiter`
- `publicApiKey`
- `auth`

Headers:

- `x-api-key`
- `Authorization: Bearer ...`

Frontend call:

```js
const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: {
        "x-api-key": apiKey,
        Authorization: `Bearer ${token}`
    }
});

const data = await response.json();
console.log(data);
```

### POST /api/documents

Maakt een document aan.

Velden:

- `type_id` (verplicht)
- `start_date` (verplicht)
- `end_date` (verplicht)
- `extended` (verplicht)

`user_id` wordt in de huidige nieuwere router server-side uit `req.auth.sub` gehaald.

Body:

```json
{
  "type_id": "69b13d3557baa6b789f6d7a8",
  "start_date": "2026-03-11T00:00:00.000Z",
  "end_date": "2031-03-11T00:00:00.000Z",
  "extended": false
}
```

Frontend call:

```js
const payload = {
    type_id: "69b13d3557baa6b789f6d7a8",
    start_date: "2026-03-11T00:00:00.000Z",
    end_date: "2031-03-11T00:00:00.000Z",
    extended: false
};

const response = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### GET /api/documents/:id

Haalt één document op.

### PUT /api/documents/:id

Update een document.

Velden:

- `type_id`
- `start_date`
- `end_date`
- `extended`

### DELETE /api/documents/:id

Verwijdert een document.

Headers:

- `Accept: application/json`
- `x-api-key: apikey`
- `Authorization: Bearer ${token}`

---

## POST /api/reports

```js
const payload = {
    title: "Melding over verkeerde content",
    description: {
        reden: "Irrelevante content",
        toelichting: "Ik kreeg informatie te zien die niet past bij mijn situatie."
    },
    content_id: "HIER_EEN_CONTENT_ID"
};

const response = await fetch(`${API_BASE_URL}/reports`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "x-api-key": apiKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
});

const data = await response.json();
console.log(data);
```

### GET /api/reports/:id

Haalt één report op.

### PUT /api/reports/:id

Update een report.

Velden:

- `title`
- `description`

### DELETE /api/reports/:id

Verwijdert een report.

Verplicht:

- `is_admin` (alleen admin mag verwijderen)

Headers:

- `Accept: application/json`
- `Content-Type: application/json`
- `x-api-key`
- `Authorization: Bearer ...`

---

## Praktische helper voor frontend

Voorbeeld met API key + bearer token:

```js
const docs = await apiRequest("/documents", "GET", null, {
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: `Bearer ${token}`
    }
});
```

---

## Bekende aandachtspunten

1. De codebase bevat zowel oudere als nieuwere routerversies. Sommige routes zijn al beveiligd met `publicApiKey` en
   `auth`, andere nog niet.
2. JWT tokens verlopen. Bij een fout als `jwt expired` moet eerst opnieuw worden ingelogd.
3. Controleer altijd de exacte bodyvelden per router, omdat modellen en routers niet overal volledig gelijk lopen.

---

## Aanbevolen workflow voor de frontend

1. Maak eventueel de eerste admin met `POST /api/user/admin` en de API key.
2. Log in via `POST /api/user/login` om een JWT token te krijgen.
3. Gebruik daarna waar nodig:
    - alleen `x-api-key`
    - of `x-api-key + Authorization: Bearer ...`
    - of alleen `Authorization: Bearer ...`
      afhankelijk van de route.
