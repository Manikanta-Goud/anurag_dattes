# Events Management System - Complete Guide

## Overview
A comprehensive Events Management system has been implemented that allows admins to create, update, and delete college events with full details. Students can view upcoming events in the Events section.

## Features Implemented

### 1. **Database Schema** (`create-events-table.sql`)
- Complete events table with all required fields:
  - Basic info: `title`, `description`, `category`
  - Date/Time: `event_date`, `event_time`
  - Location: `venue`
  - People: `organizer`, `guests`
  - Registration: `registration_required`, `registration_link`, `max_capacity`
  - Contact: `contact_email`, `contact_phone`
  - Media: `image_url`
  - Status: `upcoming`, `ongoing`, `completed`
- RLS policies for public viewing and admin-only management
- Indexes for efficient querying

### 2. **API Routes** (`app/api/[[...path]]/route.js`)

#### GET `/api/events?status=all|upcoming`
- Fetches events filtered by status
- `status=all` - Returns all events (for admin)
- `status=upcoming` - Returns only upcoming events (for users)
- Orders by date ascending

#### POST `/api/events/create`
```json
{
  "title": "Event Title",
  "description": "Event description",
  "event_date": "2024-01-15",
  "event_time": "10:00",
  "venue": "Main Auditorium",
  "category": "Technical",
  "organizer": "CSE Department",
  "guests": "Dr. John Doe",
  "image_url": "https://...",
  "max_capacity": 200,
  "registration_required": true,
  "registration_link": "https://forms...",
  "contact_email": "events@college.edu",
  "contact_phone": "+91 1234567890"
}
```

#### POST `/api/events/update`
```json
{
  "eventId": "uuid",
  // ... same fields as create
}
```

#### DELETE `/api/events/delete?eventId=uuid`
- Deletes event by ID
- Admin only

### 3. **Admin Panel** (`app/admin/page.js`)

#### New "Events" Tab
- Located in admin dashboard alongside Users, Conversations, and Banned Users tabs
- Grid layout changed from `grid-cols-4` to `grid-cols-5` to accommodate Events tab

#### Events Management Interface
- **Create Event Button**: Opens modal for creating new events
- **Event Cards Display**: Shows all events with:
  - Event image
  - Title and description
  - Status badge (upcoming/ongoing/completed)
  - Date, time, and venue
  - Organizer and guests info
  - Category and capacity
  - Registration status
  - Contact information
- **Edit Button**: Opens modal with pre-filled form to update event
- **Delete Button**: Removes event after confirmation

#### Event Creation/Edit Modal
Full form with all fields:
- **Required Fields** (marked with *):
  - Title
  - Description
  - Event Date
  - Event Time
  - Venue
- **Optional Fields**:
  - Category dropdown (Technical, Cultural, Sports, Workshop, Seminar, Competition, Other)
  - Max Capacity
  - Organizer
  - Chief Guests
  - Event Image URL
  - Registration Required checkbox
  - Registration Link (shown only if registration required)
  - Contact Email
  - Contact Phone

### 4. **Auto-Loading**
- Events are automatically loaded when admin logs in
- Auto-refreshes every 10 seconds along with other admin data

## Usage Instructions

### Setting Up the Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `create-events-table.sql`
4. Execute the SQL to create the events table

### Creating an Event (Admin)

1. Log in to admin panel at `http://localhost:3000/admin`
2. Click on the **Events** tab
3. Click **Create Event** button
4. Fill in all required fields:
   - Event title
   - Description
   - Date and time
   - Venue
5. Optionally add:
   - Category, capacity, organizer
   - Chief guests
   - Event poster image URL
   - Registration details
   - Contact information
6. Click **Create Event**

### Editing an Event

1. In the Events tab, find the event card
2. Click the **Edit** button (blue pencil icon)
3. Update the fields in the modal
4. Click **Update Event**

### Deleting an Event

1. In the Events tab, find the event card
2. Click the **Delete** button (red ban icon)
3. Confirm the deletion
4. Event will be removed from the list

## Event Categories

- **Technical**: Tech fests, hackathons, coding competitions
- **Cultural**: Cultural programs, festivals, celebrations
- **Sports**: Sports events, tournaments
- **Workshop**: Skill development workshops, training sessions
- **Seminar**: Educational seminars, talks, lectures
- **Competition**: Academic and non-academic competitions
- **Other**: Any other type of event

## Event Status

Events are automatically categorized by status:
- **Upcoming**: Events scheduled for future dates
- **Ongoing**: Events happening today
- **Completed**: Events that have passed

## Student View (Coming Next)

The Events section in the main app (`app/page.js`) currently shows "Coming Soon". Next steps:
1. Fetch events from `/api/events?status=upcoming`
2. Display events in attractive cards
3. Show event details
4. Add registration buttons if required
5. Add calendar view option

## Technical Details

### State Management
```javascript
const [events, setEvents] = useState([])
const [showEventModal, setShowEventModal] = useState(false)
const [editingEvent, setEditingEvent] = useState(null)
const [eventForm, setEventForm] = useState({ /* all fields */ })
const [savingEvent, setSavingEvent] = useState(false)
```

### Icons Used
- `Calendar` - Events tab and date display
- `Plus` - Create event button
- `Edit` - Edit event button
- `MapPin` - Venue display
- `UserCircle` - Organizer display
- `Ban` - Delete event button

### Styling
- Purple theme for events (matching the Events main nav button)
- Purple badges for status
- Purple borders for event cards
- Responsive grid layout
- Modal overlay for create/edit forms

## Next Steps

1. **Run the SQL**: Execute `create-events-table.sql` in Supabase
2. **Test Admin Functions**: Create, edit, delete events in admin panel
3. **Implement User View**: Replace "Coming Soon" in Events section with real event display
4. **Add Features**:
   - Event registration tracking
   - Student attendance marking
   - Event reminders/notifications
   - Event search and filters
   - Past events archive
   - Event analytics

## Testing Checklist

- [ ] SQL table created successfully
- [ ] Admin can create events
- [ ] Admin can edit events
- [ ] Admin can delete events
- [ ] Events display in admin panel
- [ ] Form validation works
- [ ] Modal opens and closes properly
- [ ] Auto-refresh loads events
- [ ] No console errors

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure events table exists
4. Check API routes are working (`/api/events`)
5. Verify admin authentication

---

**Status**: ✅ Admin Events Management Complete
**Next**: 🚧 User-facing Events Display
