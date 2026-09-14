# BarberShop — Complete Project Context & Scope

**Version:** 1.0  
**Date:** 2026-09-14  
**Project Type:** Salon / Barbershop Management & Appointment Booking Platform  
**Frontend target:** Responsive Web + PWA  
**Language/UI:** Persian-first, architecture should remain extensible for multilingual support

---

# 1. Product Vision

BarberShop is not just an appointment form. It is a complete salon-management platform with:

- Public landing website
- Customer registration/login
- Service and barber discovery
- Appointment booking
- Fixed one-hour time slots
- Barber availability management
- Customer management
- Service pricing
- Start/End Service tracking
- Customer ratings/reviews
- Salon Manager panel
- Barber panel
- Admin panel
- Granular role/permission management
- PWA support
- Push notifications
- Future WhatsApp/SMS notification channels
- Reporting and salon settings

The architecture must support multiple salon business models.

The key business idea is that some barbers are fully controlled by the salon, while some professional barbers can manage their own services, prices and schedules.

---

# 2. Core User Roles

There are exactly four primary system roles:

1. Admin
2. Salon Manager
3. Barber
4. Customer

## Important registration rule

Every person who registers through the public website is automatically:

`Customer`

A customer cannot assign a higher role to themselves.

Only Admin can:
- Change user roles
- Create/assign Salon Manager access
- Assign Barber role
- Define whether a barber is Professional or Regular
- Define barber permissions
- Define manager permissions

---

# 3. Authorization Architecture

The system uses:

## RBAC + granular permissions

Role defines the general identity:

- Admin
- Salon Manager
- Barber
- Customer

Permissions define what the user is actually allowed to do.

Permission checks must exist at:
- Frontend/UI level
- Route level
- Server/API level
- Database/security-policy level where applicable

Hiding a menu item is not considered security.

---

# 4. Admin

Admin has full access to the entire platform.

Admin can manage:

- Dashboard
- Users
- Customers
- Barbers
- Salon Managers
- Roles
- Permissions
- Services
- Prices
- Bookings
- Scheduling
- Holidays
- Reports
- Notifications
- Salon settings

Admin is the final authority for:
- Role assignment
- Barber type
- Permission assignment
- Salon configuration

---

# 5. Salon Manager

Salon Manager is intended for daily operational management.

Manager access is NOT a separate hard-coded full-access role.

Admin defines the manager's permissions.

Potential permissions:

- View dashboard
- View bookings
- Create manual bookings
- Edit bookings
- Cancel bookings
- View customers
- View barbers
- View schedules
- View services
- Operational reports

By default, manager should not access sensitive administration such as:

- Role management
- Permission management
- Admin management
- Core system settings

unless Admin explicitly grants such access.

---

# 6. Barber Model

There is only ONE system role for a barber:

`Barber`

There are NOT separate "Professional Barber" and "Regular Barber" roles.

Instead, Barber has:

`barberType = professional | regular`

and a separate permission set.

This distinction is important.

## Professional Barber

A professional barber is a barber with greater operational independence.

Depending on permissions assigned by Admin, they may be allowed to:

- Choose their own services
- Set their own prices
- Set working days
- Set working hours
- Manage time off
- Block time slots
- Manage their availability
- Cancel their own appointments if permitted

## Regular Barber

A regular barber generally works under salon control.

Admin normally decides:

- Services
- Pricing
- Working days
- Working hours
- Availability

The regular barber mainly:

- Views their own bookings
- Views relevant customers
- Starts services
- Ends services
- Views their own schedule

## Critical rule

Professional status does NOT automatically grant unlimited permissions.

Example:

Professional Barber:

- Manage services: YES
- Manage pricing: YES
- Manage schedule: YES
- Manage time off: YES
- Block slots: NO
- Cancel confirmed bookings: NO

Admin decides these permissions individually.

---

# 7. Barber Permissions

Potential barber permissions:

- `view_own_dashboard`
- `view_own_bookings`
- `view_own_customers`
- `view_own_history`
- `manage_services`
- `manage_pricing`
- `manage_schedule`
- `manage_time_off`
- `block_slots`
- `cancel_own_bookings`
- `start_service`
- `end_service`
- `view_service_history`

Permissions can be expanded later.

A barber should not automatically have access to:
- All salon customers
- Other barbers' private data
- All salon reports
- System settings
- User/role management

---

# 8. Public Website

Visitors who are not logged in can:

- View Landing Page
- View salon information
- View services
- View service details
- View prices
- View barbers
- View barber profiles
- See services offered by a barber
- Start the booking process
- Register
- Login

---

# 9. Customer Registration

Required information:

- First name
- Last name
- Mobile number
- Password

New registration automatically creates:

`role = customer`

Required profile information must be complete before final booking confirmation.

---

# 10. Booking UX

The booking process supports two entry paths.

## Path A — Barber First

```text
Select Barber
      ↓
Show services offered by that barber
      ↓
Select Service
```

## Path B — Service First

```text
Select Service
      ↓
Show barbers who offer that service
      ↓
Select Barber
```

After both barber and service are selected:

```text
Select Date
      ↓
Show Available Time Slots
      ↓
Select Time Slot
      ↓
Optional Description
      ↓
Submit Booking
```

If the customer is not logged in:

```text
Submit Booking
      ↓
Login / Register
      ↓
Complete required information
      ↓
Confirm Booking
```

Recommended UX:
Allow the customer to choose service/barber/date/time before forcing authentication. Authentication should happen at final booking confirmation.

---

# 11. Fixed Time Slot System

Time slots are globally fixed.

The slot structure cannot be customized by:
- Customer
- Barber
- Manager
- Admin

Example:

```text
09:00 - 10:00
10:00 - 11:00
11:00 - 12:00
12:00 - 13:00
13:00 - 14:00
14:00 - 15:00
...
```

Users cannot create arbitrary slots such as:

```text
09:15 - 10:15
09:30 - 11:00
```

This is a hard business rule.

---

# 12. Scheduling

Each barber may have a schedule.

Depending on permissions, the schedule can be controlled by Admin or the barber.

Schedule contains:

- Working days
- Working hours
- Active slots
- Time off
- Blocked slots

Example:

```text
Saturday
09:00 Available
10:00 Available
11:00 Blocked
12:00 Available
13:00 Available
```

---

# 13. Availability Engine

Availability is one of the most important pieces of the system.

Available slots are calculated from:

```text
Working Days
+
Working Hours
+
Fixed Time Slots
-
Breaks / Blocked Slots
-
Barber Time Off
-
Salon Holidays
-
Existing Bookings
=
Available Slots
```

The customer must only see valid available slots.

The frontend should not be responsible for deciding availability independently.

The server/business logic must be authoritative.

---

# 14. Barber Slot Blocking

A barber may be allowed to block a slot.

Example:

```text
Saturday

09:00 Available
10:00 Available
11:00 Blocked by Barber
12:00 Available
```

If a slot already has a confirmed booking, the system must not silently remove the booking.

Instead:

```text
Existing Booking
      ↓
Barber attempts to block/cancel slot
      ↓
System warns about existing booking
      ↓
Explicit cancellation/rescheduling flow
      ↓
Customer notification
```

---

# 15. Holidays

Two concepts must exist.

## Salon Holiday

The whole salon is closed.

Example:

```text
2026-03-21
Salon Closed
```

## Barber Time Off

Only a specific barber is unavailable.

Example:

```text
Ali
2026-04-05
Time Off
```

Both affect availability.

---

# 16. Customer Panel

Customer dashboard contains:

## Dashboard

- Next appointment
- Date
- Time
- Barber
- Service
- Status

## Upcoming Bookings

- View details
- Cancel booking when allowed

## Booking History

- Previous services
- Barber
- Date
- Price
- Status

## Profile

- First name
- Last name
- Mobile
- Change password
- Logout

## Rating

Completed bookings can be rated.

---

# 17. Booking Status

Recommended statuses:

```text
Pending
Confirmed
In Progress
Completed
Cancelled
No-show
```

Normal lifecycle:

```text
Pending
   ↓
Confirmed
   ↓
In Progress
   ↓
Completed
```

Cancellation can occur according to business rules.

---

# 18. Start Service / End Service

Each appointment should have service lifecycle actions.

The barber controls:

`Start Service`

and:

`End Service`

Flow:

```text
Reserved
   ↓
Confirmed
   ↓
Start Service
   ↓
In Progress
   ↓
End Service
   ↓
Completed
```

The system stores actual timestamps.

Example:

```text
Started: 15:07
Ended:   15:52
Duration: 45 minutes
```

This can later support reporting and performance analytics.

---

# 19. Customer Rating

Rating is available only after:

`booking.status = completed`

Customer can submit:

- Rating: 1 to 5 stars
- Optional written review

Each booking can be rated only once.

Potential future rating categories:

- Service quality
- Barber behavior
- Cleanliness
- Overall satisfaction

For MVP:

`Overall rating 1–5 + optional comment`

is sufficient.

---

# 20. Services

Admin can manage:

- Service creation
- Editing
- Disabling
- Deleting
- Description
- Duration
- Base price
- Category
- Image

Barber may select/manage the services they personally offer if permission allows.

---

# 21. Pricing

The system should support both:

## Base Service Price

Example:

```text
Haircut
Base Price: 450,000
```

and potentially:

## Barber-Specific Price

```text
Haircut
Ali: 500,000
Reza: 450,000
```

Whether a barber can change their own prices is controlled by permission.

---

# 22. Barber ↔ Service Relationship

A barber can offer multiple services.

A service can be offered by multiple barbers.

Therefore the relationship should be many-to-many.

Conceptually:

```text
Barber
   ↕
BarberService
   ↕
Service
```

Example:

```text
Ali
- Haircut
- Beard
- Coloring

Reza
- Haircut
- Coloring
```

---

# 23. Barber Panel

Barber panel includes, according to permissions:

- Personal Dashboard
- Today's bookings
- Upcoming bookings
- Booking history
- Relevant customers
- Own services
- Own pricing
- Own schedule
- Time off
- Blocked slots
- Start Service
- End Service

---

# 24. Customer Data Visibility

Barber should only see customer information that is relevant to their own work.

For example:

A barber can see:
- Name
- Mobile if operationally necessary
- Their appointments
- Relevant booking history

A barber should not automatically see every customer's private data across the salon.

---

# 25. Admin Dashboard

Possible dashboard widgets:

- Today's bookings
- Upcoming bookings
- Completed services
- Cancelled bookings
- No-shows
- Customer count
- Barber count
- Revenue
- Popular services
- Today's barber schedule
- Average ratings

---

# 26. User Management

Admin can:

- Search users
- View users
- View profiles
- Activate/deactivate users
- Change roles
- Assign permissions
- Manage barbers
- Manage managers

Default:

```text
New registration → Customer
```

---

# 27. Booking Management

Admin and Manager can manage bookings according to their permissions.

Capabilities:

- View bookings
- Filter by date
- Filter by barber
- Filter by service
- Filter by status
- Create manual booking
- Edit booking
- Cancel booking
- Reschedule booking

Manual booking is important because customers may call or visit the salon directly.

---

# 28. Notification System

Notifications should be designed as an independent subsystem.

Potential channels:

1. PWA/Web Push
2. WhatsApp
3. SMS

Potential events:

- Booking created
- Booking confirmed
- Booking cancelled
- Booking rescheduled
- Appointment reminder
- Barber cancels a slot
- Service completed
- Rating request

Example:

```text
Booking Confirmed
      ↓
Push Notification
      +
Optional WhatsApp
      +
Optional SMS
```

---

# 29. PWA

The project should support PWA.

Target capabilities:

- Add to Home Screen
- App-like experience
- Responsive mobile UI
- Web Push notifications
- App icon
- Splash screen
- Android support
- iPhone support

PWA Push should be treated as a primary app-style notification channel.

---

# 30. WhatsApp

WhatsApp should be an additional notification channel.

Architecture should allow integration with an official WhatsApp Business API/provider.

Potential messages:

- Booking confirmation
- Booking reminder
- Cancellation
- Rescheduling
- Rating request

WhatsApp should not replace PWA Push; both can coexist.

---

# 31. Notification Preferences

Future settings can allow users/admins to define:

```text
Push: ON/OFF
WhatsApp: ON/OFF
SMS: ON/OFF
```

and event preferences such as:

```text
Booking Confirmation
24h Reminder
Cancellation
Reschedule
Rating Request
```

---

# 32. Reports

Admin reporting may include:

- Daily revenue
- Monthly revenue
- Total bookings
- Completed bookings
- Cancelled bookings
- No-shows
- Popular services
- Popular barbers
- New customers
- Returning customers
- Average barber rating
- Average service duration
- Actual service duration
- Booking conversion metrics

---

# 33. Salon Settings

Admin can manage:

- Salon name
- Logo
- Phone
- Address
- Social media
- Working hours
- Cancellation rules
- Notification settings
- General salon settings

---

# 34. Permission Examples

## Admin

Full access:

```text
Dashboard          YES
Users              YES
Roles              YES
Permissions        YES
Customers          YES
Barbers            YES
Services           YES
Pricing            YES
Bookings           YES
Scheduling         YES
Holidays           YES
Reports            YES
Notifications      YES
Settings           YES
```

## Manager

Example configuration:

```text
Dashboard          YES
Bookings           YES
Customers          YES
Barbers            VIEW
Services           VIEW
Pricing            VIEW
Scheduling         VIEW
Reports            LIMITED
Users              NO
Roles              NO
Permissions        NO
Settings           NO
```

Actual permissions are configurable by Admin.

## Regular Barber

Example:

```text
Own Dashboard      YES
Own Bookings       YES
Own Customers      YES
Start/End Service  YES

Manage Services    NO
Manage Pricing     NO
Manage Schedule    NO
Time Off           NO
Block Slots        NO
```

## Professional Barber

Example:

```text
Own Dashboard      YES
Own Bookings       YES
Own Customers      YES
Start/End Service  YES

Manage Services    YES
Manage Pricing     YES
Manage Schedule    YES
Time Off           YES
Block Slots        YES
```

Again, Admin can customize these permissions.

---

# 35. Core Data Model

Recommended conceptual entities:

```text
User
Role
Permission
RolePermission / UserPermission

CustomerProfile

BarberProfile
BarberService
BarberPermission
BarberType

SalonManagerProfile

Service
ServicePrice

WorkingSchedule
TimeSlot
TimeOff
Holiday

Booking
BookingStatus
ServiceSession

Review / Rating

Notification
NotificationPreference

SalonSettings
```

---

# 36. Important Relationships

```text
User
 └── Role

User
 └── Profile

Barber
 ├── BarberType
 ├── Permissions
 ├── Services
 ├── Schedule
 ├── TimeOff
 └── Bookings

Customer
 └── Bookings

Booking
 ├── Customer
 ├── Barber
 ├── Service
 ├── TimeSlot
 ├── ServiceSession
 └── Review
```

---

# 37. Core Business Rules

1. Every new public registration creates a Customer.
2. Only Admin can assign elevated roles.
3. Barber is one system role.
4. Barber has a type: Professional or Regular.
5. Barber type does not automatically grant unlimited access.
6. Admin controls barber permissions.
7. Admin controls Manager permissions.
8. Time slots are fixed globally.
9. Arbitrary appointment times are not allowed.
10. Customers only see available slots.
11. Availability is calculated by the system.
12. Existing confirmed bookings cannot silently disappear.
13. Barber controls Start Service and End Service when permitted.
14. Completed bookings can receive a rating.
15. Each booking can be rated once.
16. Barber customer visibility should be scoped to relevant customers.
17. Manual bookings must be supported.
18. Notification is an independent subsystem.
19. PWA Push is a primary notification channel.
20. WhatsApp/SMS are additional channels.
21. Permission enforcement must happen server-side.
22. Admin is the final authority over role and permissions.

---

# 38. Complete Customer Flow

```text
Landing Page
      ↓
Book Appointment
      ↓
Choose Barber OR Choose Service
      ↓
Choose Service OR Choose Barber
      ↓
Choose Date
      ↓
Show Available Fixed Slots
      ↓
Choose Slot
      ↓
Optional Description
      ↓
Login / Register if needed
      ↓
Confirm Booking
      ↓
Booking Created
      ↓
Notification
      ↓
Customer Dashboard
```

---

# 39. Complete Barber Flow

```text
Login
   ↓
Barber Dashboard
   ↓
Today's Bookings
   ↓
Customer Arrives
   ↓
Start Service
   ↓
In Progress
   ↓
End Service
   ↓
Completed
   ↓
Customer receives Rating Request
```

If permitted:

```text
Barber Dashboard
   ├── Services
   ├── Pricing
   ├── Schedule
   ├── Time Off
   └── Block Slots
```

---

# 40. Complete Admin Flow

```text
Admin Login
    ↓
Dashboard
    ↓
Users / Roles / Permissions
    ↓
Barbers
    ├── Professional / Regular
    └── Permissions
    ↓
Services / Pricing
    ↓
Scheduling
    ↓
Bookings
    ↓
Holidays
    ↓
Reports
    ↓
Notifications
    ↓
Salon Settings
```

---

# 41. Availability Example

Suppose:

```text
Barber: Ali
Working Hours: 09:00–18:00

Fixed Slots:
09–10
10–11
11–12
12–13
13–14
14–15
15–16
16–17
17–18

Time Off:
13–14

Existing Booking:
15–16

Blocked:
11–12
```

Customer sees:

```text
09–10 Available
10–11 Available
11–12 Unavailable
12–13 Available
13–14 Unavailable
14–15 Available
15–16 Unavailable
16–17 Available
17–18 Available
```

---

# 42. Recommended MVP Priorities

## Phase 1 — Foundation

- Authentication
- Users
- Roles
- Permissions
- Customer
- Barber
- Admin

## Phase 2 — Booking Core

- Services
- Barber ↔ Service
- Fixed Time Slots
- Schedule
- Availability
- Booking
- Booking status

## Phase 3 — Panels

- Customer Dashboard
- Barber Dashboard
- Admin Dashboard
- Manager Dashboard

## Phase 4 — Service Tracking

- Start Service
- End Service
- Service Session
- Completed status

## Phase 5 — Reviews

- Rating
- Review
- Barber rating summary

## Phase 6 — Notifications

- PWA Push
- Notification preferences
- Event-based notifications

## Phase 7 — Advanced Integrations

- WhatsApp
- SMS
- Advanced reporting

---

# 43. Architecture Principles

The project should be modular.

Main domains:

```text
Authentication
Authorization
Users
Customers
Barbers
Services
Pricing
Scheduling
Availability
Bookings
Service Sessions
Reviews
Notifications
Reports
Salon Settings
```

Booking and Availability are the operational core.

Authorization and Scheduling should be designed carefully from the beginning because they affect almost every other domain.

---

# 44. Key Product Decision

The most important conceptual model is:

```text
ROLE
+
TYPE
+
PERMISSIONS
```

For example:

```text
User:
  role = barber
  barberType = professional
  permissions = [
    manage_services,
    manage_pricing,
    manage_schedule,
    manage_time_off,
    block_slots
  ]
```

Versus:

```text
User:
  role = barber
  barberType = regular
  permissions = [
    view_own_bookings,
    view_own_customers,
    start_service,
    end_service
  ]
```

This provides flexibility without creating unnecessary roles.

---

# 45. Final Product Structure

```text
BARBERSHOP
│
├── PUBLIC WEBSITE
│   ├── Landing
│   ├── Services
│   ├── Barbers
│   └── Booking
│
├── CUSTOMER
│   ├── Dashboard
│   ├── Upcoming Bookings
│   ├── History
│   ├── Profile
│   └── Rating
│
├── BARBER
│   ├── Dashboard
│   ├── Own Bookings
│   ├── Own Customers
│   ├── Services
│   ├── Pricing
│   ├── Schedule
│   ├── Time Off
│   ├── Block Slots
│   └── Start/End Service
│
├── SALON MANAGER
│   ├── Dashboard
│   ├── Bookings
│   ├── Customers
│   ├── Barbers
│   ├── Schedule
│   └── Other Granted Permissions
│
└── ADMIN
    ├── Dashboard
    ├── Users
    ├── Roles
    ├── Permissions
    ├── Customers
    ├── Barbers
    ├── Managers
    ├── Services
    ├── Pricing
    ├── Bookings
    ├── Scheduling
    ├── Holidays
    ├── Reports
    ├── Notifications
    └── Salon Settings
```

---

# 46. Product Summary

The final system works around one central concept:

**A customer books a service with a specific barber in a valid fixed time slot.**

The system then manages the complete lifecycle:

```text
Discover
→ Select
→ Book
→ Confirm
→ Start Service
→ End Service
→ Complete
→ Rate
→ Notify
→ Report
```

Meanwhile:

- Admin controls the entire system.
- Manager handles salon operations according to Admin permissions.
- Barber handles their own work according to Admin permissions.
- Professional Barber can be given operational independence.
- Regular Barber can remain fully controlled by the salon.
- Customer has access only to their own account and bookings.

This scope is the reference specification for future UI/UX, database design, API design, authentication, authorization, PWA implementation, and development decisions.
