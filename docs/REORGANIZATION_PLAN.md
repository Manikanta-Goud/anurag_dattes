# PROJECT REORGANIZATION PLAN

## File Movement Map

### FRONTEND FILES (Move to /frontend/)

#### Components
```
components/ui/ → frontend/components/ui/
hooks/ → frontend/hooks/
```

#### App Routes (Frontend Pages)
```
app/page.js → frontend/app/page.js
app/layout.js → frontend/app/layout.js
app/globals.css → frontend/app/globals.css
app/dice-demo/ → frontend/app/dice-demo/
app/sign-in/ → frontend/app/sign-in/
app/sign-up/ → frontend/app/sign-up/
app/admin/page.js → frontend/app/admin/page.js
```

### BACKEND FILES (Move to /backend/)

#### API Routes
```
app/api/[[...path]]/route.js → backend/api/main-api/route.js
app/api/achievements/route.js → backend/api/achievements/route.js
```

#### Database Scripts
```
*.sql → backend/database/migrations/
setup-database.js → backend/scripts/setup-database.js
```

#### Backend Utilities
```
lib/supabase.js → backend/lib/supabase.js (SECURE VERSION)
lib/utils.js → backend/lib/utils.js
```

#### Utility Scripts
```
check-*.js → backend/scripts/check-scripts/
create-*.js → backend/scripts/setup-scripts/
fix-*.js → backend/scripts/fix-scripts/
test-*.js → backend/scripts/test-scripts/
list-users.js → backend/scripts/list-users.js
make-friends.js → backend/scripts/make-friends.js
```

### CONFIGURATION FILES (Root Level)
```
middleware.js → middleware.js (SECURED VERSION)
next.config.js → next.config.js (SECURED VERSION)
package.json → package.json (Updated)
jsconfig.json → jsconfig.json (Updated paths)
tailwind.config.js → tailwind.config.js
postcss.config.js → postcss.config.js
components.json → components.json
```

### DOCUMENTATION (Root Level)
```
*.md → docs/
```

## New Directory Structure

```
anurag_dattes/
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (protected)/
│   │   │   ├── admin/
│   │   │   └── dice-demo/
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   └── hooks/
│
├── backend/
│   ├── api/
│   │   ├── auth/
│   │   ├── achievements/
│   │   ├── admin/
│   │   └── main-api/
│   ├── lib/
│   │   ├── supabase.js (SECURED)
│   │   ├── auth.js (NEW)
│   │   ├── validation.js (NEW)
│   │   └── utils.js
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001-initial-setup.sql
│   │   │   ├── 002-add-banned-users.sql
│   │   │   └── ...
│   │   └── schemas/
│   └── scripts/
│       ├── setup-scripts/
│       ├── check-scripts/
│       ├── fix-scripts/
│       └── test-scripts/
│
├── config/
│   ├── security.js (NEW)
│   └── constants.js (NEW)
│
├── docs/
│   ├── guides/
│   └── features/
│
├── .env.example (NEW)
├── .env.local (GITIGNORED)
├── middleware.js (SECURED)
├── next.config.js (SECURED)
└── package.json (UPDATED)
```

## Files to Create

### Security Files
- [ ] .env.example - Example environment variables
- [ ] backend/lib/auth.js - Authentication helpers
- [ ] backend/lib/validation.js - Input validation schemas
- [ ] config/security.js - Security configuration
- [ ] config/constants.js - Application constants

### Secured Versions
- [ ] backend/lib/supabase.js - WITHOUT hardcoded credentials
- [ ] middleware.js - WITH proper admin auth
- [ ] next.config.js - WITH security headers

## Migration Steps

1. Create new directory structure ✅
2. Copy files to new locations (keeping originals)
3. Create new secured files
4. Update all import paths
5. Test functionality
6. Remove old files
7. Update documentation
