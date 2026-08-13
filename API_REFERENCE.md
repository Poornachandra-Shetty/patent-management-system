# Patent Management System — API Reference

**Base URL:** `http://localhost:8000/api/v1`  
**Auth:** JWT Bearer Token — include in every request header (except login/register)

```
Authorization: Bearer <access_token>
```

**Demo credentials (after running `python manage.py seed_data`):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@college.edu | password123 |
| Scrutinizer | scrutinizer@college.edu | password123 |
| Consultant | consultant@college.edu | password123 |
| Applicant (Student) | student@college.edu | password123 |
| Applicant (Faculty) | faculty@college.edu | password123 |

---

## 1. Authentication

### POST `/auth/login/`
Get a JWT access + refresh token pair.

**Auth required:** No

**Request body:**
```json
{
  "email": "student@college.edu",
  "password": "password123"
}
```

**Response `200 OK`:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

---

### POST `/auth/refresh/`
Get a new access token using a refresh token.

**Auth required:** No

**Request body:**
```json
{
  "refresh": "<jwt_refresh_token>"
}
```

**Response `200 OK`:**
```json
{
  "access": "<new_jwt_access_token>"
}
```

---

### POST `/auth/register/`
Register a new user account.

**Auth required:** No

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@college.edu",
  "password": "securepass123",
  "usn_or_emp_id": "USN2026099",
  "mobile": "9876543299",
  "role": "applicant",
  "department": 1
}
```

> **`role` choices:** `applicant` | `scrutinizer` | `consultant` | `admin`  
> **`department`:** integer ID from `/departments/`

**Response `201 Created`:**
```json
{
  "id": 6,
  "name": "John Doe",
  "email": "john@college.edu",
  "usn_or_emp_id": "USN2026099",
  "mobile": "9876543299",
  "role": "applicant",
  "department": 1
}
```

---

### GET `/auth/me/`
Get the currently logged-in user's profile.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": 4,
  "name": "Ananya Student",
  "email": "student@college.edu",
  "usn_or_emp_id": "USN2026001",
  "mobile": "9876543213",
  "role": "applicant",
  "department": 1,
  "department_detail": {
    "id": 1,
    "name": "Computer Science & Engineering",
    "code": "CSE",
    "created_at": "2026-08-13T10:00:00Z"
  },
  "created_at": "2026-08-13T10:00:00Z"
}
```

---

### PUT/PATCH `/auth/me/`
Update the currently logged-in user's profile.

**Auth required:** Yes

**Request body (partial PATCH example):**
```json
{
  "mobile": "9999999999"
}
```

**Response `200 OK`:** Same shape as GET `/auth/me/`

---

## 2. Departments

### GET `/departments/`
List all departments. Public — no auth needed.

**Auth required:** No

**Response `200 OK`:**
```json
[
  { "id": 1, "name": "Computer Science & Engineering", "code": "CSE", "created_at": "..." },
  { "id": 2, "name": "Electronics & Communication Engineering", "code": "ECE", "created_at": "..." },
  { "id": 3, "name": "Mechanical Engineering", "code": "MECH", "created_at": "..." },
  { "id": 4, "name": "Civil Engineering", "code": "CIVIL", "created_at": "..." },
  { "id": 5, "name": "Biotechnology", "code": "BIOTECH", "created_at": "..." }
]
```

---

### GET `/departments/{id}/`
Get a single department by ID.

**Auth required:** No

**Response `200 OK`:**
```json
{ "id": 1, "name": "Computer Science & Engineering", "code": "CSE", "created_at": "..." }
```

---

## 3. Patents

> **Role-based visibility:**
> - `applicant` → sees only their own applications
> - `consultant` → sees only applications assigned to them
> - `scrutinizer` / `admin` → sees all applications

### GET `/patents/`
List patent applications (role-scoped).

**Auth required:** Yes

**Query params (all optional):**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status. See status values below. |
| `department` | integer | Filter by department ID |
| `category` | string | Filter by category |
| `search` | string | Full-text search on `patent_id`, `title`, `keywords`, `abstract` |
| `ordering` | string | Sort by `created_at`, `-created_at`, `updated_at`, `patent_id` |

**Patent status values:**
`draft` | `submitted` | `under_scrutiny` | `forwarded_to_consultant` | `approved` | `rejected`

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "patent_id": "PAT-CSE-2026-0001",
    "applicant": 4,
    "applicant_detail": {
      "id": 4,
      "name": "Ananya Student",
      "email": "student@college.edu",
      "role": "applicant"
    },
    "title": "AI-Driven Autonomous Crop Health Monitoring Drone System",
    "department": 1,
    "department_detail": { "id": 1, "name": "Computer Science & Engineering", "code": "CSE" },
    "category": "Artificial Intelligence & Robotics",
    "status": "submitted",
    "created_at": "2026-08-13T10:00:00Z",
    "updated_at": "2026-08-13T10:00:00Z"
  }
]
```

---

### POST `/patents/`
Create a new patent application. Status defaults to `draft`.

**Auth required:** Yes

**Request body:**
```json
{
  "title": "My Patent Title",
  "department": 1,
  "category": "Artificial Intelligence & Robotics",
  "abstract": "Brief summary of the invention.",
  "keywords": "AI, drones, agriculture",
  "problem_statement": "The problem this solves...",
  "novelty_description": "What makes it novel...",
  "proposed_application": "How it will be applied...",
  "inventors": [
    {
      "name": "Ananya Student",
      "usn_or_emp_id": "USN2026001",
      "department": 1,
      "is_primary_inventor": true
    }
  ]
}
```

> `patent_id` is **auto-generated** — do NOT send it.  
> `inventors` is optional.

**Response `201 Created`:**
```json
{
  "id": 3,
  "patent_id": "PAT-CSE-2026-0003",
  "title": "My Patent Title",
  "department": 1,
  "category": "Artificial Intelligence & Robotics",
  "abstract": "...",
  "keywords": "...",
  "problem_statement": "...",
  "novelty_description": "...",
  "proposed_application": "...",
  "inventors": [...]
}
```

---

### GET `/patents/{id}/`
Get full detail of a single patent application.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": 1,
  "patent_id": "PAT-CSE-2026-0001",
  "applicant": 4,
  "applicant_detail": { "..." },
  "assigned_to": null,
  "assigned_to_detail": null,
  "title": "AI-Driven Autonomous Crop Health Monitoring Drone System",
  "department": 1,
  "department_detail": { "..." },
  "category": "Artificial Intelligence & Robotics",
  "abstract": "...",
  "keywords": "...",
  "problem_statement": "...",
  "novelty_description": "...",
  "proposed_application": "...",
  "status": "submitted",
  "inventors": [
    {
      "id": 1,
      "name": "Ananya Student",
      "usn_or_emp_id": "USN2026001",
      "department": 1,
      "department_detail": { "..." },
      "is_primary_inventor": true
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

---

### PUT/PATCH `/patents/{id}/`
Update a patent application.

**Auth required:** Yes  
**Request body:** Any subset of the POST fields.

---

### DELETE `/patents/{id}/`
Delete a patent application.

**Auth required:** Yes

---

### POST `/patents/{id}/submit/`
Transition a `draft` application to `submitted`. No request body needed.

**Auth required:** Yes  
**Constraint:** Patent must currently be in `draft` status.

**Response `200 OK`:**
```json
{
  "id": 1,
  "patent_id": "PAT-CSE-2026-0001",
  "status": "submitted",
  "..."
}
```

**Response `400 Bad Request` (if not draft):**
```json
{
  "detail": "Only draft applications can be submitted."
}
```

---

## 4. Documents

### GET `/documents/`
List all documents uploaded by the logged-in user.

**Auth required:** Yes

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "application": 1,
    "uploaded_by": 4,
    "uploaded_by_name": "Ananya Student",
    "doc_type": "form",
    "file": "http://localhost:8000/media/documents/form.pdf",
    "file_size": 204800,
    "mime_type": "application/pdf",
    "uploaded_at": "2026-08-13T10:00:00Z"
  }
]
```

---

### POST `/documents/`
Upload a document. Use `multipart/form-data`.

**Auth required:** Yes  
**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `application` | integer | Yes | Patent application ID |
| `doc_type` | string | Yes | e.g. `form`, `report`, `drawing` |
| `file` | file | Yes | The file to upload |

**Response `201 Created`:** Same shape as list item above.

---

### GET `/documents/{id}/`
Get a single document.

**Auth required:** Yes

---

### DELETE `/documents/{id}/`
Delete a document.

**Auth required:** Yes

---

### GET `/documents/public/`
List public documents (guidelines, templates). No auth needed.

**Auth required:** No

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Patent Filing Guidelines",
    "file": "http://localhost:8000/media/public/guidelines.pdf",
    "category": "guidelines",
    "uploaded_at": "...",
    "updated_at": "..."
  }
]
```

---

## 5. Reviews / Remarks

> **Visibility rules:**
> - `applicant` → sees only remarks where `visible_to_applicant: true` on their own patents
> - `scrutinizer` / `admin` / `consultant` → sees all remarks

### GET `/reviews/`
List remarks (role-scoped).

**Auth required:** Yes

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "application": 1,
    "user": 2,
    "user_detail": {
      "id": 2,
      "name": "Dr. Scrutinizer Specialist",
      "role": "scrutinizer"
    },
    "text": "Please clarify the novelty claim in section 3.",
    "action": "clarification_requested",
    "visible_to_applicant": true,
    "created_at": "2026-08-13T10:00:00Z"
  }
]
```

---

### POST `/reviews/`
Add a remark on a patent application.

**Auth required:** Yes

**Request body:**
```json
{
  "application": 1,
  "text": "The abstract needs to be more concise.",
  "action": "clarification_requested",
  "visible_to_applicant": true
}
```

> **`action` choices:** `clarification_requested` | `approved` | `rejected` | `forwarded` | `noted`  
> `visible_to_applicant` defaults to `false`.

**Response `201 Created`:** Same shape as list item above.

---

### GET `/reviews/{id}/`
Get a single remark.

**Auth required:** Yes

---

### PUT/PATCH `/reviews/{id}/`
Edit a remark.

**Auth required:** Yes

---

### DELETE `/reviews/{id}/`
Delete a remark.

**Auth required:** Yes

---

## Common Error Responses

| Status | Meaning |
|---|---|
| `400 Bad Request` | Validation error — check the response body for field-level errors |
| `401 Unauthorized` | Missing or expired JWT token |
| `403 Forbidden` | Authenticated but not allowed to perform this action |
| `404 Not Found` | Resource does not exist or is not visible to your role |

**Validation error example:**
```json
{
  "title": ["This field is required."],
  "department": ["Invalid pk \"99\" - object does not exist."]
}
```

---

## Not Yet Implemented

These URL prefixes exist but return `404` — they'll be built in a future sprint:

| Prefix | Planned feature |
|---|---|
| `/api/v1/workflow/` | Patent status transition history |
| `/api/v1/audit/` | Full audit log of who did what |
| `/api/v1/notifications/` | In-app notifications per user |
